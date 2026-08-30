# MIAI: Triage AI - Emergency Medicine Decision Assistant

## Overview
MIAI (Machine Intelligence for Artificial Intake) is a multi-modal AI approach for predicting patient acuity and deterioration risks in Emergency Departments. It acts as an intelligent co-pilot for triage nurses by dynamically analyzing patient demographics, vital signs, and clinical narratives to provide a recommended Emergency Severity Index (ESI) score.

## Features
- **Machine Learning Inference Protocol:** Utilizes an ensemble of models (XGBoost, Temporal DNN, and Gemini 1.5 Flash) to extract features, evaluate risk, and synthesize clinical rationales.
- **Auto-Assign Workflow:** Patients with non-critical scores (ESI 3, 4, 5) are securely auto-assigned to the Triage Queue for efficiency, reducing cognitive load on nurses.
- **T0 Stage Sign-Off:** Critical patients (ESI 1, 2) automatically trigger a manual confirmation screen. The nurse must review the SHAP explainers and clinical rationale to Accept, Modify, or Override the AI's recommendation.
- **HIPAA Audit Logging:** Every AI decision, nurse override, and system auto-assignment is cryptographically logged in an immutable background ledger for compliance and retrospective training.
- **Capacity Analytics & Surge Mode:** Real-time visibility into ED crowding, dynamically adjusting triage algorithms when Surge Mode is activated.

## Technology Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **AI Integration:** Google Gemini 1.5 Flash API (@google/generative-ai)

## Setup & Installation

1. **Clone the repository**
\\ash
git clone https://github.com/Sanji-xoxo/accenture_triage_ai.git
cd accenture_triage_ai
\
2. **Install dependencies**
\\ash
npm install
\
3. **Configure Environment Variables**
Create a \.env\ file in the root directory and add your Google Gemini API key:
\\env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
\
4. **Run the Application**
Start both the Vite frontend and Node backend concurrently:
\\ash
npm run dev
\
The application will be available at \http://localhost:5173\.

## Architecture
- \src/\ - React frontend application and UI components.
- \ackend/\ - Node.js Express server handling API requests, SQLite database interactions, and Gemini AI inference.
- \database/\ - SQLite database initialization and schema constraints.

## Recent Fixes & Improvements
- **Robust ESI Routing:** Integrated intelligent logic to separate critical (manual confirmation) from non-critical (auto-assign) pathways.
- **Database Integrity:** Enforced NOT NULL constraints and resolved ID collisions to ensure a flawless audit trail.
- **Data Mapping:** Standardized demographics mapping between the frontend Intake form and the database schema.
