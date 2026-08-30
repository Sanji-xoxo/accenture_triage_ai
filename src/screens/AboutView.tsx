import React from 'react';
import { Shield, Server, FileText, Lock } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-clinical-text-primary">About MIAI</h1>
        <p className="text-sm text-clinical-text-secondary mt-1">Medical Intelligence for Acuity Intake • Prototype v1.0</p>
      </header>

      <section className="bg-white border border-clinical-border rounded p-6 shadow-sm">
        <h2 className="text-lg font-bold text-clinical-text-primary flex items-center mb-4">
          <Shield className="w-5 h-5 mr-2 text-blue-600" /> Human-in-the-Loop Principle
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          MIAI is designed to augment, not replace, clinical judgment. The system operates under a strict "Human-in-the-Loop" governance model. AI models (like Gemini) are used strictly for structuring unstructured text (extracting red flags and symptoms from free-text complaints). The actual clinical ESI scoring is performed by a deterministic, auditable rules engine. Furthermore, any critical triage decision (ESI 1 or 2) requires explicit nurse confirmation, and all overrides are captured in an immutable audit ledger.
        </p>
      </section>

      <section className="bg-white border border-clinical-border rounded p-6 shadow-sm">
        <h2 className="text-lg font-bold text-clinical-text-primary flex items-center mb-4">
          <Lock className="w-5 h-5 mr-2 text-emerald-600" /> HIPAA & Audit Compliance
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          This prototype simulates compliance with US HIPAA regulations. A write-only SQLite ledger captures the complete provenance of every recommendation, including:
        </p>
        <ul className="list-disc pl-5 mt-3 text-sm text-slate-700 space-y-1">
          <li>What the AI recommended and its confidence score.</li>
          <li>What the deterministic engine computed.</li>
          <li>The exact timestamp of alerts triggering and nurse dismissals.</li>
          <li>Mandatory justification notes for any clinical override.</li>
        </ul>
      </section>

      <section className="bg-slate-50 border border-clinical-border rounded p-6">
        <h2 className="text-lg font-bold text-clinical-text-primary flex items-center mb-4">
          <Server className="w-5 h-5 mr-2 text-amber-600" /> Roadmap: MedLM & Disparity Analysis
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          This is a prototype utilizing general-purpose Google Gemini models. A production deployment would migrate to specialized healthcare models like MedLM or Med-PaLM 2 for enhanced clinical reasoning.
        </p>
        <div className="bg-white p-4 rounded border border-amber-200 mt-4">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center">
            <FileText className="w-4 h-4 mr-1.5 text-amber-500" /> Bias & Fairness Analytics (Coming Soon)
          </h3>
          <p className="text-xs text-slate-600">
            Future versions of MIAI will include live disparity analysis, comparing AI recommendations against nurse overrides segmented by age, gender, and ethnicity. This ensures the model does not inadvertently propagate systemic biases in triage routing.
          </p>
        </div>
      </section>
    </div>
  );
};
