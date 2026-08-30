import db from './db';
import { evaluatePatient, PatientEvaluationInput } from './decision_engine/index';

export interface Alert {
  id: string;
  patient_id: string;
  type: 'DETERIORATION' | 'WAIT_TIME';
  message: string;
  recommendation_id?: string;
  created_at: string;
}

export let activeAlerts: Alert[] = [];
export let isSimRunning = false;
export let simMultiplier = 1; // 1 real sec = 1 sim min
export let simOffsetMs = 0; // The sum of simulated ms advanced
export let lastTick = Date.now();
export let activeSimInterval: any = null;

// Helper to generate an ID
const genId = (prefix: string) => `${prefix}-${Date.now()}`;

// Returns the current simulated ISO string
export const getSimNow = () => {
  return new Date(Date.now() + simOffsetMs).toISOString();
};

export const getSimNowMs = () => {
  return Date.now() + simOffsetMs;
};

// Start simulation
export const startSimulation = () => {
  if (isSimRunning) return;
  isSimRunning = true;
  lastTick = Date.now();
  activeSimInterval = setInterval(simulationTick, 1000); // run every second
};

export const pauseSimulation = () => {
  isSimRunning = false;
  if (activeSimInterval) clearInterval(activeSimInterval);
};

export const resetSimulation = () => {
  pauseSimulation();
  simOffsetMs = 0;
  activeAlerts = [];
  // For a full reset we would probably clear the DB and re-seed, but offset reset is fine for now
};

export const setMultiplier = (mult: number) => {
  simMultiplier = mult;
};

// ESI wait time limits in ms (simulated time)
const WAIT_LIMITS: Record<number, number> = {
  1: 1 * 60000,
  2: 15 * 60000,
  3: 60 * 60000,
  4: 90 * 60000,
  5: 120 * 60000
};

// Holds our scripted trajectories
const scripts = {
  // We'll target pat-1 (e.g. respiratory issue) and make them deteriorate over time
  'pat-1': [
    { delayMins: 15, run: false, vitals: { hr: 125, bp_sys: 110, bp_dia: 70, rr: 26, spo2: 92, temp: 99.0, pain_score: 4 } }, // Drop spo2, raise HR
    { delayMins: 30, run: false, vitals: { hr: 140, bp_sys: 105, bp_dia: 65, rr: 32, spo2: 88, temp: 99.0, pain_score: 5 } }  // Severe hypoxia
  ],
  // pat-5 (e.g. chest pain but mild vitals initially)
  'pat-5': [
    { delayMins: 10, run: false, vitals: { hr: 110, bp_sys: 160, bp_dia: 95, rr: 20, spo2: 98, temp: 98.6, pain_score: 8 } },
  ]
};

// Tracks which scripts have run
const scriptedEventsFired = new Set<string>();

const checkWaitTimes = (nowMs: number) => {
  const query = `
    SELECT p.id, p.name, 
      (SELECT acuity_score FROM recommendations WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) as current_esi,
      (SELECT created_at FROM recommendations WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) as last_triage_time,
      (SELECT action_type FROM nurse_actions WHERE recommendation_id = (SELECT id FROM recommendations WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1) as triage_status
    FROM patients p
  `;
  const patients = db.prepare(query).all() as any[];

  patients.forEach(p => {
    // Only monitor waiting patients (ACCEPTED into queue, or PENDING triage)
    if (p.triage_status === 'ACCEPTED' || !p.triage_status || p.triage_status === 'PENDING') {
      if (!p.current_esi || !p.last_triage_time) return;
      
      const esiLimit = WAIT_LIMITS[p.current_esi] || WAIT_LIMITS[5]; // fallback to ESI 5 safely
      const triageTimeMs = new Date(p.last_triage_time).getTime();
      const waitTimeMs = nowMs - triageTimeMs;

      if (waitTimeMs > esiLimit) {
        // Only one active wait time alert per patient
        const existing = activeAlerts.find(a => a.patient_id === p.id && a.type === 'WAIT_TIME');
        if (!existing) {
          const alertId = genId('alert');
          const msg = `Re-assessment needed: Patient wait time exceeded safe threshold for ESI ${p.current_esi}.`;
          activeAlerts.push({ id: alertId, patient_id: p.id, type: 'WAIT_TIME', message: msg, created_at: getSimNow() });
          
          db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(genId('audit'), p.id, 'WAIT_TIME_ALERT_TRIGGERED', 'SYSTEM_MONITOR', null, null, msg, getSimNow());
        }
      }
    }
  });
};

export const triggerDeterioration = (patientId: string, vitalsData: any, nowIso: string) => {
  try {
    const patient = db.prepare('SELECT age, has_prior_history FROM patients WHERE id = ?').get(patientId) as any;
    if (!patient) return;

    // Get current ESI to see if we worsened
    const currentRec = db.prepare('SELECT acuity_score FROM recommendations WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1').get(patientId) as any;
    const previousEsi = currentRec ? currentRec.acuity_score : 5;

    // Insert new vitals
    const vId = genId('vit');
    db.prepare('INSERT INTO vitals_readings (id, patient_id, hr, bp_sys, bp_dia, rr, spo2, temp, pain_score, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(vId, patientId, vitalsData.hr, vitalsData.bp_sys, vitalsData.bp_dia, vitalsData.rr, vitalsData.spo2, vitalsData.temp, vitalsData.pain_score, nowIso);

    // Evaluate
    const snaps = db.prepare(`
      SELECT cs.zone_name, cs.beds_free
      FROM capacity_snapshots cs
      INNER JOIN (
        SELECT zone_name, MAX(recorded_at) as max_time 
        FROM capacity_snapshots 
        GROUP BY zone_name
      ) latest 
      ON cs.zone_name = latest.zone_name AND cs.recorded_at = latest.max_time
    `).all();
    const capacities: Record<string, number> = {};
    snaps.forEach((s: any) => { capacities[s.zone_name] = s.beds_free; });

    const input: PatientEvaluationInput = {
      age: patient.age,
      vitals: vitalsData,
      redFlags: [], // Simplified for scripted deterioration, could fetch from DB
      symptoms: [],
      hasPriorHistory: patient.has_prior_history === 1,
      capacities
    };

    const evaluation = evaluatePatient(input);
    const rId = genId('rec');
    const suggestedRouting = evaluation.suggested_routing;
    const rationale = evaluation.key_drivers.join('. ');

    db.transaction(() => {
      // 1. Write the new recommendation (this enters the pending triage flow)
      const stmt = db.prepare('INSERT INTO recommendations (id, patient_id, acuity_score, confidence_pct, rationale_text, key_drivers, escalated, escalation_reason, suggested_routing, is_capacity_adjusted, model_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(rId, patientId, evaluation.acuity_score, evaluation.confidence_pct, rationale, JSON.stringify(evaluation.key_drivers), evaluation.escalated ? 1 : 0, evaluation.escalation_reason, suggestedRouting, evaluation.is_capacity_adjusted ? 1 : 0, evaluation.model_version, nowIso);
      
      const aStmt = db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      aStmt.run(genId('audit'), patientId, 'RECOMMENDATION_GENERATED', evaluation.model_version, null, JSON.stringify({ recommended_esi: evaluation.acuity_score, confidence: evaluation.confidence_pct }), rationale, nowIso);
      
      // 2. Check if we worsened (lower ESI number is more urgent)
      if (evaluation.acuity_score < previousEsi) {
        const msg = `Vitals deteriorated. Acuity escalated from ESI ${previousEsi} to ESI ${evaluation.acuity_score}.`;
        const alertId = genId('alert');
        activeAlerts.push({ id: alertId, patient_id: patientId, type: 'DETERIORATION', message: msg, recommendation_id: rId, created_at: nowIso });
        
        aStmt.run(genId('audit'), patientId, 'DETERIORATION_ALERT_TRIGGERED', 'SYSTEM_MONITOR', String(previousEsi), String(evaluation.acuity_score), msg, nowIso);
      }
    })();
    
  } catch (err) {
    console.error('Failed to trigger scripted deterioration', err);
  }
};

const runScripts = (nowMs: number, nowIso: string) => {
  // A simplistic scripting engine based on total simulated time elapsed since start.
  // For robustness, we check the total simOffsetMs (in minutes).
  const simMinsElapsed = Math.floor(simOffsetMs / 60000);

  for (const [pId, steps] of Object.entries(scripts)) {
    steps.forEach((step, index) => {
      const eventKey = `${pId}_${index}`;
      if (!scriptedEventsFired.has(eventKey) && simMinsElapsed >= step.delayMins) {
        triggerDeterioration(pId, step.vitals, nowIso);
        scriptedEventsFired.add(eventKey);
      }
    });
  }
};

const simulationTick = () => {
  const now = Date.now();
  const deltaRealMs = now - lastTick;
  lastTick = now;

  // 1 real sec * multiplier (e.g. 1 min) = sim offset
  // If multiplier is 60, then 1 real second adds 60,000 sim ms (1 min).
  // If multiplier is 1 (e.g. 1 real sec = 1 sim min => that means 60x multiplier basically)
  // Let's treat `simMultiplier` as "simulated minutes per real second".
  // So if multiplier = 1, we add 1 minute (60000ms) for every 1 real second (1000ms).
  const simMsToAdd = (deltaRealMs / 1000) * simMultiplier * 60000;
  simOffsetMs += simMsToAdd;

  const currentSimMs = getSimNowMs();
  const currentSimIso = getSimNow();

  checkWaitTimes(currentSimMs);
  runScripts(currentSimMs, currentSimIso);
};

export const dismissAlert = (alertId: string, actor: string) => {
  const alertIndex = activeAlerts.findIndex(a => a.id === alertId);
  if (alertIndex > -1) {
    const alert = activeAlerts[alertIndex];
    activeAlerts.splice(alertIndex, 1);
    
    // Write audit log
    db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(genId('audit'), alert.patient_id, 'ALERT_DISMISSED', actor, alert.type, 'DISMISSED', 'Nurse acknowledged and dismissed alert', getSimNow());
    return true;
  }
  return false;
};
