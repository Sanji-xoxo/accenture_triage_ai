import React from 'react';
import { Activity, Flame, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { EsiLevel } from '../types';

interface AcuityBadgeProps {
  level: EsiLevel;
  className?: string;
}

export const AcuityBadge: React.FC<AcuityBadgeProps> = ({ level, className = '' }) => {
  const getBadgeStyles = (esi: EsiLevel) => {
    switch (esi) {
      case 1:
        return {
          bg: 'bg-esi-1-bg text-esi-1-text border-esi-1-border',
          text: 'ESI 1 - Resuscitation',
          icon: <Activity className="w-3.5 h-3.5 mr-1 animate-pulse" />,
        };
      case 2:
        return {
          bg: 'bg-esi-2-bg text-esi-2-text border-esi-2-border',
          text: 'ESI 2 - Emergent',
          icon: <Flame className="w-3.5 h-3.5 mr-1" />,
        };
      case 3:
        return {
          bg: 'bg-esi-3-bg text-esi-3-text border-esi-3-border',
          text: 'ESI 3 - Urgent',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
        };
      case 4:
        return {
          bg: 'bg-esi-4-bg text-esi-4-text border-esi-4-border',
          text: 'ESI 4 - Less Urgent',
          icon: <ArrowRight className="w-3.5 h-3.5 mr-1" />,
        };
      case 5:
        return {
          bg: 'bg-esi-5-bg text-esi-5-text border-esi-5-border',
          text: 'ESI 5 - Non-Urgent',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          text: `ESI ${esi}`,
          icon: null,
        };
    }
  };

  const { bg, text, icon } = getBadgeStyles(level);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${bg} ${className}`}
      role="status"
      aria-label={`Acuity score: ${text}`}
    >
      {icon}
      <span>{text}</span>
    </span>
  );
};
