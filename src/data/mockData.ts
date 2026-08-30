import type { Patient, VitalsReading, Recommendation } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'Arthur Pendelton (Geriatric)',
    dob: '1958-04-12', // 68 years old
    gender: 'Male',
    has_prior_history: true,
    arrival_mode: 'Ambulance',
    history_summary: 'COPD, Congestive Heart Failure, Hypertension. Uses home oxygen 2L/min.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-2',
    name: 'Toby Vance (Pediatric)',
    dob: '2023-01-15', // 3 years old
    gender: 'Male',
    has_prior_history: true,
    arrival_mode: 'Walk-in',
    history_summary: 'Prior febrile seizure at 18 months. Otherwise normal developmental milestones.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-3',
    name: 'Elena Rostova (Atypical)',
    dob: '1984-08-22', // 42 years old
    gender: 'Female',
    has_prior_history: true,
    arrival_mode: 'Walk-in',
    history_summary: 'Mild asthma, managed with albuterol. Family history of coronary artery disease.',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-4',
    name: 'Liam Chen (First-time / Zero History)',
    dob: '1997-11-05', // 29 years old
    gender: 'Male',
    has_prior_history: false,
    arrival_mode: 'Walk-in',
    history_summary: null,
    created_at: new Date(Date.now() - 3000000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-5',
    name: 'Sarah Connor',
    dob: '1982-11-12', // 44 years old
    gender: 'Female',
    has_prior_history: true,
    arrival_mode: 'Ambulance',
    history_summary: 'Prior asthma exacerbations, hypertensive, allergic to penicillin.',
    created_at: new Date(Date.now() - 4000000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_VITALS: Record<string, VitalsReading> = {
  'pat-1': {
    id: 'vit-1',
    patient_id: 'pat-1',
    timestamp: new Date().toISOString(),
    heart_rate: 94,
    respiratory_rate: 22,
    temperature: 98.4,
    blood_pressure_systolic: 138,
    blood_pressure_diastolic: 82,
    oxygen_saturation: 93, // Low for typical, but Arthur has COPD baseline
    pain_score: 4
  },
  'pat-2': {
    id: 'vit-2',
    patient_id: 'pat-2',
    timestamp: new Date().toISOString(),
    heart_rate: 138, // High for adult, borderline tachycardic for child
    respiratory_rate: 32, // High respiratory rate
    temperature: 103.1, // High pediatric fever
    blood_pressure_systolic: 98,
    blood_pressure_diastolic: 62,
    oxygen_saturation: 96,
    pain_score: 7
  },
  'pat-3': {
    id: 'vit-3',
    patient_id: 'pat-3',
    timestamp: new Date().toISOString(),
    heart_rate: 78, // Completely normal
    respiratory_rate: 16, // Completely normal
    temperature: 98.6,
    blood_pressure_systolic: 122, // Completely normal
    blood_pressure_diastolic: 78,
    oxygen_saturation: 99,
    pain_score: 8 // High pain: Atypical presentation is jaw pain/nausea
  },
  'pat-4': {
    id: 'vit-4',
    patient_id: 'pat-4',
    timestamp: new Date().toISOString(),
    heart_rate: 80,
    respiratory_rate: 14,
    temperature: 98.2,
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 76,
    oxygen_saturation: 98,
    pain_score: 5 // Forearm laceration
  },
  'pat-5': {
    id: 'vit-5',
    patient_id: 'pat-5',
    timestamp: new Date().toISOString(),
    heart_rate: 112,
    respiratory_rate: 24,
    temperature: 101.2,
    blood_pressure_systolic: 142,
    blood_pressure_diastolic: 88,
    oxygen_saturation: 93,
    pain_score: 8
  }
};

export const VITALS_HISTORIES: Record<string, Record<string, number[]>> = {
  'pat-1': {
    heart_rate: [88, 92, 90, 95, 94],
    oxygen_saturation: [95, 94, 94, 93, 93],
    respiratory_rate: [20, 20, 21, 22, 22]
  },
  'pat-2': {
    heart_rate: [120, 125, 130, 135, 138],
    oxygen_saturation: [98, 97, 97, 96, 96],
    respiratory_rate: [26, 28, 30, 31, 32]
  },
  'pat-3': {
    heart_rate: [76, 78, 77, 78, 78],
    oxygen_saturation: [99, 99, 99, 99, 99],
    respiratory_rate: [14, 15, 16, 16, 16]
  },
  'pat-4': {
    heart_rate: [82, 80, 80, 80, 80],
    oxygen_saturation: [98, 98, 98, 98, 98],
    respiratory_rate: [14, 14, 14, 14, 14]
  },
  'pat-5': {
    heart_rate: [95, 102, 108, 110, 112],
    oxygen_saturation: [97, 96, 95, 94, 93],
    respiratory_rate: [18, 20, 22, 23, 24]
  }
};

export const INITIAL_RECOMMENDATIONS: Record<string, Recommendation> = {
  'pat-1': {
    id: 'rec-1',
    patient_id: 'pat-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    acuity_score: 3,
    confidence_score: 85,
    explanation: 'Geriatric patient presenting with chronic COPD flare. Oxygen saturation is 93% on room air, which is acceptable given his COPD baseline history on file. Vitals are currently stable, but patient requires resources (IV medications and lab workups). Recommended ESI level 3 Urgent.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: false,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Geriatric Age Band (68)', 'Baseline COPD history matches 93% SpO2', 'Requires 2+ ED Resources'],
    suggested_routing: 'Acute Care - Zone A Bed 12',
    model_version: 'MIAI Core Engine v1.0 (Gemini 1.5-pro assist)'
  },
  'pat-2': {
    id: 'rec-2',
    patient_id: 'pat-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    acuity_score: 2,
    confidence_score: 91,
    explanation: 'Pediatric patient (age 3) presenting with severe high fever (103.1°F), tachycardia (138 bpm), and tachypnea (32 bpm). High respiratory rate is a warning indicator for early distress. History of febrile seizures necessitates rapid intervention to abort potential recurrence. Recommended ESI 2 Emergent.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: true,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Pediatric Fever > 102°F (103.1°F)', 'Prior Febrile Seizure History', 'Respiratory Distress (RR 32)'],
    suggested_routing: 'Pediatric ED Annex - Bed 2',
    model_version: 'MIAI Core Engine v1.0 (Gemini 1.5-pro assist)'
  },
  'pat-3': {
    id: 'rec-3',
    patient_id: 'pat-3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    acuity_score: 2,
    confidence_score: 45, // Low confidence -> triggers escalation
    explanation: 'Atypical presentation: 42yo female presenting with severe jaw pain (pain score 8/10) and nausea. Vitals are completely normal, but jaw pain in females is a common myocardial infarction (heart attack) equivalent. Due to high symptom ambiguity, the engine escalated ESI from ESI 3 to ESI 2 Emergent and marked it as low confidence.',
    is_escalated_low_confidence: true,
    is_escalated_red_flag: true,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Atypical Cardiac Equivalent Symptom (Jaw Pain)', 'Severe Pain (8/10)', 'Low AI symptom extraction confidence'],
    suggested_routing: 'Acute Care - Cardiac Bay 3',
    model_version: 'MIAI Core Engine v1.0 (Gemini 1.5-pro assist)'
  },
  'pat-4': {
    id: 'rec-4',
    patient_id: 'pat-4',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    acuity_score: 4,
    confidence_score: 95,
    explanation: 'First-time patient with zero history. Presents with a simple 4cm laceration on the forearm. Vitals are completely stable and pain is moderate (5/10). Simple suture repair is a single resource. Recommended ESI 4 Less Urgent.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: false,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Single Resource Required (Sutures)', 'Stable Vitals', 'Moderate Pain (5/10)'],
    suggested_routing: 'Fast Track - Bed 1',
    model_version: 'MIAI Core Engine v1.0 (Gemini 1.5-pro assist)'
  },
  'pat-5': {
    id: 'rec-5',
    patient_id: 'pat-5',
    timestamp: new Date(Date.now() - 4000000).toISOString(),
    acuity_score: 2,
    confidence_score: 42,
    explanation: 'Patient presents with severe acute dyspnea, fever, tachycardia, and elevated work of breathing. ESI is escalated to Level 2 Emergent due to borderline respiratory failure indicators and low AI entity extraction confidence.',
    is_escalated_low_confidence: true,
    is_escalated_red_flag: true,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Depressed SpO2 (93%)', 'Adult Tachycardia (112 bpm)', 'High Pain (8/10)'],
    suggested_routing: 'Acute Care Zone - Bed 4',
    model_version: 'MIAI Core Engine v1.0-beta (Gemini 1.5-pro assist)'
  }
};

export const SURGE_PATIENTS: Patient[] = [
  ...INITIAL_PATIENTS,
  {
    id: 'pat-6',
    name: 'George Miller (Geriatric)',
    dob: '1945-09-17', // 80 years old
    gender: 'Male',
    has_prior_history: true,
    arrival_mode: 'Ambulance',
    history_summary: 'Dementia, coronary artery disease, pacemaker.',
    created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-7',
    name: 'Baby Garcia (Pediatric)',
    dob: '2025-12-01', // Infant
    gender: 'Female',
    has_prior_history: false,
    arrival_mode: 'Walk-in',
    history_summary: null,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-8',
    name: 'David Henderson',
    dob: '1970-05-14',
    gender: 'Male',
    has_prior_history: true,
    arrival_mode: 'Walk-in',
    history_summary: 'Diabetes Type II, diabetic neuropathy.',
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-9',
    name: 'Alice Cooper',
    dob: '1992-02-28',
    gender: 'Female',
    has_prior_history: false,
    arrival_mode: 'Walk-in',
    history_summary: null,
    created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-10',
    name: 'Robert Vance',
    dob: '1961-07-21',
    gender: 'Male',
    has_prior_history: true,
    arrival_mode: 'Police',
    history_summary: 'Schizophrenia, substance abuse, hepatitis C.',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-11',
    name: 'Emily Watson',
    dob: '1988-12-04',
    gender: 'Female',
    has_prior_history: true,
    arrival_mode: 'Walk-in',
    history_summary: 'Migraines, recurrent UTIs.',
    created_at: new Date(Date.now() - 55 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'pat-12',
    name: 'Charles Xavier (Geriatric)',
    dob: '1940-02-12',
    gender: 'Male',
    has_prior_history: true,
    arrival_mode: 'Ambulance',
    history_summary: 'Paraplegia (T4 complete), neurogenic bladder.',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const SURGE_VITALS: Record<string, VitalsReading> = {
  ...INITIAL_VITALS,
  'pat-6': {
    id: 'vit-6',
    patient_id: 'pat-6',
    timestamp: new Date().toISOString(),
    heart_rate: 104,
    respiratory_rate: 22,
    temperature: 99.1,
    blood_pressure_systolic: 145,
    blood_pressure_diastolic: 92,
    oxygen_saturation: 94,
    pain_score: 6
  },
  'pat-7': {
    id: 'vit-7',
    patient_id: 'pat-7',
    timestamp: new Date().toISOString(),
    heart_rate: 165, // Tachycardic baby
    respiratory_rate: 45, // Rapid infant breathing
    temperature: 100.8,
    blood_pressure_systolic: 80,
    blood_pressure_diastolic: 45,
    oxygen_saturation: 95,
    pain_score: 9 // inconsolable crying
  },
  'pat-8': {
    id: 'vit-8',
    patient_id: 'pat-8',
    timestamp: new Date().toISOString(),
    heart_rate: 92,
    respiratory_rate: 18,
    temperature: 100.2,
    blood_pressure_systolic: 158, // Hypertensive
    blood_pressure_diastolic: 90,
    oxygen_saturation: 97,
    pain_score: 5
  },
  'pat-9': {
    id: 'vit-9',
    patient_id: 'pat-9',
    timestamp: new Date().toISOString(),
    heart_rate: 74,
    respiratory_rate: 16,
    temperature: 98.4,
    blood_pressure_systolic: 110,
    blood_pressure_diastolic: 70,
    oxygen_saturation: 99,
    pain_score: 3
  },
  'pat-10': {
    id: 'vit-10',
    patient_id: 'pat-10',
    timestamp: new Date().toISOString(),
    heart_rate: 118,
    respiratory_rate: 20,
    temperature: 99.0,
    blood_pressure_systolic: 135,
    blood_pressure_diastolic: 85,
    oxygen_saturation: 98,
    pain_score: 2
  },
  'pat-11': {
    id: 'vit-11',
    patient_id: 'pat-11',
    timestamp: new Date().toISOString(),
    heart_rate: 88,
    respiratory_rate: 14,
    temperature: 98.6,
    blood_pressure_systolic: 120,
    blood_pressure_diastolic: 80,
    oxygen_saturation: 100,
    pain_score: 9 // Severe headache/migraine
  },
  'pat-12': {
    id: 'vit-12',
    patient_id: 'pat-12',
    timestamp: new Date().toISOString(),
    heart_rate: 58,
    respiratory_rate: 12,
    temperature: 95.8, // Hypothermic
    blood_pressure_systolic: 88, // Hypotensive
    blood_pressure_diastolic: 50,
    oxygen_saturation: 96,
    pain_score: 0
  }
};

export const SURGE_RECOMMENDATIONS: Record<string, Recommendation> = {
  ...INITIAL_RECOMMENDATIONS,
  'pat-6': {
    id: 'rec-6',
    patient_id: 'pat-6',
    timestamp: new Date().toISOString(),
    acuity_score: 2,
    confidence_score: 72,
    explanation: '80yo geriatric patient with dementia presenting with chest pressure and tachycardia (104 bpm). Recommended ESI 2 Emergent due to high cardiac risk in an elderly patient and inability to fully characterize symptoms due to baseline dementia.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: true,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Geriatric Patient (80)', 'Chest Pain', 'Tachycardia (104 bpm)'],
    suggested_routing: 'Acute Care - Cardiac Bay 1',
    model_version: 'MIAI Core Engine v1.0 (Gemini Pro assist)'
  },
  'pat-7': {
    id: 'rec-7',
    patient_id: 'pat-7',
    timestamp: new Date().toISOString(),
    acuity_score: 1,
    confidence_score: 94,
    explanation: 'Infant patient presenting with extreme respiratory distress (respiratory rate 45, heart rate 165). Grunting and retraction noted. Immediate clinical resuscitation required. AI recommends ESI 1 (Immediate intervention).',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: true,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Infant Respiratory Rate 45 (Distress)', 'Tachycardia 165 bpm', 'Retractions and Grunting'],
    suggested_routing: 'Resus Room 2',
    model_version: 'MIAI Core Engine v1.0 (Gemini Pro assist)'
  },
  'pat-8': {
    id: 'rec-8',
    patient_id: 'pat-8',
    timestamp: new Date().toISOString(),
    acuity_score: 3,
    confidence_score: 88,
    explanation: 'Diabetic patient presenting with acute cellulitis of lower extremity. Elevated BP (158/90) and localized heat. Vitals stable. Requires IV antibiotics and blood cultures. Recommended ESI 3.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: false,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Diabetic Patient Complication', 'Cellulitis Requiring IV Antibiotics', 'Stable Vitals'],
    suggested_routing: 'Acute Care - Zone A Bed 5',
    model_version: 'MIAI Core Engine v1.0'
  },
  'pat-9': {
    id: 'rec-9',
    patient_id: 'pat-9',
    timestamp: new Date().toISOString(),
    acuity_score: 5,
    confidence_score: 98,
    explanation: 'Patient presenting with simple eye discharge. Vitals are completely normal and pain score is low. No urgent resources required. Prescription/referral only. Recommended ESI 5 Non-urgent.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: false,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['No ED Resources Required', 'Normal Vitals', 'Low pain (3/10)'],
    suggested_routing: 'Fast Track - Chair 2',
    model_version: 'MIAI Core Engine v1.0'
  },
  'pat-10': {
    id: 'rec-10',
    patient_id: 'pat-10',
    timestamp: new Date().toISOString(),
    acuity_score: 3,
    confidence_score: 55,
    explanation: 'Patient presenting with acute agitation. Vitals show tachycardia (118 bpm). ESI 3 recommended. Security/social work consult may be required.',
    is_escalated_low_confidence: true,
    is_escalated_red_flag: false,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Agitation & Behavioral Distress', 'Tachycardia (118 bpm)', 'Substance abuse history on file'],
    suggested_routing: 'Behavioral Health Holding Room 1',
    model_version: 'MIAI Core Engine v1.0 (Gemini Pro assist)'
  },
  'pat-11': {
    id: 'rec-11',
    patient_id: 'pat-11',
    timestamp: new Date().toISOString(),
    acuity_score: 4,
    confidence_score: 92,
    explanation: 'Patient presenting with severe typical migraine headache. Vitals normal. Pain score 9/10. Requires single resource (IM/IV pain medication cocktail). Recommended ESI 4.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: false,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Single Resource Required (IV Meds)', 'Normal Vitals', 'Severe Migraine Headache'],
    suggested_routing: 'Fast Track - Chair 1',
    model_version: 'MIAI Core Engine v1.0'
  },
  'pat-12': {
    id: 'rec-12',
    patient_id: 'pat-12',
    timestamp: new Date().toISOString(),
    acuity_score: 1,
    confidence_score: 96,
    explanation: 'Geriatric patient presenting with suspected autonomic dysreflexia or septic shock. Vitals show hypotension (88/50) and hypothermia (95.8°F). Requires immediate resuscitation and fluid support. Recommended ESI 1.',
    is_escalated_low_confidence: false,
    is_escalated_red_flag: true,
    is_escalated_clinical: false, is_capacity_adjusted: false,
    key_drivers: ['Hypotension (88/50 mmHg)', 'Hypothermia (95.8°F)', 'T4 Spinal Injury History'],
    suggested_routing: 'Resus Room 1',
    model_version: 'MIAI Core Engine v1.0'
  }
};
