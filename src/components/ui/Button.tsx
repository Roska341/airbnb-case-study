'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'default' | 'sm' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-btn font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan disabled:pointer-events-none disabled:bg-light-gray disabled:text-foggy",
          {
            'bg-rausch text-white hover:bg-[#E04E53]': variant === 'primary' && !disabled,
            'bg-white text-kazan border border-kazan hover:bg-bg-gray': variant === 'secondary' && !disabled,
            'bg-transparent text-rausch hover:underline px-0': variant === 'text' && !disabled,
            'h-12 px-6 text-base': size === 'default' && variant !== 'text',
            'h-9 px-4 text-sm': size === 'sm' && variant !== 'text',
            'h-14 px-8 text-lg': size === 'lg' && variant !== 'text',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
