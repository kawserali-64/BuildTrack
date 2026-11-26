import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  onDismiss,
  children,
  ...props
}) => {
  const icons = {
    info: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
    destructive: <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />,
  };

  const variants = {
    info: 'bg-blue-50/80 border-blue-200 text-blue-900',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
    destructive: 'bg-red-50/80 border-red-200 text-red-900',
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative flex w-full gap-3 rounded-xl border p-4 text-sm shadow-xs',
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-bold text-xs uppercase tracking-wider">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-md p-1 opacity-70 hover:opacity-100 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
