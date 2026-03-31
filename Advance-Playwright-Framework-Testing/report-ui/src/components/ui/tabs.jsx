import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';

const TabsContext = createContext(null);

export function Tabs({ children, className, defaultValue, onValueChange, value }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const setSelectedValue = onValueChange ?? setInternalValue;
  const context = useMemo(() => ({ selectedValue, setSelectedValue }), [selectedValue, setSelectedValue]);

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
  return (
    <div className={cn('gap-2 bg-slate-100 p-1 dark:bg-slate-900', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ children, className, value }) {
  const context = useContext(TabsContext);
  const isActive = context.selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => context.setSelectedValue(value)}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, value }) {
  const context = useContext(TabsContext);

  if (context.selectedValue !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
}
