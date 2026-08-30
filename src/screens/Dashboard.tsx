import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowUpDown, Filter, Play, Activity } from 'lucide-react';
import type { Patient, VitalsReading, CapacitySnapshot, EsiLevel } from '../types';
import { PatientRow, CapacityBar } from '../components';

interface DashboardProps {
  patients: Patient[];
  vitals: Record<string, VitalsReading>;
  triageStatuses: Record<string, 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'OVERRIDDEN' | 'AWAITING_CONFIRMATION'>;
  waitTimes: Record<string, number>;
  surgeMode: boolean;
  onToggleSurgeMode: () => void;
  onSelectPatient: (id: string) => void;
  triggerDemoAlert: (patientId: string, reason: string) => void;
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  vitals,
  triageStatuses,
  waitTimes,
  surgeMode,
  onToggleSurgeMode,
  onSelectPatient,
  triggerDemoAlert,
  className = '',
}) => {
  const [sortBy, setSortBy] = useState<'acuity' | 'wait'>('acuity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = ESI 1 first, longest wait first
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'OVERRIDDEN' | 'AWAITING_CONFIRMATION'>('ALL');

  // Local state for wait times counting up
  const [liveWaitTimes, setLiveWaitTimes] = useState<Record<string, number>>(waitTimes);

  useEffect(() => {
    setLiveWaitTimes(waitTimes);
  }, [waitTimes]);

  // Live timer tick every 10 seconds (simulated minutes counting up)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveWaitTimes(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = next[id] + 1;
        });
        return next;
      });
    }, 10000); // 10s = 1 min in simulated dashboard time
    return () => clearInterval(timer);
  }, []);

  // Mock Zone Capacity Snapshots based on surge mode
  const resusSnapshot: CapacitySnapshot = {
    id: 'c1',
    timestamp: new Date().toISOString(),
    zone_name: 'Resuscitation (Resus)',
    staff_on_shift: surgeMode ? 6 : 4,
    surge_mode: surgeMode,
    waiting_patients: surgeMode ? 2 : 0,
    longest_wait_time_minutes: 0
  };

  const acuteSnapshot: CapacitySnapshot = {
    id: 'c2',
    timestamp: new Date().toISOString(),
    zone_name: 'Acute Care (Zone A)',
    staff_on_shift: surgeMode ? 10 : 8,
    surge_mode: surgeMode,
    waiting_patients: surgeMode ? 18 : 6,
    longest_wait_time_minutes: surgeMode ? 55 : 24
  };

  const fastTrackSnapshot: CapacitySnapshot = {
    id: 'c3',
    timestamp: new Date().toISOString(),
    zone_name: 'Fast Track (Zone B)',
    staff_on_shift: surgeMode ? 3 : 2,
    surge_mode: false,
    waiting_patients: surgeMode ? 9 : 3,
    longest_wait_time_minutes: surgeMode ? 42 : 15
  };

  // Filter & Sort patients
  const filteredPatients = patients.filter(p => {
    const status = triageStatuses[p.id] || 'PENDING';
    if (statusFilter === 'ALL') return true;
    return status === statusFilter;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === 'acuity') {
      // ESI level sorting (1 is most acute, so b - a for desc, a - b for asc)
      const levelA = a.id === 'pat-1' ? 3 : a.id === 'pat-2' ? 2 : a.id === 'pat-3' ? 2 : a.id === 'pat-4' ? 4 : 2;
      const levelB = b.id === 'pat-1' ? 3 : b.id === 'pat-2' ? 2 : b.id === 'pat-3' ? 2 : b.id === 'pat-4' ? 4 : 2;
      return sortOrder === 'asc' ? levelA - levelB : levelB - levelA;
    } else {
      // Wait time sorting
      const waitA = liveWaitTimes[a.id] || 0;
      const waitB = liveWaitTimes[b.id] || 0;
      return sortOrder === 'asc' ? waitB - waitA : waitA - waitB; // longest wait first
    }
  });

  const toggleSort = (field: 'acuity' | 'wait') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Safe threshold breaches for alert triggers
  const getDeteriorationReason = (pId: string): string => {
    if (pId === 'pat-2') return 'Core body temperature 103.1°F and heart rate 138 bpm exceed safe limits for pediatric patient.';
    if (pId === 'pat-5') return 'Oxygen saturation has dropped to 93% and heart rate is 112 bpm.';
    return 'Patient has been waiting past safe triage window limits.';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Capacity & Surge Mode Bar */}
      <section className="space-y-3.5">
        <div className="flex justify-between items-center bg-white border border-clinical-border p-3.5 rounded shadow-sm">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <span className="font-bold text-sm text-clinical-text-primary">ED Zone Capacity Status</span>
              <p className="text-[11px] text-clinical-text-secondary mt-0.5">Real-time occupancy and staffing level snapshot</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
            <span className="text-xs font-semibold text-clinical-text-secondary">Surge Triage Mode (3x Volume)</span>
            <button
              onClick={onToggleSurgeMode}
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${surgeMode ? 'bg-red-600' : 'bg-slate-300'}`}
              role="switch"
              aria-checked={surgeMode}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${surgeMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {surgeMode && (
          <div className="bg-red-50 border border-red-200 p-2.5 rounded text-red-900 font-semibold text-xs flex items-center space-x-2 animate-pulse-slow">
            <AlertCircle className="w-4 h-4 text-red-700 animate-pulse" />
            <span>Surge Mode ACTIVE: 3x normal patient volume and acuity distribution. Resources congested.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CapacityBar snapshot={resusSnapshot} totalBeds={5} occupiedBeds={surgeMode ? 5 : 2} />
          <CapacityBar snapshot={acuteSnapshot} totalBeds={20} occupiedBeds={surgeMode ? 19 : 12} />
          <CapacityBar snapshot={fastTrackSnapshot} totalBeds={8} occupiedBeds={surgeMode ? 7 : 4} />
        </div>
      </section>

      {/* Main Queue Table */}
      <section className="bg-white border border-clinical-border rounded shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-clinical-text-primary">Triage Assessment Queue</h2>
            <p className="text-[11px] text-clinical-text-secondary mt-0.5">Select a patient row to complete triage routing or review deterioration trends.</p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-xs text-clinical-text-secondary border border-slate-200 px-2 py-1 rounded bg-slate-50">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent font-medium text-clinical-text-primary focus:outline-none"
              >
                <option value="ALL">All Patients</option>
                <option value="AWAITING_CONFIRMATION">Awaiting Confirmation</option>
                <option value="PENDING">Pending Review</option>
                <option value="ACCEPTED">Accepted AI ESI</option>
                <option value="MODIFIED">Modified Routing</option>
                <option value="OVERRIDDEN">ESI Overrides</option>
              </select>
            </div>

            {/* Alert Demo Button */}
            <button
              onClick={() => {
                const targetId = surgeMode ? 'pat-7' : 'pat-2';
                triggerDemoAlert(targetId, getDeteriorationReason(targetId));
              }}
              className="inline-flex items-center px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-800 text-xs font-semibold shadow-sm transition-colors"
              title="Triggers demo deterioration popup alert"
            >
              <Play className="w-3 h-3 mr-1 text-red-600 fill-red-600" />
              Trigger Alert Demo
            </button>
          </div>
        </div>

        {/* Table Headers */}
        <div className="flex items-center justify-between border-b border-clinical-border bg-slate-50 py-2 px-3 text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold select-none">
          <div className="flex items-center space-x-2.5 w-[140px] flex-shrink-0 cursor-pointer hover:text-clinical-text-primary" onClick={() => toggleSort('acuity')}>
            <span>Severity / ESI</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>
          <div className="w-[180px] flex-shrink-0">Demographics & History</div>
          <div className="flex-grow min-w-[280px]">Vitals Metrics</div>
          <div className="w-[90px] flex-shrink-0 text-right pr-3 cursor-pointer hover:text-clinical-text-primary" onClick={() => toggleSort('wait')}>
            <span>Wait Time</span>
            <ArrowUpDown className="w-3 h-3 inline ml-1" />
          </div>
          <div className="w-[100px] flex-shrink-0 text-right">Triage State</div>
        </div>

        {/* Patients List */}
        <div className="divide-y divide-slate-100 min-h-[250px]">
          {sortedPatients.length > 0 ? (
            sortedPatients.map((patient) => {
              const patientVitals = vitals[patient.id] || {
                id: '', patient_id: patient.id, timestamp: '',
                heart_rate: 75, respiratory_rate: 16, temperature: 98.6,
                blood_pressure_systolic: 120, blood_pressure_diastolic: 80,
                oxygen_saturation: 98, pain_score: 0
              };
              let status = triageStatuses[patient.id] || 'PENDING';
              
              if (patient.latest_recommendation && patient.latest_recommendation.acuity_score <= 2 && status !== 'ACCEPTED' && status !== 'MODIFIED' && status !== 'OVERRIDDEN') {
                status = 'AWAITING_CONFIRMATION';
              }
              
              const level = patient.latest_recommendation?.acuity_score || 3;

              return (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  vitals={patientVitals}
                  assignedEsi={level as EsiLevel}
                  waitTimeMinutes={liveWaitTimes[patient.id] || 0}
                  isDeteriorating={patient.id === 'pat-2' || patient.id === 'pat-7'}
                  status={status}
                  onSelect={() => onSelectPatient(patient.id)}
                />
              );
            })
          ) : (
            <div className="p-12 text-center text-clinical-text-secondary">
              No patients match the selected triage status filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
