'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-foggy uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foggy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rausch focus-visible:ring-rausch",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-sm text-rausch">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-foggy uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[120px] w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan transition-colors placeholder:text-foggy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            error && "border-rausch focus-visible:ring-rausch",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-sm text-rausch">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
