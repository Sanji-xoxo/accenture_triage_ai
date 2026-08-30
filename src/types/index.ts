export type EsiLevel = 1 | 2 | 3 | 4 | 5;

export type ActionType = 'ACCEPT' | 'MODIFY' | 'OVERRIDE';

export interface Patient {
  id: string;
  name: string;
  dob: string; // ISO date string (YYYY-MM-DD)
  gender: string;
  has_prior_history: boolean;
  arrival_mode: string; // "Ambulance" | "Walk-in" | "Police" | "Air Transport" | etc.
  history_summary?: string | null;
  created_at: string;
  updated_at: string;
  latest_recommendation?: Recommendation;
}

export interface VitalsReading {
  id: string;
  patient_id: string;
  timestamp: string;
  heart_rate: number;
  respiratory_rate: number;
  temperature: number; // in Celsius or Fahrenheit (let's use Fahrenheit, e.g. 98.6)
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  oxygen_saturation: number; // percentage (e.g. 98)
  pain_score: number; // 0-10
}

export interface ChiefComplaint {
  id: string;
  patient_id: string;
  timestamp: string;
  free_text: string;
  nurse_observation: string;
  structured_symptoms: string[]; // JSON array represented as string[]
  red_flags_extracted: string[]; // JSON array of red flags
}

export interface Recommendation {
  id: string;
  patient_id: string;
  timestamp: string;
  acuity_score: EsiLevel;
  confidence_score: number; // 0 to 100
  explanation: string;
  is_escalated_low_confidence: boolean;
  is_escalated_red_flag: boolean;
  is_escalated_clinical: boolean;
  escalation_reason?: string | null;
  key_drivers: string[]; // key clinical findings that drove the decision
  suggested_routing: string; // e.g. "Resus Room 1", "Acute Zone", "Fast Track"
  is_capacity_adjusted: boolean;
  model_version: string;
  shap_drivers?: any[];
  deterioration_risk_pct?: number;
  time_to_deterioration_mins?: number;
}

export interface NurseAction {
  id: string;
  patient_id: string;
  recommendation_id: string;
  timestamp: string;
  nurse_id: string;
  action_type: ActionType;
  final_esi_level: EsiLevel;
  modified_routing?: string | null;
  note?: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_id: string; // e.g., "nurse_12", "system_engine", "gemini_pro"
  patient_id: string;
  action_type: string; // "RECOMMENDATION_GENERATED", "NURSE_TRIAGE_COMPLETE", "VITALS_ALERT", etc.
  entity_type: string; // "Recommendation" | "NurseAction" | "VitalsReading" | etc.
  entity_id: string;
  details: Record<string, any>; // JSON metadata
}

export interface CapacitySnapshot {
  id: string;
  timestamp: string;
  zone_name: string; // "Resus" | "Acute" | "Fast Track" | "Waiting Room" | etc.
  staff_on_shift: number;
  surge_mode: boolean;
  waiting_patients: number;
  longest_wait_time_minutes: number;
}
