import React from 'react';
import { LayoutGrid, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import type { Patient, EsiLevel } from '../types';

interface CapacityViewProps {
  patients: Patient[];
  waitTimes: Record<string, number>;
  surgeMode: boolean;
  className?: string;
}

export const CapacityView: React.FC<CapacityViewProps> = ({
  patients,
  waitTimes,
  surgeMode,
  className = '',
}) => {
  // Acuity thresholds
  const getWaitThreshold = (esi: EsiLevel) => {
    switch (esi) {
      case 1: return 0;
      case 2: return 15;
      case 3: return 30;
      case 4: return 60;
      case 5: return 120;
    }
  };

  const getEsiLevel = (pId: string): EsiLevel => {
    if (pId === 'pat-1') return 3;
    if (pId === 'pat-2') return 2;
    if (pId === 'pat-3') return 2;
    if (pId === 'pat-4') return 4;
    if (pId === 'pat-5') return 2;
    if (pId === 'pat-7') return 1;
    if (pId === 'pat-12') return 1;
    return 3;
  };

  // Find wait threshold breaches
  const breachedPatients = patients.map(p => {
    const level = getEsiLevel(p.id);
    const wait = waitTimes[p.id] || 0;
    const thresh = getWaitThreshold(level);
    return {
      patient: p,
      esi: level,
      wait,
      thresh,
      isBreached: wait > thresh && level <= 4 // ESI 5 wait breaches are low priority
    };
  }).filter(b => b.isBreached);

  // Group by ESI level for the chart
  const countsByEsi: Record<EsiLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  patients.forEach(p => {
    const level = getEsiLevel(p.id);
    countsByEsi[level] += 1;
  });

  const maxEsiCount = Math.max(...Object.values(countsByEsi), 1);

  // Capacity stats
  const zones = [
    { name: 'Resuscitation (Resus)', beds: 5, occupied: surgeMode ? 5 : 2, staff: surgeMode ? 6 : 4, color: 'bg-red-600' },
    { name: 'Acute Medical (Zone A)', beds: 20, occupied: surgeMode ? 19 : 12, staff: surgeMode ? 10 : 8, color: 'bg-orange-600' },
    { name: 'Fast Track (Zone B)', beds: 8, occupied: surgeMode ? 7 : 4, staff: surgeMode ? 3 : 2, color: 'bg-blue-600' },
    { name: 'Waiting Room', beds: 40, occupied: surgeMode ? 28 : 12, staff: 2, color: 'bg-slate-400' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Capacity Overview Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-clinical-text-primary flex items-center">
          <LayoutGrid className="w-4 h-4 mr-1 text-slate-500" /> Emergency Department Zone Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone, idx) => {
            const utilization = Math.round((zone.occupied / zone.beds) * 100);
            const isFull = utilization >= 90;
            return (
              <div 
                key={idx} 
                className={`bg-white border rounded p-4 shadow-sm flex flex-col justify-between ${
                  isFull ? 'border-red-300 bg-red-50/10' : 'border-clinical-border'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-clinical-text-primary">{zone.name}</span>
                    <span className={`w-2 h-2 rounded-full ${zone.color}`} />
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1.5 text-[11px] text-clinical-text-secondary">
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-0.5 text-slate-400" /> Staff: {zone.staff}
                    </span>
                  </div>
                </div>

                <div className="mt-4.5 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-clinical-text-secondary">Beds utilization</span>
                    <span className={isFull ? 'text-red-700 font-bold' : 'text-slate-800'}>
                      {zone.occupied} / {zone.beds} ({utilization}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${zone.color} transition-all duration-500`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid: ESI queue length & wait time breaches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acuity queue lengths (Bar chart) */}
        <section className="bg-white border border-clinical-border rounded p-4.5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 flex items-center">
            <BarChart3 className="w-4 h-4 mr-1 text-slate-500" /> Active Queue Distribution by Acuity
          </h3>

          <div className="space-y-3.5 py-2">
            {([1, 2, 3, 4, 5] as EsiLevel[]).map((level) => {
              const count = countsByEsi[level];
              const pct = (count / maxEsiCount) * 100;
              const getBarColor = (l: EsiLevel) => {
                switch (l) {
                  case 1: return 'bg-esi-1-bg';
                  case 2: return 'bg-esi-2-bg';
                  case 3: return 'bg-esi-3-bg';
                  case 4: return 'bg-esi-4-bg';
                  case 5: return 'bg-esi-5-bg';
                }
              };
              return (
                <div key={level} className="flex items-center space-x-3 text-xs">
                  <div className="w-14 font-semibold text-slate-600">ESI {level}</div>
                  <div className="flex-grow bg-slate-55 h-5.5 rounded overflow-hidden bg-slate-100 flex items-center relative">
                    <div 
                      className={`h-full ${getBarColor(level)} transition-all duration-500`} 
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                    <span className="absolute left-2 text-[10px] font-bold text-slate-800 mix-blend-difference">{count} Patients</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Wait threshold breaches (Table) */}
        <section className="bg-white border border-clinical-border rounded p-4.5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-red-500 animate-pulse" /> Critical Wait-Time Breaches
            </h3>
            
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[220px] custom-scrollbar pr-1 mt-2">
              {breachedPatients.length > 0 ? (
                breachedPatients.map(({ patient, esi, wait, thresh }) => (
                  <div key={patient.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{patient.name}</span>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span>ESI {esi}</span>
                        <span>•</span>
                        <span>Arrival: {patient.arrival_mode}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-700 font-mono">{wait}m waiting</span>
                      <span className="block text-[9px] text-slate-400">Limit: {thresh}m</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-clinical-text-secondary italic">
                  Zero wait-time threshold breaches in queue. Good job!
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-950 font-medium">
            <strong>Resource Note:</strong> ESI 2 cases have a safe wait-time threshold of 15 minutes. Breached patients require immediate escalation or redistribution to vacant rooms.
          </div>
        </section>
      </div>
      {/* Patients by Zone Details */}
      <section className="bg-white border border-clinical-border rounded p-4.5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 flex items-center">
          <Users className="w-4 h-4 mr-1 text-slate-500" /> Patient Assignments by Zone
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {zones.map((zone, idx) => {
            // Map zone names to routing strings for filtering
            const routingKeywords = zone.name.includes('Resus') ? ['Resus'] :
                                    zone.name.includes('Acute') ? ['Acute'] :
                                    zone.name.includes('Fast') ? ['Fast Track'] :
                                    ['Wait', 'Observation'];
            
            const zonePatients = patients.filter(p => {
              const routing = p.latest_recommendation?.suggested_routing || '';
              return routingKeywords.some(kw => routing.includes(kw));
            });

            return (
              <div key={idx} className="border border-slate-200 rounded p-3 bg-slate-50 flex flex-col">
                <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs text-clinical-text-primary">{zone.name}</span>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-semibold">{zonePatients.length} Patients</span>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1 flex-grow">
                  {zonePatients.length > 0 ? (
                    zonePatients.map(p => (
                      <div key={p.id} className="bg-white p-2 rounded border border-slate-200 text-xs shadow-sm">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        <div className="flex justify-between mt-1 text-[10px]">
                          <span className="text-slate-500">ESI {p.latest_recommendation?.acuity_score || 'N/A'}</span>
                          <span className="text-blue-600 font-medium">{waitTimes[p.id] || 0}m wait</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 italic text-center py-4">No patients assigned.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
