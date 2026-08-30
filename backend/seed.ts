import db, { initDb } from './db';

// Ensure tables exist
initDb();

const now = new Date();
const timeMinus = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

console.log('Seeding database...');

// Clear existing tables
db.exec(`
  DELETE FROM audit_logs;
  DELETE FROM nurse_actions;
  DELETE FROM recommendations;
  DELETE FROM vitals_readings;
  DELETE FROM patients;
  DELETE FROM capacity_snapshots;
`);

const patients = [
  // Geriatric case
  { id: 'pat-001', name: 'Arthur Pendelton', age: 78, sex: 'M', arrival_mode: 'Ambulance', chief_complaint_raw: 'Shortness of breath, increased productive cough for 3 days.', nurse_observation: 'Patient appears fatigued, utilizing accessory muscles to breathe.', has_prior_history: 1, history_summary: 'COPD, Hypertension, Type 2 Diabetes.', created_at: timeMinus(45) },
  // Pediatric case
  { id: 'pat-002', name: 'Toby Vance', age: 4, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'High fever 103.1, not eating, very lethargic.', nurse_observation: 'Child is flushed, tachycardic, crying weakly. Mother extremely anxious.', has_prior_history: 1, history_summary: 'History of febrile seizures at age 2.', created_at: timeMinus(15) },
  // Atypical/ambiguous presentation (Cardiac equivalent)
  { id: 'pat-003', name: 'Elena Rostova', age: 52, sex: 'F', arrival_mode: 'Walk-in', chief_complaint_raw: 'Jaw pain, intense nausea, feels "dreadful".', nurse_observation: 'Diaphoretic (sweaty), pale. No chest pain reported, but looks acutely unwell.', has_prior_history: 1, history_summary: 'Hyperlipidemia, former smoker.', created_at: timeMinus(10) },
  // Zero-history first-time patient
  { id: 'pat-004', name: 'Liam Chen', age: 24, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'Deep cut on left forearm while chopping vegetables.', nurse_observation: 'Bleeding controlled with pressure dressing. Alert, no dizziness.', has_prior_history: 0, history_summary: null, created_at: timeMinus(65) },
  // Patient with vitals to be updated later to show deterioration
  { id: 'pat-005', name: 'Sarah Connor', age: 41, sex: 'F', arrival_mode: 'Walk-in', chief_complaint_raw: 'Abdominal pain, dull ache since morning.', nurse_observation: 'Guarding abdomen, pain 5/10. Vitals currently stable.', has_prior_history: 0, history_summary: null, created_at: timeMinus(20) },
  
  // Fill out to 15 patients
  { id: 'pat-006', name: 'James Wilson', age: 62, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'Chest heaviness and left arm tingling.', nurse_observation: 'Anxious, pale.', has_prior_history: 1, history_summary: 'Hypertension, family hx of MI.', created_at: timeMinus(5) },
  { id: 'pat-007', name: 'Maria Garcia', age: 34, sex: 'F', arrival_mode: 'Walk-in', chief_complaint_raw: 'Severe migraine, photophobia, vomiting.', nurse_observation: 'Wearing sunglasses in waiting room, actively vomiting.', has_prior_history: 1, history_summary: 'Chronic migraines.', created_at: timeMinus(30) },
  { id: 'pat-008', name: 'Robert Smith', age: 45, sex: 'M', arrival_mode: 'Ambulance', chief_complaint_raw: 'Motor vehicle accident, rear-ended, neck pain.', nurse_observation: 'In C-collar, alert, no neuro deficits.', has_prior_history: 0, history_summary: null, created_at: timeMinus(25) },
  { id: 'pat-009', name: 'Linda Johnson', age: 88, sex: 'F', arrival_mode: 'Ambulance', chief_complaint_raw: 'Fall at nursing home, hip pain.', nurse_observation: 'Right leg shortened and externally rotated. Dementia.', has_prior_history: 1, history_summary: 'Osteoporosis, Dementia, Atrial Fibrillation.', created_at: timeMinus(55) },
  { id: 'pat-010', name: 'Michael Brown', age: 19, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'Twisted ankle playing basketball.', nurse_observation: 'Swelling to right lateral malleolus, unable to bear weight.', has_prior_history: 0, history_summary: null, created_at: timeMinus(40) },
  { id: 'pat-011', name: 'William Davis', age: 50, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'Blood in urine, flank pain.', nurse_observation: 'Pacing, visibly uncomfortable. Flank tenderness.', has_prior_history: 1, history_summary: 'Kidney stones x2.', created_at: timeMinus(35) },
  { id: 'pat-012', name: 'Mary Miller', age: 29, sex: 'F', arrival_mode: 'Walk-in', chief_complaint_raw: 'Sore throat, fever, body aches.', nurse_observation: 'Appears fatigued, erythematous pharynx.', has_prior_history: 0, history_summary: null, created_at: timeMinus(70) },
  { id: 'pat-013', name: 'David Taylor', age: 39, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'Rash spreading on legs after hiking.', nurse_observation: 'Maculopapular rash, pruritic. No airway compromise.', has_prior_history: 0, history_summary: null, created_at: timeMinus(50) },
  { id: 'pat-014', name: 'Emma Martinez', age: 7, sex: 'F', arrival_mode: 'Walk-in', chief_complaint_raw: 'Asthma exacerbation, coughing.', nurse_observation: 'Mild wheezing, speaking in full sentences.', has_prior_history: 1, history_summary: 'Asthma.', created_at: timeMinus(12) },
  { id: 'pat-015', name: 'John Anderson', age: 55, sex: 'M', arrival_mode: 'Walk-in', chief_complaint_raw: 'Lower back pain lifting heavy box.', nurse_observation: 'Slow to move, spasm in lumbar region.', has_prior_history: 0, history_summary: null, created_at: timeMinus(80) },
];

const insertPatient = db.prepare('INSERT INTO patients (id, name, age, sex, arrival_mode, chief_complaint_raw, nurse_observation, has_prior_history, history_summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertVitals = db.prepare('INSERT INTO vitals_readings (id, patient_id, hr, bp_sys, bp_dia, rr, spo2, temp, pain_score, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertRec = db.prepare('INSERT INTO recommendations (id, patient_id, acuity_score, confidence_pct, rationale_text, key_drivers, escalated, escalation_reason, suggested_routing, model_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertCapacity = db.prepare('INSERT INTO capacity_snapshots (id, zone_name, beds_total, beds_free, staff_on_shift, surge_mode, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertAuditLog = db.prepare('INSERT INTO audit_logs (id, patient_id, event_type, actor, prior_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

db.transaction(() => {
  patients.forEach(p => {
    insertPatient.run(p.id, p.name, p.age, p.sex, p.arrival_mode, p.chief_complaint_raw, p.nurse_observation, p.has_prior_history, p.history_summary, p.created_at);
  });

  // Vitals
  insertVitals.run('vit-001', 'pat-001', 92, 145, 90, 24, 89, 99.1, 4, timeMinus(43)); // Arthur (Geriatric, SpO2 89)
  insertVitals.run('vit-002', 'pat-002', 145, 95, 60, 32, 98, 103.1, 8, timeMinus(13)); // Toby (Pediatric fever/tachy)
  insertVitals.run('vit-003', 'pat-003', 75, 110, 70, 16, 99, 98.6, 6, timeMinus(8)); // Elena (Atypical, vitals normal but sick)
  insertVitals.run('vit-004', 'pat-004', 88, 120, 80, 16, 100, 98.6, 5, timeMinus(63)); // Liam (Cut)
  insertVitals.run('vit-005', 'pat-005', 80, 118, 76, 16, 99, 99.0, 5, timeMinus(18)); // Sarah (Stable for now)
  
  insertVitals.run('vit-006', 'pat-006', 110, 160, 95, 20, 96, 98.6, 7, timeMinus(3));
  insertVitals.run('vit-007', 'pat-007', 95, 135, 85, 18, 99, 98.8, 9, timeMinus(28));
  insertVitals.run('vit-008', 'pat-008', 85, 125, 80, 16, 100, 98.6, 7, timeMinus(23));
  insertVitals.run('vit-009', 'pat-009', 105, 110, 70, 20, 95, 98.0, 9, timeMinus(53));
  insertVitals.run('vit-010', 'pat-010', 82, 120, 80, 16, 100, 98.6, 6, timeMinus(38));
  insertVitals.run('vit-011', 'pat-011', 115, 150, 90, 22, 98, 98.6, 10, timeMinus(33));
  insertVitals.run('vit-012', 'pat-012', 102, 115, 75, 18, 99, 101.5, 5, timeMinus(68));
  insertVitals.run('vit-013', 'pat-013', 78, 122, 78, 14, 100, 98.6, 3, timeMinus(48));
  insertVitals.run('vit-014', 'pat-014', 125, 100, 65, 26, 94, 98.6, 4, timeMinus(10));
  insertVitals.run('vit-015', 'pat-015', 85, 130, 85, 16, 100, 98.6, 7, timeMinus(78));

  // Recommendations
  const recData = [
    { id: 'rec-001', pId: 'pat-001', esi: 3, conf: 85, rat: 'COPD exacerbation with SpO2 89%. Requires O2 and nebulizers. ESI 3.', key_drivers: JSON.stringify(['SpO2 89%', 'COPD Hx', 'Resp Distress']), esc: 0, reason: null, route: 'Acute Medical' },
    { id: 'rec-002', pId: 'pat-002', esi: 2, conf: 92, rat: 'High fever and tachycardia in pediatric patient with history of febrile seizures. Lethargy present. ESI 2.', key_drivers: JSON.stringify(['Temp 103.1', 'HR 145', 'Lethargy', 'Seizure Hx']), esc: 0, reason: null, route: 'Resuscitation' },
    { id: 'rec-003', pId: 'pat-003', esi: 2, conf: 45, rat: 'Vitals stable, but symptoms of jaw pain/nausea in older female may indicate atypical MI. Low confidence in ESI 3, escalated to 2.', key_drivers: JSON.stringify(['Jaw pain', 'Nausea', 'Diaphoretic']), esc: 1, reason: 'Atypical presentation / Low confidence', route: 'Acute Medical' },
    { id: 'rec-004', pId: 'pat-004', esi: 4, conf: 95, rat: 'Isolated laceration, bleeding controlled, normal vitals.', key_drivers: JSON.stringify(['Laceration', 'Bleeding controlled']), esc: 0, reason: null, route: 'Fast Track' },
    { id: 'rec-005', pId: 'pat-005', esi: 3, conf: 80, rat: 'Abdominal pain, currently stable. Needs workup.', key_drivers: JSON.stringify(['Abd pain']), esc: 0, reason: null, route: 'Acute Medical' },
    
    // Fill 6-15
    { id: 'rec-006', pId: 'pat-006', esi: 2, conf: 88, rat: 'Classic cardiac symptoms with risk factors.', key_drivers: JSON.stringify(['Chest pain', 'Risk factors']), esc: 0, reason: null, route: 'Resuscitation' },
    { id: 'rec-007', pId: 'pat-007', esi: 3, conf: 90, rat: 'Severe migraine, stable vitals, intractable vomiting.', key_drivers: JSON.stringify(['Severe pain', 'Vomiting']), esc: 0, reason: null, route: 'Acute Medical' },
    { id: 'rec-008', pId: 'pat-008', esi: 2, conf: 75, rat: 'MVA, mechanism of injury warrants ESI 2.', key_drivers: JSON.stringify(['MVA', 'Neck pain']), esc: 0, reason: null, route: 'Resuscitation' },
    { id: 'rec-009', pId: 'pat-009', esi: 3, conf: 85, rat: 'Elderly fall, probable hip fracture.', key_drivers: JSON.stringify(['Fall', 'Deformity']), esc: 0, reason: null, route: 'Acute Medical' },
    { id: 'rec-010', pId: 'pat-010', esi: 4, conf: 92, rat: 'Ankle injury, no other complaints.', key_drivers: JSON.stringify(['Ankle pain', 'Swelling']), esc: 0, reason: null, route: 'Fast Track' },
    { id: 'rec-011', pId: 'pat-011', esi: 3, conf: 89, rat: 'Probable kidney stone, severe pain.', key_drivers: JSON.stringify(['Flank pain', 'Hematuria']), esc: 0, reason: null, route: 'Acute Medical' },
    { id: 'rec-012', pId: 'pat-012', esi: 4, conf: 90, rat: 'URI symptoms, stable vitals, fever.', key_drivers: JSON.stringify(['Fever', 'Sore throat']), esc: 0, reason: null, route: 'Fast Track' },
    { id: 'rec-013', pId: 'pat-013', esi: 5, conf: 95, rat: 'Simple rash, asymptomatic otherwise.', key_drivers: JSON.stringify(['Rash']), esc: 0, reason: null, route: 'Fast Track' },
    { id: 'rec-014', pId: 'pat-014', esi: 3, conf: 85, rat: 'Mild asthma exacerbation.', key_drivers: JSON.stringify(['Wheezing', 'Asthma Hx']), esc: 0, reason: null, route: 'Acute Medical' },
    { id: 'rec-015', pId: 'pat-015', esi: 4, conf: 90, rat: 'Back pain, musculoskeletal.', key_drivers: JSON.stringify(['Back pain']), esc: 0, reason: null, route: 'Fast Track' }
  ];

  recData.forEach(r => {
    insertRec.run(r.id, r.pId, r.esi, r.conf, r.rat, r.key_drivers, r.esc, r.reason, r.route, 'MIAI Core Engine v1.0', timeMinus(1));
    
    // Automatically write AuditLogEntry for Recommendation Creation
    insertAuditLog.run(
      `audit-rec-${r.id}`, 
      r.pId, 
      'RECOMMENDATION_GENERATED', 
      'MIAI_Engine_v1.0', 
      null, 
      JSON.stringify({ recommended_esi: r.esi, confidence: r.conf }), 
      r.rat, 
      timeMinus(1)
    );
  });

  // Capacity Snapshots
  insertCapacity.run('cap-1', 'Resuscitation', 5, 2, 4, 0, now.toISOString());
  insertCapacity.run('cap-2', 'Acute Medical', 20, 8, 8, 0, now.toISOString());
  insertCapacity.run('cap-3', 'Fast Track', 8, 4, 2, 0, now.toISOString());
  insertCapacity.run('cap-4', 'Waiting Room', 40, 28, 2, 0, now.toISOString());
})();

console.log('Database seeded successfully.');
