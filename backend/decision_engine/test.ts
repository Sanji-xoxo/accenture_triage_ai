import { evaluatePatient, PatientEvaluationInput } from './index';

function runTests() {
  console.log('--- Running Decision Engine Tests ---');
  let passCount = 0;
  let totalCount = 0;

  function assertEqual(actual: any, expected: any, testName: string) {
    totalCount++;
    if (actual === expected) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName} - Expected ${expected}, got ${actual}`);
    }
  }

  function assertTrue(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // Common baseline vitals
  const baselineVitals = { hr: 135, bp_sys: 110, bp_dia: 70, rr: 25, spo2: 98, temp: 98.6, pain_score: 2 };

  // SCENARIO 1: Identical vitals producing different scores (Pediatric vs Adult)
  const pediatricInput: PatientEvaluationInput = { age: 6, vitals: baselineVitals, redFlags: [], symptoms: [], hasPriorHistory: true };
  const adultInput: PatientEvaluationInput = { age: 40, vitals: baselineVitals, redFlags: [], symptoms: [], hasPriorHistory: true };
  
  const pedEval = evaluatePatient(pediatricInput); // HR 135 is normal for pediatric (<=140 is normal/mild)
  const adEval = evaluatePatient(adultInput); // HR 135 is severe for adult (>120)

  assertTrue(pedEval.acuity_score > adEval.acuity_score, 'Scenario 1: Adult with HR 135 is scored more urgent (lower ESI) than Pediatric with HR 135');

  // SCENARIO 2: Red flag but mild vitals escalates
  const mildVitals = { hr: 105, bp_sys: 120, bp_dia: 80, rr: 20, spo2: 98, temp: 98.6, pain_score: 2 };
  const redFlagInput: PatientEvaluationInput = { age: 40, vitals: mildVitals, redFlags: ['Chest Pain'], symptoms: [], hasPriorHistory: true };
  const rfEval = evaluatePatient(redFlagInput);
  assertTrue(rfEval.escalated, 'Scenario 2: Red flag triggers escalation');
  assertEqual(rfEval.acuity_score, 2, 'Scenario 2: Red flag floors score to ESI 2');

  // SCENARIO 3: Zero-history patient with missing data drops confidence and escalates
  const missingVitalsInput: PatientEvaluationInput = { 
    age: 40, 
    vitals: { hr: null, bp_sys: null, bp_dia: null, rr: null, spo2: null, temp: null, pain_score: 5 }, 
    redFlags: [], 
    symptoms: ['dizziness'], 
    hasPriorHistory: false // zero history
  };
  const missingEval = evaluatePatient(missingVitalsInput);
  assertTrue(missingEval.confidence_pct < 60, `Scenario 3: Confidence fell below 60% (was ${missingEval.confidence_pct}%) due to zero-history and missing vitals`);
  assertTrue(missingEval.escalated, 'Scenario 3: Low confidence triggered escalation');

  // SCENARIO 4: Uncertainty strictly biases upward (never de-escalates)
  // We can show this by comparing a high confidence vs low confidence patient
  const highConfInput: PatientEvaluationInput = { age: 30, vitals: mildVitals, redFlags: [], symptoms: [], hasPriorHistory: true };
  const lowConfInput: PatientEvaluationInput = { 
    ...highConfInput, 
    vitals: { hr: 80, bp_sys: 120, bp_dia: 80, pain_score: 0, temp: 98.6, spo2: null, rr: null }, // vitalScore=0, Missing=20
    hasPriorHistory: false, // Drop by 15
    symptoms: ['pain', 'nausea', 'headache'] // Disconnect penalty=20. Total drop=55. Conf=45.
  }; 
  const hcEval = evaluatePatient(highConfInput);
  const lcEval = evaluatePatient(lowConfInput);
  assertTrue(lcEval.acuity_score < hcEval.acuity_score, `Scenario 4: Uncertainty bias ESI upward (Low conf ESI ${lcEval.acuity_score} vs High conf ESI ${hcEval.acuity_score})`);
  assertTrue(lcEval.escalation_reason?.includes('Low confidence') ?? false, 'Scenario 4: Escalation reason explicitly states low confidence');

  // SCENARIO 5: Red flag patient with completely normal vitals lands at ESI 2 or better
  const perfectVitals = { hr: 80, bp_sys: 120, bp_dia: 80, rr: 16, spo2: 99, temp: 98.6, pain_score: 0 };
  const normalVitalsRedFlag: PatientEvaluationInput = { age: 45, vitals: perfectVitals, redFlags: ['Altered Mental Status'], symptoms: [], hasPriorHistory: true };
  const nvrfEval = evaluatePatient(normalVitalsRedFlag);
  assertTrue(nvrfEval.acuity_score <= 2, `Scenario 5: Completely normal vitals but with Red Flag yields ESI ${nvrfEval.acuity_score} (Expected <= 2)`);
  assertTrue(nvrfEval.escalated, 'Scenario 5: Red flag safely escalated the baseline normal vitals');
  
  // Rule C (Both together): Red flag (floors at 2) + Low Confidence (bumps -1) -> ESI 1
  const doubleTroubleInput: PatientEvaluationInput = { 
    age: 45, 
    vitals: { ...perfectVitals, rr: null, spo2: null, temp: null }, // Missing vitals drop conf by 30
    redFlags: ['Chest Pain'], 
    symptoms: ['sweating', 'nausea', 'dizziness'], // disconnect drops by 20
    hasPriorHistory: false // drops by 15. Total confidence: 100 - 30 - 20 - 15 = 35 < 60
  };
  const doubleTroubleEval = evaluatePatient(doubleTroubleInput);
  assertEqual(doubleTroubleEval.acuity_score, 1, 'Scenario C: Both red flag and low confidence trigger simultaneously to yield ESI 1');

  // SCENARIO 6: Severely abnormal vitals (ESI 1 baseline) + red flag stays ESI 1, not pulled up to ESI 2
  const severelyAbnormalVitals = { hr: 160, bp_sys: 60, bp_dia: 30, rr: 40, spo2: 85, temp: 104.0, pain_score: 10 };
  const esi1RedFlagInput: PatientEvaluationInput = { age: 30, vitals: severelyAbnormalVitals, redFlags: ['Chest Pain'], symptoms: [], hasPriorHistory: true };
  const esi1Eval = evaluatePatient(esi1RedFlagInput);
  assertEqual(esi1Eval.acuity_score, 1, 'Scenario 6: Severely abnormal vitals + red flag stays ESI 1, not pulled up to ESI 2');

  // SCENARIO 7: Life-Threatening Flag floors to ESI 1 immediately
  const normalVitalsLifeThreatInput: PatientEvaluationInput = { 
    age: 30, vitals: perfectVitals, redFlags: [], lifeThreateningFlags: ['Unresponsive'], symptoms: [], hasPriorHistory: true 
  };
  const lifeThreatEval = evaluatePatient(normalVitalsLifeThreatInput);
  assertEqual(lifeThreatEval.acuity_score, 1, 'Scenario 7: Life-threatening flag floors directly to ESI 1');

  console.log(`\n--- Test Results: ${passCount}/${totalCount} Passed ---`);
}

runTests();
