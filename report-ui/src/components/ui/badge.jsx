import React from 'react';
import { cn } from '@/lib/cn';

const variants = {
  default: 'border-transparent bg-slate-900 text-white',
  outline: 'border-slate-300 bg-transparent text-slate-700 dark:border-slate-700 dark:text-slate-200',
  secondary: 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
};

export const Badge = React.forwardRef(function Badge({ className, variant = 'default', ...props }, ref) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    />
  );
});
