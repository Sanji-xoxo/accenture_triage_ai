import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface DeteriorationAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  reason: string;
  onReassess: () => void;
  className?: string;
}

export const DeteriorationAlertModal: React.FC<DeteriorationAlertModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientId,
  reason,
  onReassess,
  className = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm ${className}`} role="dialog" aria-modal="true">
      <div className="bg-white border-2 border-red-500 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-pulse-slow">
        {/* Header */}
        <div className="bg-red-600 px-4 py-3 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wider">CRITICAL TRIAGE ALERT</span>
          </div>
          <button 
            onClick={onClose}
            className="text-red-100 hover:text-white transition-colors"
            aria-label="Close alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">
              Active Deterioration / Delay Warning
            </h3>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 space-y-1">
              <p><strong>Patient:</strong> {patientName} (ID: {patientId})</p>
              <p><strong>Condition:</strong> {reason}</p>
            </div>
          </div>

          <p className="text-xs text-clinical-text-secondary leading-relaxed">
            The patient's recorded safety thresholds have been breached. Clinician action is required immediately. Please re-assess clinical presentation and update triage severity or routing.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Acknowledge Later
          </button>
          <button
            onClick={() => {
              onReassess();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 shadow-sm flex items-center"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Re-assess Now
          </button>
        </div>
      </div>
    </div>
  );
};
