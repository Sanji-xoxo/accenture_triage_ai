import React from 'react';
import { ShieldCheck, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import type { AuditLogEntry } from '../types';

interface AuditLogRowProps {
  entry: AuditLogEntry;
  className?: string;
}

export const AuditLogRow: React.FC<AuditLogRowProps> = ({ entry, className = '' }) => {
  const { timestamp, actor_id, patient_id, action_type, entity_type, details } = entry;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'RECOMMENDATION_GENERATED':
        return <span title="System Recommendation Generated"><ShieldCheck className="w-3.5 h-3.5 text-blue-600" /></span>;
      case 'NURSE_TRIAGE_COMPLETE':
        return <span title="Triage Signed Off by Nurse"><UserCheck className="w-3.5 h-3.5 text-emerald-600" /></span>;
      case 'RE_ASSESSMENT_PROMPT':
        return <span title="System Triggered Re-assessment"><RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" /></span>;
      case 'VITALS_ALERT':
        return <span title="Vitals Deterioration Alert"><AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" /></span>;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return isoString;
    }
  };

  const getLogSummary = () => {
    if (action_type === 'NURSE_TRIAGE_COMPLETE') {
      const { action_type: nurseAction, final_esi_level, note } = details;
      return (
        <span>
          Clinician <strong className="text-slate-800">{actor_id}</strong> completed triage:{' '}
          <span className="px-1.5 py-0.25 bg-slate-100 border rounded font-semibold text-slate-800 text-[11px]">
            {nurseAction} (ESI {final_esi_level})
          </span>
          {note ? ` with note: "${note}"` : ''}
        </span>
      );
    }
    if (action_type === 'RECOMMENDATION_GENERATED') {
      const { acuity_score, confidence_score, is_escalated_low_confidence, is_escalated_red_flag } = details;
      const escalationReason = is_escalated_red_flag 
        ? ' (Escalated: red flags)' 
        : is_escalated_low_confidence 
        ? ' (Escalated: low confidence)' 
        : '';
      return (
        <span>
          AI engine generated ESI {acuity_score} recommendation with {confidence_score}% confidence
          <span className="text-red-700 font-semibold">{escalationReason}</span>.
        </span>
      );
    }
    if (action_type === 'VITALS_ALERT') {
      const { alert_reason } = details;
      return (
        <span className="text-red-700 font-medium">
          Deterioration alert triggered: {alert_reason}
        </span>
      );
    }
    return `Action ${action_type} recorded on ${entity_type} (${entry.entity_id})`;
  };

  return (
    <div className={`flex items-center space-x-3 py-1.5 px-2.5 border-b border-slate-100 hover:bg-slate-50 text-[12px] ${className}`}>
      <div className="font-mono text-[11px] text-slate-400 select-none">
        {formatTimestamp(timestamp)}
      </div>
      <div className="flex-shrink-0">
        {getActionIcon(action_type)}
      </div>
      <div className="w-20 font-mono text-[11px] text-slate-500 truncate" title={`Patient ID: ${patient_id}`}>
        P-{patient_id.slice(-6)}
      </div>
      <div className="flex-grow text-clinical-text-secondary select-all">
        {getLogSummary()}
      </div>
      <div className="text-[10px] bg-slate-100 border text-slate-600 font-mono px-1 rounded select-none">
        HIPAA Audited
      </div>
    </div>
  );
};
