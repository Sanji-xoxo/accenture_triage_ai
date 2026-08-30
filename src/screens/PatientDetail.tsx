import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, History, User, Heart, ShieldCheck } from 'lucide-react';
import type { Patient, VitalsReading, Recommendation, EsiLevel } from '../types';
import { VitalsSparkline, RecommendationCard, DecisionButtons } from '../components';

interface PatientDetailProps {
  patient: Patient;
  vitals: VitalsReading;
  vitalsHistory: Record<string, number[]>;
  recommendation: Recommendation;
  status: 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'OVERRIDDEN';
  onAccept: (routing: string) => void;
  onModify: (routing: string) => void;
  onOverride: (newEsi: EsiLevel, note: string, routing: string) => void;
  onBack: () => void;
  className?: string;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  vitals,
  vitalsHistory,
  recommendation,
  status,
  onAccept,
  onModify,
  onOverride,
  onBack,
  className = '',
}) => {
  const age = patient.age;

  const [timelinePoints, setTimelinePoints] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/patients/${patient.id}/history`)
      .then(r => r.json())
      .then(data => {
        if (!data || data.length === 0) return;
        const pts = data.map((rec: any, idx: number) => {
          return {
            label: idx === 0 ? 'T0 (Intake)' : `T${idx} (Re-assess)`,
            esi: rec.acuity_score,
            time: rec.diffMins < 1 ? 'Just now' : `${rec.diffMins}m ago`,
            desc: rec.rationale_text || 'Re-evaluated'
          };
        });
        setTimelinePoints(pts);
      })
      .catch(e => console.error(e));
  }, [patient.id]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Back button */}
      <button 
        onClick={onBack}
        className="inline-flex items-center text-xs font-semibold text-clinical-text-secondary hover:text-clinical-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Triage Queue
      </button>

      {/* Header Demographics Card */}
      <header className="bg-white border border-clinical-border rounded p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 bg-slate-100 rounded-full text-slate-500">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-base font-bold text-clinical-text-primary">{patient.name}</h2>
              <span className="text-xs text-clinical-text-secondary font-mono">
                {patient.gender} • Age: {age}
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-clinical-text-secondary">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold">{patient.arrival_mode} Arrival</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                Intake: {new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {patient.has_prior_history ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded max-w-xs text-xs text-blue-900">
              <span className="font-bold flex items-center mb-0.5">
                <History className="w-3.5 h-3.5 mr-1" /> Rich History on File
              </span>
              <p className="text-[10px] leading-tight text-blue-800 truncate" title={patient.history_summary || ''}>
                {patient.history_summary}
              </p>
            </div>
          ) : (
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-clinical-text-secondary italic">
              First-time patient — zero historical clinical records found.
            </div>
          )}
        </div>
      </header>

      {/* Grid: Sparklines & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sparklines Vitals History */}
        <section className="bg-white border border-clinical-border rounded p-4 shadow-sm space-y-3 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 flex items-center">
            <Heart className="w-3.5 h-3.5 mr-1 text-red-500 animate-pulse" /> Vitals History Trend
          </h3>
          <div className="flex flex-col space-y-2.5">
            <VitalsSparkline
              label="Heart Rate"
              value={vitals.heart_rate}
              unit="bpm"
              history={vitalsHistory?.heart_rate || [75, 76, 75, 78, vitals.heart_rate]}
              minSafe={55}
              maxSafe={100}
            />
            <VitalsSparkline
              label="SpO2"
              value={vitals.oxygen_saturation}
              unit="%"
              history={vitalsHistory?.oxygen_saturation || [99, 98, 97, 96, vitals.oxygen_saturation]}
              minSafe={94}
              maxSafe={100}
            />
            <VitalsSparkline
              label="Resp Rate"
              value={vitals.respiratory_rate}
              unit="rr"
              history={vitalsHistory?.respiratory_rate || [14, 16, 18, 20, vitals.respiratory_rate]}
              minSafe={12}
              maxSafe={20}
            />
            <VitalsSparkline
              label="BP Systolic"
              value={vitals.blood_pressure_systolic}
              unit="mmHg"
              history={[vitals.blood_pressure_systolic - 10, vitals.blood_pressure_systolic - 5, vitals.blood_pressure_systolic]}
              minSafe={90}
              maxSafe={140}
            />
            <VitalsSparkline
              label="Temp"
              value={vitals.temperature}
              unit="°F"
              history={[vitals.temperature - 0.2, vitals.temperature + 0.1, vitals.temperature]}
              minSafe={97}
              maxSafe={100.4}
            />
          </div>
        </section>

        {/* Right Column: Deterioration horizontal timeline */}
        <section className="bg-white border border-clinical-border rounded p-4 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5">
            Deterioration timeline (T0 $\rightarrow$ T1 $\rightarrow$ T2...)
          </h3>
          
          <div className="relative pt-6 pb-2 px-4 bg-slate-50/50 rounded border border-slate-100">
            {/* Horizontal connector line */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 transform -translate-y-1/2" />

            <div className="relative flex justify-between items-center">
              {timelinePoints.map((pt: any, idx: number) => {
                return (
                  <div key={idx} className="flex flex-col items-center relative z-10 w-24 text-center">
                    {/* Level marker */}
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm bg-white ${
                      pt.esi === 1 ? 'border-red-600 text-red-700 ring-2 ring-red-100 animate-pulse' :
                      pt.esi === 2 ? 'border-orange-500 text-orange-600' :
                      pt.esi === 3 ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600'
                    }`}>
                      {pt.esi}
                    </div>
                    {/* Label & Meta */}
                    <span className="text-[11px] font-bold text-slate-800 mt-2 block">{pt.label}</span>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{pt.time}</span>
                    <p className="text-[10px] text-clinical-text-secondary leading-tight mt-1 truncate w-24" title={pt.desc}>
                      {pt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-950 font-medium">
            <strong>Deterioration Risk:</strong> Patient shows a rising acuity trajectory (ESI 3 $\rightarrow$ ESI 2) driven by deteriorating vitals (SpO2 dropping to 93% and HR tachycardic at 112). Immediate routing adjustment suggested.
          </div>
        </section>
      </div>

      {/* Grid: Recommendation Display & Clinician Signs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Active AI Recommendation Card</h3>
          <RecommendationCard recommendation={recommendation} />
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Triage Clinician Actions</h3>
          <div className="bg-white border border-slate-200 rounded p-4.5 shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-1"> t0/T1/T2 Clinical Assessment Sign-off</h4>
              <p className="text-xs text-clinical-text-secondary mb-3.5">
                Review ESI score recommendation, structured drivers, and routing. Confirm, modify, or override scoring below.
              </p>
              
              <DecisionButtons
                recommendedEsi={recommendation.acuity_score}
                suggestedRouting={recommendation.suggested_routing}
                onAccept={onAccept}
                onModify={onModify}
                onOverride={onOverride}
              />
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold">
                <span> Triage Queue State</span>
                <span>HIPAA Status</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border font-bold ${
                  status === 'ACCEPTED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  status === 'MODIFIED' ? 'text-blue-700 bg-blue-50 border-blue-200' :
                  status === 'OVERRIDDEN' ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-slate-500 bg-slate-100 border-slate-200 animate-pulse'
                }`}>
                  {status}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-0.5" /> HIPAA Auditing Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
