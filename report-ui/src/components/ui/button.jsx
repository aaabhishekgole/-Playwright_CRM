import React from 'react';
import { cn } from '@/lib/cn';

const variants = {
  default: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200',
  outline:
    'border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900',
};

export const Button = React.forwardRef(function Button(
  { className, type = 'button', variant = 'default', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    />
  );
});
