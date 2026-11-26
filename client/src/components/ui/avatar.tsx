import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'offline';
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  src,
  alt = 'Avatar',
  initials,
  size = 'md',
  status,
  ...props
}) => {
  const sizes = {
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-14 w-14 text-base font-bold',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    busy: 'bg-amber-500',
    offline: 'bg-slate-400',
  };

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-slate-800 text-white font-semibold uppercase tracking-wider select-none border border-slate-700 overflow-hidden shadow-xs',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span>{initials.slice(0, 2)}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};
