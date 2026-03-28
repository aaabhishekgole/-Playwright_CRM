import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, options?: { title?: string; tone?: ToastTone; durationMs?: number }) => number;
  showSuccess: (message: string, title?: string) => number;
  showError: (message: string, title?: string) => number;
  showInfo: (message: string, title?: string) => number;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timeoutMapRef = useRef(new Map<number, number>());

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutMapRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    options?: { title?: string; tone?: ToastTone; durationMs?: number },
  ) => {
    const id = nextIdRef.current++;
    const tone = options?.tone ?? 'info';
    const title = options?.title ?? (tone === 'success' ? 'Success' : tone === 'error' ? 'Action failed' : 'Update');
    const durationMs = options?.durationMs ?? (tone === 'error' ? 5200 : 3600);

    setToasts((current) => [...current, { id, title, message, tone }]);

    const timeoutId = window.setTimeout(() => {
      dismissToast(id);
    }, durationMs);
    timeoutMapRef.current.set(id, timeoutId);

    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    timeoutMapRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutMapRef.current.clear();
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    showSuccess: (message, title) => showToast(message, { title, tone: 'success' }),
    showError: (message, title) => showToast(message, { title, tone: 'error' }),
    showInfo: (message, title) => showToast(message, { title, tone: 'info' }),
    dismissToast,
  }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast-card toast-${toast.tone}`}>
            <div className="toast-copy">
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => dismissToast(toast.id)}
              aria-label={`Dismiss ${toast.title}`}
            >
              ×
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
