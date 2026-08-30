import React, { useState } from 'react';
import { Check, Edit2, ShieldAlert, X } from 'lucide-react';
import type { EsiLevel } from '../types';

interface DecisionButtonsProps {
  recommendedEsi: EsiLevel;
  suggestedRouting: string;
  onAccept: (routing: string) => void;
  onModify: (routing: string) => void;
  onOverride: (newEsi: EsiLevel, note: string, routing: string) => void;
  className?: string;
}

export const DecisionButtons: React.FC<DecisionButtonsProps> = ({
  recommendedEsi,
  suggestedRouting,
  onAccept,
  onModify,
  onOverride,
  className = '',
}) => {
  const [activeAction, setActiveAction] = useState<'none' | 'modify' | 'override'>('none');
  const [overrideEsi, setOverrideEsi] = useState<EsiLevel>(recommendedEsi);
  const [overrideNote, setOverrideNote] = useState('');
  const [routingVal, setRoutingVal] = useState(suggestedRouting);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAcceptClick = () => {
    onAccept(suggestedRouting);
    setActiveAction('none');
  };

  const handleModifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routingVal.trim()) {
      setErrorMsg('Routing location is required.');
      return;
    }
    onModify(routingVal.trim());
    setActiveAction('none');
    setErrorMsg('');
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideEsi === recommendedEsi) {
      setErrorMsg('Override ESI must be different from recommended ESI.');
      return;
    }
    if (!overrideNote.trim()) {
      setErrorMsg('Clinician note is required for ESI override.');
      return;
    }
    onOverride(overrideEsi, overrideNote.trim(), routingVal.trim());
    setActiveAction('none');
    setOverrideNote('');
    setErrorMsg('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {activeAction === 'none' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAcceptClick}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded border border-emerald-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            title="Accept current recommendation (Alt+A)"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Accept Recommendation
          </button>
          
          <button
            onClick={() => {
              setActiveAction('modify');
              setErrorMsg('');
            }}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded border border-slate-300 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Modify routing only (Alt+M)"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Modify Routing
          </button>
          
          <button
            onClick={() => {
              setActiveAction('override');
              setErrorMsg('');
            }}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 font-semibold text-xs rounded shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            title="Override ESI score (Alt+O)"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-purple-600 animate-pulse" />
            Override ESI
          </button>
        </div>
      )}

      {activeAction === 'modify' && (
        <form onSubmit={handleModifySubmit} className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
            <span className="font-semibold text-xs text-slate-800">Modify Routing Location</span>
            <button 
              type="button" 
              onClick={() => setActiveAction('none')}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Suggested Routing</label>
            <input
              type="text"
              value={routingVal}
              onChange={(e) => setRoutingVal(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              placeholder="Enter ED Zone or Bed"
            />
          </div>

          {errorMsg && <p className="text-red-600 text-xs font-medium">{errorMsg}</p>}

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveAction('none')}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm"
            >
              Confirm Modify
            </button>
          </div>
        </form>
      )}

      {activeAction === 'override' && (
        <form onSubmit={handleOverrideSubmit} className="bg-purple-50/50 p-3 rounded border border-purple-200 space-y-2.5">
          <div className="flex justify-between items-center pb-1.5 border-b border-purple-200">
            <span className="font-semibold text-xs text-purple-950 flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-purple-600" /> ESI Clinician Override
            </span>
            <button 
              type="button" 
              onClick={() => setActiveAction('none')}
              className="text-purple-400 hover:text-purple-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-purple-800 mb-1 uppercase tracking-wider">Override ESI</label>
              <select
                value={overrideEsi}
                onChange={(e) => setOverrideEsi(Number(e.target.value) as EsiLevel)}
                className="w-full px-2 py-1 bg-white border border-purple-300 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    ESI {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-purple-800 mb-1 uppercase tracking-wider">Target Routing</label>
              <input
                type="text"
                value={routingVal}
                onChange={(e) => setRoutingVal(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-purple-300 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                placeholder="Routing Location"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-purple-800 mb-1 uppercase tracking-wider">Clinician Justification (Required)</label>
            <textarea
              rows={2}
              value={overrideNote}
              onChange={(e) => setOverrideNote(e.target.value)}
              className="w-full px-2 py-1 bg-white border border-purple-300 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
              placeholder="Specify medical rationale for overriding the recommendation..."
            />
          </div>

          {errorMsg && <p className="text-red-600 text-xs font-medium">{errorMsg}</p>}

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setActiveAction('none')}
              className="px-2.5 py-1 text-purple-700 hover:bg-purple-100 rounded text-xs border border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-semibold shadow-sm"
            >
              Log Audit & Apply
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
