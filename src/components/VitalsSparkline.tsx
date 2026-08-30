import React from 'react';

interface VitalsSparklineProps {
  label: string;
  value: string | number;
  unit: string;
  history: number[]; // numerical history, e.g. [72, 75, 80, 85, 90]
  minSafe: number;
  maxSafe: number;
  className?: string;
}

export const VitalsSparkline: React.FC<VitalsSparklineProps> = ({
  label,
  value,
  unit,
  history,
  minSafe,
  maxSafe,
  className = '',
}) => {
  // Check if current value is out of range
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isOutOfRange = isNaN(numValue) || numValue < minSafe || numValue > maxSafe;

  // Render SVG Sparkline
  const renderSparkline = () => {
    if (!history || history.length < 2) return null;

    const width = 64;
    const height = 18;
    const minVal = Math.min(...history) - 5;
    const maxVal = Math.max(...history) + 5;
    const valRange = maxVal - minVal || 1;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - ((val - minVal) / valRange) * height;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isOutOfRange ? '#EF4444' : '#64748B'; // Red or Slate 500

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          points={points}
        />
        {/* Draw a dot on the latest point */}
        {history.length > 0 && (
          <circle
            cx={width}
            cy={height - ((history[history.length - 1] - minVal) / valRange) * height}
            r="2"
            fill={strokeColor}
          />
        )}
      </svg>
    );
  };

  return (
    <div className={`inline-flex items-center space-x-2 py-0.5 px-1.5 border rounded bg-slate-50/50 ${isOutOfRange ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} ${className}`}>
      <div className="flex flex-col min-w-[55px]">
        <span className="text-[10px] text-clinical-text-muted uppercase tracking-wider font-semibold leading-none">{label}</span>
        <span className={`text-xs font-bold mt-0.5 leading-none ${isOutOfRange ? 'text-red-700 animate-pulse' : 'text-clinical-text-primary'}`}>
          {value}<span className="text-[9px] font-normal ml-0.5 text-slate-400">{unit}</span>
        </span>
      </div>
      <div className="flex items-center h-[18px]">
        {renderSparkline()}
      </div>
    </div>
  );
};
