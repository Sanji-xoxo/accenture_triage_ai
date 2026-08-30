import React from 'react';

interface ConfidenceChipProps {
  score: number; // 0 to 100
  className?: string;
}

export const ConfidenceChip: React.FC<ConfidenceChipProps> = ({ score, className = '' }) => {
  const getStyles = (val: number) => {
    if (val >= 80) {
      return {
        bg: 'bg-confidence-high-bg text-confidence-high-text border-green-200',
        label: 'High Confidence',
        barColor: 'bg-green-600',
      };
    } else if (val >= 50) {
      return {
        bg: 'bg-confidence-medium-bg text-confidence-medium-text border-amber-200',
        label: 'Medium Confidence',
        barColor: 'bg-amber-500',
      };
    } else {
      return {
        bg: 'bg-confidence-low-bg text-confidence-low-text border-red-200',
        label: 'Low Confidence (Escalated)',
        barColor: 'bg-red-600',
      };
    }
  };

  const { bg, label, barColor } = getStyles(score);

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-[11px] font-medium leading-none ${bg} ${className}`}
      title={`${label}: ${score}%`}
    >
      <span className="font-semibold">{score}% AI Conf.</span>
      <div className="w-10 h-1.5 bg-slate-200/60 rounded-full overflow-hidden inline-flex">
        <div 
          className={`h-full ${barColor} transition-all duration-500`} 
          style={{ width: `${score}%` }} 
        />
      </div>
    </div>
  );
};
