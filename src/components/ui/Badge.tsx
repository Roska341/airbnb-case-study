'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline'
    | 'active' | 'completed' | 'draft' | 'danger-solid' | 'glass';
  className?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-kazan focus:ring-offset-2",
        {
          'bg-bg-gray text-hof': variant === 'default',
          'bg-babu/10 text-babu': variant === 'success',
          'bg-arches/10 text-arches': variant === 'warning',
          'bg-rausch/10 text-rausch': variant === 'danger',
          'border border-light-gray text-foggy': variant === 'outline',
          'bg-babu text-white shadow-sm': variant === 'active',
          'bg-hof text-white shadow-sm': variant === 'completed',
          'bg-white text-kazan shadow-sm': variant === 'draft',
          'bg-rausch text-white shadow-sm': variant === 'danger-solid',
          'text-white border border-white/30 bg-white/10 backdrop-blur-md': variant === 'glass',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
