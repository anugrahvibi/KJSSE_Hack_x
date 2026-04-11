import React from 'react';

interface ProgressBarProps {
  value: number | string;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  animated?: boolean;
}

export function ProgressBar({
  value,
  className = '',
  trackClassName = '',
  fillClassName = '',
  animated = false,
}: ProgressBarProps) {
  const width = typeof value === 'number' ? `${Math.max(0, Math.min(100, value))}%` : value;

  return (
    <div className={`w-full overflow-hidden rounded-full ${className} ${trackClassName}`.trim()}>
      <div
        className={`h-full rounded-full ${animated ? 'animate-pulse' : ''} ${fillClassName}`.trim()}
        style={{ width }}
      />
    </div>
  );
}
