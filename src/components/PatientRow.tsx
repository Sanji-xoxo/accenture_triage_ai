import React from 'react';
import { History, HelpCircle } from 'lucide-react';
import type { Patient, VitalsReading, EsiLevel } from '../types';
import { AcuityBadge } from './AcuityBadge';

interface PatientRowProps {
  patient: Patient;
  vitals: VitalsReading;
  assignedEsi: EsiLevel;
  waitTimeMinutes: number;
  isDeteriorating?: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'OVERRIDDEN' | 'AWAITING_CONFIRMATION' | string;
  onSelect: () => void;
  isSelected?: boolean;
  className?: string;
}

export const PatientRow: React.FC<PatientRowProps> = ({
  patient,
  vitals,
  assignedEsi,
  waitTimeMinutes,
  isDeteriorating = false,
  status,
  onSelect,
  isSelected = false,
  className = '',
}) => {
  const getAge = (dob: string) => {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = getAge(patient.dob);

  // Triage Wait Time Safe Thresholds (ESI-specific)
  const getWaitThreshold = (esi: EsiLevel) => {
    switch (esi) {
      case 1: return 0;   // Immediate
      case 2: return 15;  // 15 mins
      case 3: return 30;  // 30 mins
      case 4: return 60;  // 60 mins
      case 5: return 120; // 120 mins
    }
  };

  const waitThreshold = getWaitThreshold(assignedEsi);
  const isWaitBreached = waitTimeMinutes > waitThreshold;

  // Determine if pulse alert triggers (deteriorating or wait time breach)
  const showAlertPulse = isDeteriorating || (isWaitBreached && assignedEsi <= 3);

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'PENDING':
        return 'text-slate-500 bg-slate-100 border-slate-200';
      case 'AWAITING_CONFIRMATION':
        return 'text-orange-700 bg-orange-50 border-orange-200 font-bold animate-pulse';
      case 'ACCEPTED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold';
      case 'MODIFIED':
      case 'OVERRIDDEN':
        return 'text-blue-700 bg-blue-50 border-blue-200 font-semibold';
      default:
        return 'text-slate-500 bg-slate-100 border-slate-200';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'AWAITING_CONFIRMATION': return 'Awaiting Confirm';
      case 'PENDING': return 'Pending Review';
      default: return s;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between border-b border-clinical-border py-2 px-3 text-xs cursor-pointer select-none transition-all ${
        isSelected 
          ? 'bg-blue-50/50 border-l-4 border-l-blue-600 pl-2' 
          : 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent'
      } ${showAlertPulse ? 'bg-red-50/20 ring-1 ring-red-100/50' : ''} ${className}`}
      role="row"
      aria-selected={isSelected}
    >
      {/* Acuity & Alert Status */}
      <div className="flex items-center space-x-2.5 w-[140px] flex-shrink-0">
        <AcuityBadge level={assignedEsi} className="w-[125px] flex-shrink-0" />
        {showAlertPulse && (
          <span 
            className="w-2 h-2 rounded-full bg-red-600 border border-white animate-pulse-rapid flex-shrink-0"
            title={isDeteriorating ? 'Clinical deterioration warning' : 'Wait time threshold breached'} 
          />
        )}
      </div>

      {/* Patient demographics & history indicator */}
      <div className="flex flex-col w-[180px] flex-shrink-0 min-w-0 pr-2">
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="font-semibold text-clinical-text-primary truncate">{patient.name}</span>
          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
            {patient.gender.substring(0, 1)}/{age}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 mt-0.5 text-[10px]">
          <span className="text-clinical-text-secondary">{patient.arrival_mode}</span>
          <span>•</span>
          {patient.has_prior_history ? (
            <span className="inline-flex items-center text-slate-500" title="Rich clinical history exists">
              <History className="w-3 h-3 mr-0.5" /> Recs
            </span>
          ) : (
            <span className="inline-flex items-center text-slate-400" title="No historical records found (First time)">
              <HelpCircle className="w-3 h-3 mr-0.5" /> No History
            </span>
          )}
        </div>
      </div>

      {/* Vitals Summary Panel (Abridged Vitals Row) */}
      <div className="flex items-center space-x-3.5 flex-grow min-w-[280px]">
        {/* HR */}
        <div className="flex flex-col w-12">
          <span className="text-[9px] text-clinical-text-muted uppercase font-semibold">HR</span>
          <span className={`font-semibold ${vitals.heart_rate > 100 || vitals.heart_rate < 55 ? 'text-red-700 font-bold' : 'text-clinical-text-primary'}`}>
            {vitals.heart_rate}<span className="text-[9px] font-normal text-slate-400">bpm</span>
          </span>
        </div>

        {/* BP */}
        <div className="flex flex-col w-16">
          <span className="text-[9px] text-clinical-text-muted uppercase font-semibold">BP</span>
          <span className={`font-semibold ${vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_systolic < 90 ? 'text-red-700 font-bold' : 'text-clinical-text-primary'}`}>
            {vitals.blood_pressure_systolic}/{vitals.blood_pressure_diastolic}
          </span>
        </div>

        {/* SpO2 */}
        <div className="flex flex-col w-12">
          <span className="text-[9px] text-clinical-text-muted uppercase font-semibold">SpO2</span>
          <span className={`font-semibold ${vitals.oxygen_saturation < 94 ? 'text-red-700 font-bold animate-pulse' : 'text-emerald-700 font-bold'}`}>
            {vitals.oxygen_saturation}%
          </span>
        </div>

        {/* Temp */}
        <div className="flex flex-col w-12">
          <span className="text-[9px] text-clinical-text-muted uppercase font-semibold">Temp</span>
          <span className={`font-semibold ${vitals.temperature > 100.4 || vitals.temperature < 96.8 ? 'text-amber-700' : 'text-clinical-text-primary'}`}>
            {vitals.temperature}°F
          </span>
        </div>

        {/* Pain */}
        <div className="flex flex-col w-10">
          <span className="text-[9px] text-clinical-text-muted uppercase font-semibold">Pain</span>
          <span className={`font-semibold ${vitals.pain_score >= 7 ? 'text-red-700 font-bold' : vitals.pain_score >= 4 ? 'text-amber-700 font-semibold' : 'text-clinical-text-primary'}`}>
            {vitals.pain_score}/10
          </span>
        </div>
      </div>

      {/* Wait Time Indicator */}
      <div className="flex flex-col w-[90px] flex-shrink-0 text-right pr-3">
        <span className="text-[9px] text-clinical-text-muted uppercase font-semibold">Wait Time</span>
        <span className={`font-mono font-semibold ${isWaitBreached ? 'text-red-700 font-bold' : 'text-clinical-text-primary'}`}>
          {waitTimeMinutes}m <span className="text-[10px] text-slate-400 font-normal">/ {waitThreshold}m</span>
        </span>
      </div>

      {/* Triage Decision Action Status */}
      <div className="w-[100px] flex-shrink-0 text-right">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] border ${getStatusStyle(status)}`}>
          {getStatusLabel(status)}
        </span>
      </div>
    </div>
  );
};
