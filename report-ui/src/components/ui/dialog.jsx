import React, { cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

const DialogContext = createContext(null);

function mergeHandlers(originalHandler, nextHandler) {
  return (event) => {
    originalHandler?.(event);

    if (!event.defaultPrevented) {
      nextHandler?.(event);
    }
  };
}

export function Dialog({ children }) {
  const [open, setOpen] = useState(false);
  const context = useMemo(() => ({ open, setOpen }), [open]);

  return <DialogContext.Provider value={context}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild = false, children }) {
  const context = useContext(DialogContext);

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      onClick: mergeHandlers(children.props.onClick, () => context.setOpen(true)),
    });
  }

  return (
    <button type="button" onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogContent({ children, className }) {
  const context = useContext(DialogContext);

  useEffect(() => {
    if (!context.open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        context.setOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [context]);

  if (!context.open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          context.setOpen(false);
        }
      }}
    >
      <div
        className={cn(
          'relative w-full rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
          className,
        )}
      >
        <button
          type="button"
          onClick={() => context.setOpen(false)}
          className="absolute right-4 top-4 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Close
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({ children, className }) {
  return <div className={cn('mb-4 flex flex-col space-y-1.5', className)}>{children}</div>;
}

export function DialogTitle({ children, className }) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>{children}</h2>;
}
