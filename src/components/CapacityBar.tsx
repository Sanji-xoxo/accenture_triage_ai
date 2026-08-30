import React from 'react';
import { AlertCircle, Users } from 'lucide-react';
import type { CapacitySnapshot } from '../types';

interface CapacityBarProps {
  snapshot: CapacitySnapshot;
  totalBeds?: number; // fallback total beds if not present in schema
  occupiedBeds?: number; // fallback occupied if not present in schema
  className?: string;
}

export const CapacityBar: React.FC<CapacityBarProps> = ({
  snapshot,
  totalBeds = 10,
  occupiedBeds,
  className = '',
}) => {
  const { zone_name, staff_on_shift, surge_mode, waiting_patients } = snapshot;

  // Let's derive beds occupancy or use fallbacks for display purposes
  const computedOccupied = occupiedBeds !== undefined ? occupiedBeds : Math.max(0, totalBeds - waiting_patients);
  const occupancyPercent = Math.min(100, Math.round((computedOccupied / totalBeds) * 100));

  const getBarColor = (pct: number, surge: boolean) => {
    if (surge) return 'bg-red-600';
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const barColor = getBarColor(occupancyPercent, surge_mode);

  return (
    <div className={`p-2.5 bg-white border border-clinical-border rounded shadow-sm ${surge_mode ? 'border-red-300 ring-1 ring-red-100' : ''} ${className}`}>
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-xs text-clinical-text-primary">{zone_name}</span>
            {surge_mode && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse-rapid">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> SURGE
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-clinical-text-secondary">
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-0.5 text-slate-400" /> Staff: {staff_on_shift}
            </span>
            <span>•</span>
            <span>Wait Q: {waiting_patients}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-xs text-clinical-text-primary">
            {computedOccupied}/{totalBeds} Beds
          </span>
          <span className="block text-[10px] text-clinical-text-muted">{occupancyPercent}% cap</span>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${occupancyPercent}%` }}
        />
      </div>
    </div>
  );
};
