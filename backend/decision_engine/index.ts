export type AgeBracket = 'pediatric' | 'adult' | 'geriatric';

export interface VitalsInput {
  hr: number | null;
  bp_sys: number | null;
  bp_dia: number | null;
  rr: number | null;
  spo2: number | null;
  temp: number | null; // Fahrenheit
  pain_score: number | null;
}

export interface PatientEvaluationInput {
  age: number;
  vitals: VitalsInput;
  redFlags: string[];
  lifeThreateningFlags?: string[]; // ESI-1 immediate life-threats
  symptoms: string[];
  hasPriorHistory: boolean;
  capacities?: Record<string, number>; // zoneName -> beds_free
}

export interface PatientEvaluationOutput {
  acuity_score: number; // 1-5
  confidence_pct: number;
  key_drivers: string[];
  escalated: boolean;
  escalation_reason: string | null;
  suggested_routing: string;
  is_capacity_adjusted: boolean;
  model_version: string;
}

// 1. Determine age bracket
export function getAgeBracket(age: number): AgeBracket {
  if (age < 12) return 'pediatric';
  if (age < 65) return 'adult';
  return 'geriatric';
}

// 2. Score vitals (0 = normal, 1 = mild, 2 = severe)
export function scoreHeartRate(hr: number, bracket: AgeBracket): number {
  if (bracket === 'pediatric') {
    if (hr >= 70 && hr <= 120) return 0;
    if (hr > 120 && hr <= 140) return 1;
    if (hr < 70 || hr > 140) return 2;
  } else {
    // Adult and Geriatric
    if (hr >= 60 && hr <= 100) return 0;
    if (hr > 100 && hr <= 120) return 1;
    if (hr < 50 || hr > 120) return 2; // severe bradycardia or tachycardia
  }
  return 0;
}

export function scoreRespiratoryRate(rr: number, bracket: AgeBracket): number {
  if (bracket === 'pediatric') {
    if (rr >= 20 && rr <= 30) return 0;
    if (rr > 30 && rr <= 40) return 1;
    if (rr < 15 || rr > 40) return 2;
  } else {
    if (rr >= 12 && rr <= 20) return 0;
    if (rr > 20 && rr <= 24) return 1;
    if (rr < 10 || rr > 24) return 2;
  }
  return 0;
}

export function scoreOxygen(spo2: number): number {
  if (spo2 >= 95) return 0;
  if (spo2 >= 90) return 1; // Mild hypoxia
  return 2; // Severe hypoxia
}

// Evaluate Patient Logic
export function evaluatePatient(input: PatientEvaluationInput): PatientEvaluationOutput {
  const bracket = getAgeBracket(input.age);
  const drivers: string[] = [];

  // 1 & 2. Score Vitals
  let vitalScore = 0;
  let missingVitals = 0;

  if (input.vitals.hr !== null) {
    const s = scoreHeartRate(input.vitals.hr, bracket);
    vitalScore += s;
    if (s > 0) drivers.push(`HR ${s === 1 ? 'mildly' : 'severely'} abnormal`);
  } else {
    missingVitals++;
  }

  if (input.vitals.rr !== null) {
    const s = scoreRespiratoryRate(input.vitals.rr, bracket);
    vitalScore += s;
    if (s > 0) drivers.push(`RR ${s === 1 ? 'mildly' : 'severely'} abnormal`);
  } else {
    missingVitals++;
  }

  if (input.vitals.spo2 !== null) {
    const s = scoreOxygen(input.vitals.spo2);
    vitalScore += s;
    if (s > 0) drivers.push(`SpO2 ${s === 1 ? 'mildly' : 'severely'} low`);
  } else {
    missingVitals++;
  }

  // Pain scoring
  if (input.vitals.pain_score !== null) {
    if (input.vitals.pain_score >= 8) {
      vitalScore += 2;
      drivers.push('Severe Pain (8+)');
    }
  }

  // 3 & 4. Raw Acuity Computation
  // Non-red-flag symptoms add small weight (+1 point per symptom, up to 2 max)
  const symptomWeight = Math.min(input.symptoms.length, 2);
  const rawAggregateScore = vitalScore + symptomWeight;

  // Map aggregate to ESI (5-level)
  // 6 or more points is a severely unstable patient -> ESI 1
  let rawEsi = 5;
  if (rawAggregateScore >= 6) rawEsi = 1;
  else if (rawAggregateScore >= 4) rawEsi = 3;
  else if (rawAggregateScore >= 2) rawEsi = 4;
  else rawEsi = 5;

  // 5. Compute Confidence Value
  let confidence = 100;
  
  // Penalize for missing vitals
  confidence -= (missingVitals * 10);
  
  // Penalize for zero-history patient
  if (!input.hasPriorHistory) {
    confidence -= 15;
  }

  // Consistency penalty: high symptoms but perfect vitals
  if (input.symptoms.length >= 2 && vitalScore === 0) {
    confidence -= 20;
    drivers.push('Symptom/Vital Disconnect');
  }

  // Bound confidence
  confidence = Math.max(0, Math.min(100, confidence));

  // 6. Escalation Rules
  let finalEsi = rawEsi;
  let escalated = false;
  let reasons: string[] = [];

  const hasRedFlag = input.redFlags.length > 0;
  const hasLifeThreat = input.lifeThreateningFlags && input.lifeThreateningFlags.length > 0;

  // Rule A1: Immediate Life-Threat Floor
  if (hasLifeThreat) {
    if (finalEsi > 1) {
      finalEsi = 1;
      escalated = true;
      reasons.push(`Life-threatening flag present: ${input.lifeThreateningFlags!.join(', ')}`);
      drivers.push('Immediate Life Threat');
    }
  }
  // Rule A2: Standard Red-Flag Hard Floor
  else if (hasRedFlag) {
    // Red flag forces ESI to be AT LEAST 2. (Uses Math.min logic)
    // If raw is 3, 4, 5, it becomes 2. If it's already 1, it stays 1.
    if (finalEsi > 2) {
      finalEsi = Math.min(finalEsi, 2);
      escalated = true;
      reasons.push(`Red flag present: ${input.redFlags.join(', ')}`);
      drivers.push('Critical Red Flag');
    }
  }

  // Rule B: Confidence Bump (Uncertainty)
  if (confidence < 60) {
    // Uncertainty biases upward. Decrement ESI (more urgent) by 1.
    // E.g. If red flag floored us at 2, we now go to 1.
    if (finalEsi > 1) {
      finalEsi -= 1;
      escalated = true;
      reasons.push('Low confidence (<60%) triggered urgency bump');
    }
  }

  if (drivers.length === 0) drivers.push('Vitals normal, no distress');

  // 7. Capacity-Aware Routing
  let idealZone = 'Fast Track';
  if (finalEsi === 1) idealZone = 'Resus';
  else if (finalEsi === 2 || finalEsi === 3) idealZone = 'Acute';

  let suggested_routing = idealZone;
  let is_capacity_adjusted = false;

  if (input.capacities) {
    const cascade = ['Resus', 'Acute', 'Fast Track', 'Waiting/Observation'];
    let currentIdx = cascade.indexOf(idealZone);
    if (currentIdx === -1) currentIdx = 2; // fallback
    
    // Check if ideal zone is full
    if ((input.capacities[cascade[currentIdx]] || 0) <= 0) {
      let foundAlternative = false;
      for (let i = currentIdx + 1; i < cascade.length; i++) {
        if ((input.capacities[cascade[i]] || 0) > 0) {
          suggested_routing = `Clinically indicated: ${idealZone}. ${idealZone} at capacity — recommend ${cascade[i]} (Capacity-Adjusted)`;
          is_capacity_adjusted = true;
          foundAlternative = true;
          break;
        }
      }
      if (!foundAlternative) {
        suggested_routing = `Clinically indicated: ${idealZone}. All zones at capacity — recommend Waiting/Observation (Capacity-Adjusted)`;
        is_capacity_adjusted = true;
      }
    }
  } else {
    // If no capacity data, just use ideal
    if (finalEsi <= 2) suggested_routing = 'Acute Care Zone'; // fallback for tests
  }

  return {
    acuity_score: finalEsi,
    confidence_pct: confidence,
    key_drivers: drivers,
    escalated,
    escalation_reason: escalated ? reasons.join(' | ') : null,
    suggested_routing,
    is_capacity_adjusted,
    model_version: 'decision_engine_v1'
  };
}
