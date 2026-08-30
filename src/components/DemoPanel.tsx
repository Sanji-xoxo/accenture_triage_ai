import React, { useState } from 'react';
import { Settings, Play, Pause, RotateCcw, AlertTriangle, Zap, Database } from 'lucide-react';

interface DemoPanelProps {
  simState: { isRunning: boolean; multiplier: number; simNow: string };
  surgeMode: boolean;
  patients: { id: string; name: string }[];
  onSimControl: (action: string, multiplier?: number) => void;
  onToggleSurge: () => void;
  onForceZoneFull: () => void;
  onFireDeterioration: (patientId: string) => void;
  onResetDb: () => void;
}

export const DemoPanel: React.FC<DemoPanelProps> = ({
  simState,
  surgeMode,
  patients,
  onSimControl,
  onToggleSurge,
  onForceZoneFull,
  onFireDeterioration,
  onResetDb
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-14 right-4 bg-white shadow-lg border border-slate-200 rounded-full p-3 z-50 hover:bg-slate-50 transition-colors"
        title="Open Demo Control Panel"
      >
        <Settings className="w-5 h-5 text-slate-600" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-14 right-4 w-80 bg-white shadow-xl border border-slate-200 rounded-lg overflow-hidden z-50 flex flex-col text-sm">
      <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center"><Settings className="w-4 h-4 mr-2" /> Demo Control Panel</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white">&times;</button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Clock Controls */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Simulation Clock</label>
          <div className="flex space-x-2">
            {simState.isRunning ? (
              <button onClick={() => onSimControl('pause')} className="flex-1 py-1.5 bg-amber-100 text-amber-800 rounded flex justify-center items-center font-medium hover:bg-amber-200">
                <Pause className="w-3 h-3 mr-1" /> Pause
              </button>
            ) : (
              <button onClick={() => onSimControl('start')} className="flex-1 py-1.5 bg-emerald-100 text-emerald-800 rounded flex justify-center items-center font-medium hover:bg-emerald-200">
                <Play className="w-3 h-3 mr-1" /> Start
              </button>
            )}
            <button onClick={() => onSimControl('reset')} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded flex justify-center items-center hover:bg-slate-200">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="text-right text-xs text-slate-400 mt-1">Speed: {(simState.multiplier * 60).toFixed(0)}x real-time</div>
        </div>

        <hr className="border-slate-100" />

        {/* Scene Triggers */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scene Triggers</label>
          <div className="space-y-2">
            <button 
              onClick={onToggleSurge}
              className={`w-full py-1.5 rounded flex justify-center items-center font-medium border ${surgeMode ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" /> 
              {surgeMode ? 'Disable Surge Mode' : 'Enable Surge Mode'}
            </button>
            
            <button 
              onClick={onForceZoneFull}
              className="w-full py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded flex justify-center items-center font-medium hover:bg-slate-100"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> 
              Force Resus Zone Full
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Directed Deterioration */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fire Deterioration</label>
          <div className="flex space-x-2">
            <select 
              className="flex-1 border border-slate-200 rounded text-xs p-1"
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
            >
              <option value="">Select Patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button 
              onClick={() => {
                if (selectedPatient) onFireDeterioration(selectedPatient);
              }}
              disabled={!selectedPatient}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              Fire
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Hard Reset */}
        <div>
          <button 
            onClick={() => {
              if (window.confirm('This will wipe all data and delete the database files. Are you sure?')) {
                onResetDb();
              }
            }}
            className="w-full py-1.5 bg-red-50 text-red-700 border border-red-200 rounded flex justify-center items-center font-bold hover:bg-red-100"
          >
            <Database className="w-3.5 h-3.5 mr-1.5" /> 
            Hard Reset DB
          </button>
        </div>
      </div>
    </div>
  );
};
