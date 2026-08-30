# Walkthrough: Round 2 Requirements (Live LLM & Uncertainty Tracking)

## Changes Made for Round 2

1. **Live Gemini AI Integration**
   - We completely stripped out the simulated string-matching extraction logic from the frontend (`App.tsx`).
   - Integrated the official `@google/generative-ai` SDK into the backend.
   - The `/api/patients/:id/recommendations` endpoint now formulates a robust prompt containing the unstructured Chief Complaint and Nurse Observations, sending it to `gemini-1.5-flash`.
   - The LLM dynamically extracts `redFlags`, `lifeThreateningFlags`, and `symptoms` into a strict JSON payload, mapping the unstructured text to the deterministic rules-engine.
   - **Fail-Safe Mechanism:** In the event of API rate-limiting or network issues during the live demo, the backend seamlessly falls back to a deterministic text-matching algorithm to ensure the app continues to function flawlessly.

2. **Explicitly Surfacing Uncertainty**
   - The `ConfidenceChip` now clearly visualizes the model's confidence out of 100%. 
   - A newly added **Escalation Reason** UI block clearly surfaces *why* the rules engine bumped an ESI score against its raw vitals (e.g., "Low confidence (<60%) triggered urgency bump" or "Red flag present").

3. **15+ Simulated Patient Records**
   - `backend/seed.ts` has been updated to seed 15 distinct patients spanning the exact scenarios requested:
     - Pediatric cases with customized pediatric vital thresholds (Toby Vance)
     - Geriatric cases (Arthur Pendelton, Linda Johnson)
     - Ambiguous cardiac presentations (Elena Rostova)
     - Zero-history, first-time patients (Liam Chen)

4. **Surge Simulation**
   - The Demo Panel's surge toggle explicitly triggers a "3x Volume" simulation, forcing the Resus and Acute capacities to max out, which dynamically re-routes critical patients and flags them as `(Capacity-Adjusted)`.

---

# Walkthrough: Final Human-in-the-Loop Workflow & UI Polish

## Changes Made

1. **Governance Workflow**
   - Implemented an `AWAITING_CONFIRMATION` triage status state logic inside `App.tsx` and visually via `PatientRow.tsx`. Any new AI recommendation that returns an ESI of 1 or 2 is held in this state.
   - Enforced a required override justification check for `OVERRIDE` actions in `backend/server.ts`. 

2. **Capacity-Aware Routing**
   - Refactored `backend/server.ts` to properly retrieve the latest capacity snapshots via a robust `GROUP BY` query, fixing the fragile `LIMIT 4` behavior.
   - Updated the `decision_engine` to ingest capacity data. If a patient requires Resus but Resus is full, the engine dynamically routes to Acute and sets the `is_capacity_adjusted` flag.
   - Added visual badges and coloring to the `RecommendationCard` to clearly distinguish capacity-adjusted routing to judges during demo mode.

3. **Demo Control Panel Overlay**
   - Built a comprehensive floating `DemoPanel.tsx` that includes controls for:
     - Playing/Pausing/Resetting the simulated time
     - Triggering a directed deterioration script for a specific patient
     - Activating a mock 'Surge Mode' 
     - Forcing a specific zone (Resus) to be at capacity to trigger capacity routing
     - Executing a complete DB hard reset

4. **Visual & Informational Polish**
   - Built an `AboutView.tsx` screen highlighting the prototype's adherence to HIPAA, Human-in-the-Loop principles, and future disparity analytics plans.
   - Generated a concise `README.md` containing the setup instructions and the optimal 5-minute storytelling script.
   - Verified the simulated Gemini fallback works gracefully by ensuring `evaluatePatient` safely handles empty symptom arrays if no data is extracted.

## Validation Results
- The codebase passes a complete Type-Check and Vite build (`npm run build`).
- TypeScript interfaces match DB schemas.
- `Awaiting Confirmation` logic appropriately triggers the pulse animation for new ESI-2 alerts.
