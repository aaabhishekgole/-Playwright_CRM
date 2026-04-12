import React from 'react';
import { cn } from '@/lib/cn';

export const Progress = React.forwardRef(function Progress({ className, value = 0, ...props }, ref) {
  const boundedValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      ref={ref}
      className={cn('relative h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
      {...props}
    >
      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${boundedValue}%` }} />
    </div>
  );
});
