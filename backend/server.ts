import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db, { initDb } from './db';
import { evaluatePatient, PatientEvaluationInput } from './decision_engine/index';
import { getSimNow, isSimRunning, simMultiplier, simOffsetMs, startSimulation, pauseSimulation, resetSimulation, setMultiplier, activeAlerts, dismissAlert } from './simulation';
import { GoogleGenerativeAI } from '@google/generative-ai';

initDb();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

// Helpers
const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// ==========================================
// 1. POST /api/patients (Create/Intake)
// ==========================================
app.post('/api/patients', (req, res) => {
  const { name, age, gender, sex, arrival_mode, chief_complaint_raw, nurse_observation, has_prior_history, history_summary, vitals } = req.body;
  const pId = genId('pat');
  const ts = getSimNow();
  const patientSex = sex || gender;

  try {
    db.transaction(() => {
      // Insert patient
      const stmt = db.prepare('INSERT INTO patients (id, name, age, sex, arrival_mode, chief_complaint_raw, nurse_observation, has_prior_history, history_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(pId, name, age, patientSex, arrival_mode, chief_complaint_raw, nurse_observation || null, has_prior_history ? 1 : 0, history_summary || null, ts);

      // Insert initial vitals if provided
      if (vitals) {
        const vId = genId('vit');
        const vStmt = db.prepare('INSERT INTO vitals_readings (id, patient_id, hr, bp_sys, bp_dia, rr, spo2, temp, pain_score, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        vStmt.run(vId, pId, vitals.hr, vitals.bp_sys, vitals.bp_dia, vitals.rr, vitals.spo2, vitals.temp, vitals.pain_score, ts);
      }
    })();
    res.status(201).json({ id: pId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. GET /api/patients (List with filters)
// ==========================================
app.get('/api/patients', (req, res) => {
  const { status, acuity } = req.query;
  
  let query = `
    SELECT p.*, 
           (SELECT json_object('hr', hr, 'bp_sys', bp_sys, 'bp_dia', bp_dia, 'rr', rr, 'spo2', spo2, 'temp', temp, 'pain_score', pain_score) FROM vitals_readings WHERE patient_id = p.id ORDER BY recorded_at DESC LIMIT 1) as latest_vitals,
           (SELECT json_object('id', id, 'acuity_score', acuity_score, 'confidence_pct', confidence_pct, 'escalated', escalated, 'escalation_reason', escalation_reason, 'suggested_routing', suggested_routing) FROM recommendations WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) as latest_recommendation,
           (SELECT action_type FROM nurse_actions WHERE recommendation_id = (SELECT id FROM recommendations WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1) as triage_status
    FROM patients p
  `;
  
  try {
    const patients = db.prepare(query).all().map((p: any) => {
      const rawStatus = p.triage_status ? p.triage_status.toUpperCase() : 'PENDING';
      let mappedStatus = rawStatus;
      if (rawStatus === 'ACCEPT') mappedStatus = 'ACCEPTED';
      if (rawStatus === 'MODIFY') mappedStatus = 'MODIFIED';
      if (rawStatus === 'OVERRIDE') mappedStatus = 'OVERRIDDEN';

      return {
        ...p,
        has_prior_history: p.has_prior_history === 1,
        gender: p.sex,
        latest_vitals: p.latest_vitals ? JSON.parse(p.latest_vitals) : null,
        latest_recommendation: p.latest_recommendation ? JSON.parse(p.latest_recommendation) : null,
        triage_status: mappedStatus
      };
    });

    let result = patients;
    if (status && status !== 'ALL') {
      result = result.filter(p => (status === 'PENDING' ? !p.triage_status || p.triage_status === 'PENDING' : p.triage_status.toUpperCase() === status));
    }
    if (acuity) {
      result = result.filter(p => p.latest_recommendation?.acuity_score === parseInt(acuity as string));
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. GET /api/patients/:id (Detail)
// ==========================================
app.get('/api/patients/:id', (req, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id) as any;
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    patient.has_prior_history = patient.has_prior_history === 1;
    patient.gender = patient.sex;
    
    const vitals = db.prepare('SELECT * FROM vitals_readings WHERE patient_id = ? ORDER BY recorded_at ASC').all(req.params.id);
    const recommendations = db.prepare('SELECT * FROM recommendations WHERE patient_id = ? ORDER BY created_at DESC').all(req.params.id).map((r: any) => ({
      ...r,
      key_drivers: JSON.parse(r.key_drivers),
      escalated: r.escalated === 1
    }));
    const actions = db.prepare('SELECT * FROM nurse_actions WHERE recommendation_id IN (SELECT id FROM recommendations WHERE patient_id = ?) ORDER BY created_at DESC').all(req.params.id);
    
    res.json({ patient, vitals, recommendations, actions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3b. GET /api/patients/:id/history
// ==========================================
app.get('/api/patients/:id/history', (req, res) => {
  try {
    const recommendations = db.prepare('SELECT id, acuity_score, rationale_text, created_at FROM recommendations WHERE patient_id = ? ORDER BY created_at ASC').all(req.params.id) as any[];
    
    const nowMs = getSimNowMs();
    const history = recommendations.map(r => {
      const recTime = new Date(r.created_at).getTime();
      return {
        ...r,
        diffMins: Math.max(0, Math.floor((nowMs - recTime) / 60000))
      };
    });
    
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. POST /api/patients/:id/vitals
// ==========================================
app.post('/api/patients/:id/vitals', (req, res) => {
  const { hr, bp_sys, bp_dia, rr, spo2, temp, pain_score } = req.body;
  const vId = genId('vit');
  const ts = getSimNow();
  
  try {
    const stmt = db.prepare('INSERT INTO vitals_readings (id, patient_id, hr, bp_sys, bp_dia, rr, spo2, temp, pain_score, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(vId, req.params.id, hr, bp_sys, bp_dia, rr, spo2, temp, pain_score, ts);
    res.status(201).json({ id: vId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. POST /api/patients/:id/recommendations
// ==========================================
app.post('/api/patients/:id/recommendations', async (req, res) => {
  const rId = genId('rec');
  const pId = req.params.id;
  const ts = getSimNow();
  
  try {
    const patient = db.prepare('SELECT chief_complaint_raw, nurse_observation, age, has_prior_history FROM patients WHERE id = ?').get(pId) as any;
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const vitals = db.prepare('SELECT * FROM vitals_readings WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1').get(pId) as any || {
      hr: null, bp_sys: null, bp_dia: null, rr: null, spo2: null, temp: null, pain_score: null
    };

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

    let mlResult;

    if (process.env.VITE_GEMINI_API_KEY && process.env.VITE_GEMINI_API_KEY.trim() !== '') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
        const prompt = `
          You are acting as an advanced Machine Learning ensemble (XGBoost + Temporal DNN) for Emergency Department Triage.
          
          I will provide you with patient data. I have "trained" you on thousands of records. You must evaluate this patient and output a JSON object mimicking SHAP explainability and deterioration prediction.
          
          Example Patient 1:
          Age 45, HR 135, SpO2 93%, CC: "Chest pain"
          Output: {"acuity_score": 2, "confidence_pct": 85, "clinical_rationale": "Patient presents with chest pain and significant tachycardia (HR 135) alongside mild hypoxia, indicating high risk of cardiac or pulmonary event.", "shap_drivers": [{"feature": "HR", "value": 135, "shap_impact": 0.45}, {"feature": "SpO2", "value": 93, "shap_impact": 0.3}], "deterioration_risk_pct": 65.5, "time_to_deterioration_mins": 45, "escalated": true, "escalation_reason": "Red flag: Chest pain + Tachycardia"}
          
          Example Patient 2:
          Age 25, HR 80, SpO2 98%, CC: "Ankle sprain"
          Output: {"acuity_score": 4, "confidence_pct": 98, "clinical_rationale": "Isolated ankle sprain with normal vitals. Low risk of deterioration. Can wait safely.", "shap_drivers": [{"feature": "Pain", "value": 4, "shap_impact": 0.1}, {"feature": "Age", "value": 25, "shap_impact": -0.05}], "deterioration_risk_pct": 5.0, "time_to_deterioration_mins": 300, "escalated": false, "escalation_reason": null}
          
          Now evaluate this patient:
          Age: ${patient.age}
          HR: ${vitals.hr}, BP: ${vitals.bp_sys}/${vitals.bp_dia}, RR: ${vitals.rr}, SpO2: ${vitals.spo2}, Temp: ${vitals.temp}, Pain: ${vitals.pain_score}
          Chief Complaint: ${patient.chief_complaint_raw}
          Observation: ${patient.nurse_observation || 'None'}
          
          Return ONLY valid JSON with exactly the fields shown in the examples.
        `;
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        mlResult = JSON.parse(text);
      } catch (aiErr) {
        console.error("Gemini Flash failed:", aiErr);
      }
    }

    if (!mlResult) {
      mlResult = {
        acuity_score: 3,
        confidence_pct: 60,
        clinical_rationale: "AI evaluation unavailable. Defaulting to ESI 3.",
        shap_drivers: [{feature: 'Fallback', value: 0, shap_impact: 0}],
        deterioration_risk_pct: 20,
        time_to_deterioration_mins: 120,
        escalated: false,
        escalation_reason: null
      };
    }

    const suggestedRouting = mlResult.acuity_score <= 2 ? (capacities['Resus'] > 0 ? 'Resus Zone' : 'Acute Zone') : 'Fast Track';
    const is_capacity_adjusted = mlResult.acuity_score <= 2 && capacities['Resus'] === 0;

    const evaluation = {
      acuity_score: mlResult.acuity_score,
      confidence_pct: mlResult.confidence_pct,
      key_drivers: mlResult.shap_drivers.map((d: any) => `${d.feature} (${d.value}): ${d.shap_impact > 0 ? '+' : ''}${d.shap_impact} impact`),
      clinical_rationale: mlResult.clinical_rationale,
      escalated: mlResult.escalated,
      escalation_reason: mlResult.escalation_reason,
      suggested_routing: suggestedRouting,
      is_capacity_adjusted: is_capacity_adjusted,
      model_version: 'Gemini-1.5-Flash',
      shap_drivers: mlResult.shap_drivers,
      deterioration_risk_pct: mlResult.deterioration_risk_pct,
      time_to_deterioration_mins: mlResult.time_to_deterioration_mins
    };

    const rationale = evaluation.clinical_rationale;

    db.transaction(() => {
      const stmt = db.prepare('INSERT INTO recommendations (id, patient_id, acuity_score, confidence_pct, rationale_text, key_drivers, escalated, escalation_reason, suggested_routing, is_capacity_adjusted, model_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(rId, pId, evaluation.acuity_score, evaluation.confidence_pct, rationale, JSON.stringify(evaluation.key_drivers), evaluation.escalated ? 1 : 0, evaluation.escalation_reason, suggestedRouting, evaluation.is_capacity_adjusted ? 1 : 0, evaluation.model_version, ts);
      
      const aStmt = db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      aStmt.run(genId('audit'), pId, 'RECOMMENDATION_GENERATED', evaluation.model_version, null, JSON.stringify({ recommended_esi: evaluation.acuity_score, confidence: evaluation.confidence_pct }), rationale, ts);

      // Auto-assign logic for non-critical cases (ESI 3, 4, 5)
      if (evaluation.acuity_score >= 3) {
        const actionStmt = db.prepare('INSERT INTO nurse_actions (id, recommendation_id, action_type, modified_acuity, modified_routing, note, actor_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        actionStmt.run(genId('action'), rId, 'accept', null, null, 'Auto-assigned by AI (Non-critical ESI)', 'AI Auto-Assign', ts);
        
        const aStmt2 = db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        aStmt2.run(genId('audit'), pId, 'AI_AUTO_ACCEPT', 'AI Engine', null, JSON.stringify({ esi: evaluation.acuity_score }), 'Safely auto-assigned non-critical ESI', ts);
      }
    })();
    res.status(201).json({ id: rId, evaluation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. POST /api/recommendations/:id/actions
// ==========================================
app.post('/api/recommendations/:id/actions', (req, res) => {
  const rId = req.params.id;
  const { action_type, modified_acuity, modified_routing, note, actor_name } = req.body;
  const aId = genId('action');
  const ts = getSimNow();
  
  try {
    if (action_type === 'OVERRIDE' && (!note || note.trim().length === 0)) {
      return res.status(400).json({ error: 'Justification note is required for an override.' });
    }

    const rec = db.prepare('SELECT patient_id, acuity_score, suggested_routing FROM recommendations WHERE id = ?').get(rId) as any;
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
    
    db.transaction(() => {
      const stmt = db.prepare('INSERT INTO nurse_actions (id, recommendation_id, action_type, modified_acuity, modified_routing, note, actor_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      stmt.run(aId, rId, action_type, modified_acuity || null, modified_routing || null, note || null, actor_name, ts);
      
      // Write audit log
      let prior = JSON.stringify({ esi: rec.acuity_score, routing: rec.suggested_routing });
      let next = JSON.stringify({ esi: modified_acuity || rec.acuity_score, routing: modified_routing || rec.suggested_routing });
      
      const logStmt = db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      logStmt.run(genId('audit'), rec.patient_id, 'NURSE_TRIAGE_COMPLETE', actor_name, prior, next, note || `Triage action: ${action_type}`, ts);
    })();
    res.status(201).json({ id: aId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. GET /api/audit
// ==========================================
app.get('/api/audit', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC').all();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. GET /api/capacity
// ==========================================
app.get('/api/capacity', (req, res) => {
  try {
    const snaps = db.prepare(`
      SELECT cs.*
      FROM capacity_snapshots cs
      INNER JOIN (
        SELECT zone_name, MAX(recorded_at) as max_time 
        FROM capacity_snapshots 
        GROUP BY zone_name
      ) latest 
      ON cs.zone_name = latest.zone_name AND cs.recorded_at = latest.max_time
    `).all();
    res.json(snaps.map((s: any) => ({ ...s, surge_mode: s.surge_mode === 1 })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. POST /api/capacity/surge
// ==========================================
app.post('/api/capacity/surge', (req, res) => {
  const { surge_mode, actor } = req.body;
  const ts = getSimNow();
  try {
    db.transaction(() => {
      // Update all zones to new surge mode flag (in reality we'd insert new snapshots)
      db.prepare('UPDATE capacity_snapshots SET surge_mode = ?, recorded_at = ?').run(surge_mode ? 1 : 0, ts);
      
      db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(genId('audit'), 'SYSTEM', 'SURGE_MODE_TOGGLED', actor || 'SYSTEM', null, JSON.stringify({ surge_mode }), 'Surge capacity plan activated.', ts);
    })();
    res.json({ success: true, surge_mode });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. GET /api/simulation/state
// ==========================================
app.get('/api/simulation/state', (req, res) => {
  res.json({
    isRunning: isSimRunning,
    multiplier: simMultiplier,
    offsetMs: simOffsetMs,
    simNow: getSimNow(),
    alerts: activeAlerts
  });
});

// ==========================================
// 11. POST /api/simulation/control
// ==========================================
app.post('/api/simulation/control', (req, res) => {
  const { action, multiplier } = req.body;
  if (action === 'start') startSimulation();
  else if (action === 'pause') pauseSimulation();
  else if (action === 'reset') resetSimulation();
  
  if (multiplier) setMultiplier(multiplier);
  
  res.json({ success: true, isRunning: isSimRunning, multiplier: simMultiplier });
});

// ==========================================
// 12. POST /api/alerts/:id/dismiss
// ==========================================
app.post('/api/alerts/:id/dismiss', (req, res) => {
  const success = dismissAlert(req.params.id, req.body.actor || 'nurse_carter_rn');
  res.json({ success });
});


app.post('/api/simulation/deteriorate', (req, res) => {
  const { patientId } = req.body;
  if (!patientId) return res.status(400).json({ error: 'Patient ID required' });
  manualFireDeterioration(patientId);
  res.json({ success: true });
});

app.post('/api/capacity/force-full', (req, res) => {
  // Force Resus Zone to 0 beds
  const ts = getSimNow();
  db.prepare('INSERT INTO capacity_snapshots (id, zone_name, beds_total, beds_free, staff_on_shift, surge_mode, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(genId('cap'), 'Resuscitation (Resus)', 2, 0, 4, 0, ts);
  res.json({ success: true });
});

app.post('/api/reset-db', (req, res) => {
  try {
    // Close existing DB connection
    db.close();
    // Delete files
    const dbPath = path.join(__dirname, '..', 'miai.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    
    // Process exit to let the dev server restart it cleanly
    setTimeout(() => process.exit(0), 100);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
