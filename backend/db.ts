import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to a file-based SQLite database
const dbPath = path.resolve(__dirname, '../miai.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');
// Enforce foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      sex TEXT NOT NULL,
      arrival_mode TEXT NOT NULL,
      chief_complaint_raw TEXT NOT NULL,
      nurse_observation TEXT,
      has_prior_history INTEGER NOT NULL, -- 0 or 1
      history_summary TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vitals_readings (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      hr INTEGER NOT NULL,
      bp_sys INTEGER NOT NULL,
      bp_dia INTEGER NOT NULL,
      rr INTEGER NOT NULL,
      spo2 INTEGER NOT NULL,
      temp REAL NOT NULL,
      pain_score INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      acuity_score INTEGER NOT NULL,
      confidence_pct INTEGER NOT NULL,
      rationale_text TEXT NOT NULL,
      key_drivers TEXT NOT NULL, -- JSON string array
      escalated INTEGER NOT NULL, -- 0 or 1
      escalation_reason TEXT,
      suggested_routing TEXT NOT NULL,
      is_capacity_adjusted INTEGER NOT NULL DEFAULT 0,
      model_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS nurse_actions (
      id TEXT PRIMARY KEY,
      recommendation_id TEXT NOT NULL,
      action_type TEXT NOT NULL, -- 'accept', 'modify', 'override'
      modified_acuity INTEGER,
      modified_routing TEXT,
      note TEXT,
      actor_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT NOT NULL,
      prior_value TEXT,
      new_value TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS capacity_snapshots (
      id TEXT PRIMARY KEY,
      zone_name TEXT NOT NULL,
      beds_total INTEGER NOT NULL,
      beds_free INTEGER NOT NULL,
      staff_on_shift INTEGER NOT NULL,
      surge_mode INTEGER NOT NULL, -- 0 or 1
      recorded_at TEXT NOT NULL
    );
  `);
}

export default db;
