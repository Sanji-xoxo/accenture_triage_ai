import React, { useState } from 'react';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import type { AuditLogEntry } from '../types';
import { AuditLogRow } from '../components';

interface AuditTrailViewProps {
  logs: AuditLogEntry[];
  className?: string;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'RECOMMENDATION_GENERATED' | 'NURSE_TRIAGE_COMPLETE' | 'VITALS_ALERT'>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.actor_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'ALL' || log.action_type === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and HIPAA warning */}
      <section className="bg-white border border-clinical-border p-4.5 rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-clinical-text-primary">HIPAA Audit trail & Ledger</h2>
          </div>
          <p className="text-xs text-clinical-text-secondary mt-0.5">
            Immutable log record of AI Engine scores, clinical decisions, modifications, and justification overrides.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 text-[11px] text-red-950 p-2.5 rounded max-w-sm">
          <strong>Security Notice:</strong> Access to this ledger is restricted. All queries and exports are logged under US HIPAA compliance regulations.
        </div>
      </section>

      {/* Toolbar */}
      <section className="bg-white border border-clinical-border rounded shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-55 bg-slate-50/20">
          <div className="flex flex-wrap gap-2 flex-grow max-w-md">
            {/* Search */}
            <div className="flex items-center space-x-1.5 border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs flex-grow focus-within:ring-1 focus-within:ring-blue-500">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Patient ID or Clinician User..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent focus:outline-none w-full text-clinical-text-primary"
              />
            </div>
            
            {/* Action filter */}
            <div className="flex items-center space-x-1.5 border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="bg-transparent focus:outline-none font-medium text-clinical-text-primary"
              >
                <option value="ALL">All Actions</option>
                <option value="RECOMMENDATION_GENERATED">AI Recommended ESI</option>
                <option value="NURSE_TRIAGE_COMPLETE">Nurse Clinician Sign-off</option>
                <option value="VITALS_ALERT">System Vitals Alerts</option>
              </select>
            </div>
          </div>
          
          <div className="text-[10px] text-clinical-text-muted font-mono select-none">
            Displaying {filteredLogs.length} audit entries
          </div>
        </div>

        {/* Ledger logs container */}
        <div className="divide-y divide-slate-100 min-h-[300px] overflow-y-auto custom-scrollbar">
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <AuditLogRow key={log.id} entry={log} />
            ))
          ) : (
            <div className="p-12 text-center text-clinical-text-secondary italic">
              No matching HIPAA audit records on file.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
