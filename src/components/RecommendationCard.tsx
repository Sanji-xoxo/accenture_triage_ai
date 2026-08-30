import React from 'react';
import { Sparkles, Activity } from 'lucide-react';
import type { Recommendation } from '../types';
import { AcuityBadge } from './AcuityBadge';
import { ConfidenceChip } from './ConfidenceChip';
import { EscalationFlag } from './EscalationFlag';

interface RecommendationCardProps {
  recommendation: Recommendation;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  className = '',
}) => {
  const {
    acuity_score,
    confidence_score,
    explanation,
    is_escalated_low_confidence,
    is_escalated_red_flag,
    is_escalated_clinical,
    key_drivers,
    suggested_routing,
    is_capacity_adjusted,
    model_version,
  } = recommendation;

  return (
    <div className={`p-4 bg-white border border-slate-200 rounded shadow-sm flex flex-col space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <AcuityBadge level={acuity_score} />
          {is_escalated_red_flag && <EscalationFlag type="red_flag" />}
          {is_escalated_low_confidence && <EscalationFlag type="low_confidence" />}
          {is_escalated_clinical && <EscalationFlag type="clinical" />}
        </div>
        <ConfidenceChip score={confidence_score} />
      </div>

      {/* Suggested Routing */}
      <div className={`grid grid-cols-2 gap-3 p-2.5 rounded border ${is_capacity_adjusted ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
        <div>
          <span className="block text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold">Recommended Zone</span>
          <span className={`text-xs font-bold ${is_capacity_adjusted ? 'text-orange-800' : 'text-slate-800'}`}>{suggested_routing || 'Unassigned'}</span>
          {is_capacity_adjusted && <span className="block text-[9px] text-orange-600 font-bold mt-0.5 uppercase tracking-wide">Capacity Adjusted</span>}
        </div>
        <div className="text-right">
          <span className="block text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold">Deterministic Score</span>
          <span className="text-xs font-semibold text-slate-700">ESI {acuity_score} Engine</span>
        </div>
      </div>

      {/* Deterioration Risk Prediction */}
      {recommendation.deterioration_risk_pct !== undefined && (
        <div className="bg-slate-800 text-white p-2.5 rounded shadow-inner">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300">Deterioration Model (GRU)</span>
             <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${recommendation.deterioration_risk_pct > 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {recommendation.deterioration_risk_pct.toFixed(1)}% Risk
             </span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1 mb-1">
             <div className={`h-full ${recommendation.deterioration_risk_pct > 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${recommendation.deterioration_risk_pct}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 italic text-right">Est. time to event: {recommendation.time_to_deterioration_mins?.toFixed(0)} mins</p>
        </div>
      )}

      {/* SHAP Feature Importance */}
      <div>
        <span className="block text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold mb-1">XGBoost SHAP Feature Importance</span>
        <div className="flex flex-col gap-1 mt-1">
          {key_drivers.length > 0 ? (
            key_drivers.map((driver, idx) => {
              const isAggravating = driver.includes('+');
              return (
                <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-1 rounded">
                  <span className="text-[11px] font-medium text-slate-700 flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-slate-400" />
                    {driver.split(':')[0]}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isAggravating ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {driver.split(':')[1]}
                  </span>
                </div>
              );
            })
          ) : (
            <span className="text-xs text-clinical-text-secondary italic">No features exceeded SHAP importance threshold.</span>
          )}
        </div>
      </div>

      {/* Narrative Explanation */}
      <div className="space-y-1">
        <span className="block text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold flex items-center">
          <Sparkles className="w-3 h-3 mr-1 text-blue-500" /> Clinical Recommendation Explanation
        </span>
        <p className="text-xs leading-relaxed text-clinical-text-secondary whitespace-pre-line bg-blue-50/20 p-2.5 rounded border border-blue-50">
          {explanation}
        </p>
      </div>

      {recommendation.escalation_reason && (
        <div className="space-y-1 mt-2">
          <span className="block text-[10px] text-red-600 uppercase tracking-wider font-bold flex items-center">
             Escalation Reason
          </span>
          <p className="text-xs font-medium leading-relaxed text-red-700 whitespace-pre-line bg-red-50 p-2.5 rounded border border-red-100">
            {recommendation.escalation_reason}
          </p>
        </div>
      )}

      {/* Audit Footnote */}
      <div className="text-[10px] text-clinical-text-muted flex justify-between select-none pt-1 border-t border-slate-100 font-mono">
        <span>Engine: {model_version}</span>
        <span>Recommendation by Rules Engine v1.0; explanation assisted by AI</span>
      </div>
    </div>
  );
};
