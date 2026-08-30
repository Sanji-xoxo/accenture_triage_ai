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

      {/* Key Drivers */}
      <div>
        <span className="block text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold mb-1">Key Clinical Drivers</span>
        <div className="flex flex-wrap gap-1">
          {key_drivers.length > 0 ? (
            key_drivers.map((driver, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                <Activity className="w-2.5 h-2.5 mr-1 text-slate-500" />
                {driver}
              </span>
            ))
          ) : (
            <span className="text-xs text-clinical-text-secondary italic">No critical physiological triggers detected.</span>
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

      {/* Audit Footnote */}
      <div className="text-[10px] text-clinical-text-muted flex justify-between select-none pt-1 border-t border-slate-100 font-mono">
        <span>Engine: {model_version}</span>
        <span>Recommendation by Rules Engine v1.0; explanation assisted by AI</span>
      </div>
    </div>
  );
};
