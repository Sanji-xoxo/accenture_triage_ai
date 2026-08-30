import React from 'react';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';

interface EscalationFlagProps {
  type: 'low_confidence' | 'red_flag' | 'clinical';
  className?: string;
}

export const EscalationFlag: React.FC<EscalationFlagProps> = ({ type, className = '' }) => {
  const getStyles = () => {
    switch (type) {
      case 'low_confidence':
        return {
          bg: 'bg-confidence-low-bg text-confidence-low-text border-confidence-low-text/20',
          text: 'Escalated: Low Confidence',
          icon: <ArrowUpRight className="w-3.5 h-3.5 mr-1" />,
        };
      case 'red_flag':
        return {
          bg: 'bg-intervention-alert-bg text-esi-1-bg border-intervention-alert-border font-semibold',
          text: 'Escalated: Red Flag Detected',
          icon: <ShieldAlert className="w-3.5 h-3.5 mr-1" />,
        };
      case 'clinical':
        return {
          bg: 'bg-esi-3-text text-esi-3-bg border-esi-3-border',
          text: 'Clinical Escalation',
          icon: <ArrowUpRight className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  const { bg, text, icon } = getStyles();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${bg} ${className}`}
    >
      {icon}
      <span>{text}</span>
    </span>
  );
};
