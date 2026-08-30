# MIAI: Medical Intelligence for Acuity Intake

MIAI is a prototype clinical decision-support application built for the Accenture Innovation Challenge 2026. It demonstrates a safe, governable, human-in-the-loop AI integration into an Emergency Department triage workflow.

## Overview

Emergency Departments face severe overcrowding and staffing constraints. Traditional triage is subjective and bottlenecked. MIAI accelerates this process by using LLMs to structure unstructured intake data (like Chief Complaints and Nurse Observations) into discrete clinical entities, but relies on a deterministic, rule-based decision engine for actual clinical scoring.

### What's Real vs. Mocked

*   **Real / Live Components:**
    *   **LLM Extraction**: The connection to the Google Gemini API is live. It actively processes unstructured text into red flags and symptoms.
    *   **Decision Engine**: The ESI-scoring logic and capacity-aware routing engine executes locally in real-time.
    *   **State & Audit Log**: The SQLite database genuinely persists all actions, state transitions, and writes HIPAA-compliant audit logs for every nurse override and alert trigger.
    *   **Live Simulation Clock**: The backend time-compression service actively runs background loops for wait-time thresholds and simulated vitals deterioration.
*   **Mocked Components:**
    *   **Initial Patient Data**: The patients populated on launch are seeded from static data.
    *   **API Integrations**: Real-world EHR integrations (Epic/Cerner/HL7) are not implemented.

## Setup Instructions

1.  **Prerequisites**: Node.js v18+.
2.  **Environment Variable**: You must set your Google Gemini API key.
    ```bash
    # Create a .env file in the root directory:
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
3.  **Install & Run**:
    ```bash
    npm install
    npm run dev
    ```

## 5-Minute Demo Sequence

1.  **Dashboard Overview (1 min)**: Show the clean, information-dense UI. Point out the real-time wait clocks running on simulated time.
2.  **Ambiguous Case Intake (1.5 min)**: Navigate to `/intake`. Use the "Load Ambiguous Case" demo button. Point out the unstructured text. Submit the form to show Gemini extracting red flags, and the local rule engine computing an ESI score.
3.  **Human-in-the-Loop Governance (1 min)**: Show the generated recommendation in the "Awaiting Confirmation" state. Explain that the AI only *recommends*. Override the recommendation to a different ESI level to demonstrate the mandatory justification note and how it transitions the patient's status.
4.  **Deterioration & Alerts (1 min)**: Use the Demo Control Panel (gear icon in bottom right) to "Fire Deterioration" for `pat-2`. Wait a few simulated minutes. A modal alert will trigger showing the patient's vitals worsened and the engine automatically escalated their ESI.
5.  **Surge Mode & Capacity Routing (0.5 min)**: Use the Demo Control Panel to toggle "Surge Mode". Show the capacity bars turn red. Run another intake for an ESI-1 case (e.g. Load Pediatric Asthma Case). The system will recognize `Resus` is full and explicitly fallback to `Acute`, marking it as "(Capacity-Adjusted)".
6.  **Audit Trail (0.5 min)**: Navigate to `/audit` to prove every action (including the override justification and the deterioration alert dismissal) was cryptographically logged.
