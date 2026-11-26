import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  variant?: 'default' | 'accent' | 'success' | 'danger';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  value = 0,
  max = 100,
  variant = 'accent',
  showLabel = false,
  size = 'md',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const variants = {
    default: 'bg-slate-900',
    accent: 'bg-amber-500',
    success: 'bg-emerald-600',
    danger: 'bg-red-600',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full space-y-1', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-mono font-medium text-slate-600">
          <span>Progress</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60', heights[size])}>
        <div
          className={cn('h-full transition-all duration-300 ease-in-out rounded-full', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
