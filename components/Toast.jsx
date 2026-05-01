const React = window.React;
const { useState, useEffect, useRef, useCallback } = React;

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================
// Lightweight in-app toast queue. Mount <ToastContainer /> once near the root.
// Trigger toasts from anywhere via window.showToast({ type, message, duration }).

const TOAST_DEFAULT_DURATION = 4500;
const TOAST_LIMIT = 4;

const TOAST_STYLES = {
  success: {
    accent: '#2F855A',
    bg: '#F0FAF3',
    border: '#BFE3CC',
    title: 'Success'
  },
  error: {
    accent: '#C1121F',
    bg: '#FFF0F1',
    border: '#FFC2C7',
    title: 'Something went wrong'
  },
  info: {
    accent: '#A9372C',
    bg: '#FFF8F5',
    border: '#FFDAD4',
    title: 'Heads up'
  },
  warning: {
    accent: '#A06400',
    bg: '#FFF6E3',
    border: '#F1D58A',
    title: 'Warning'
  }
};

let toastIdCounter = 0;
const toastListeners = new Set();
let currentToasts = [];

const notifyListeners = () => {
  toastListeners.forEach(listener => {
    try { listener(currentToasts); } catch {}
  });
};

const addToast = (toast) => {
  const id = `toast-${Date.now()}-${++toastIdCounter}`;
  const next = {
    id,
    type: toast.type && TOAST_STYLES[toast.type] ? toast.type : 'info',
    message: String(toast.message || ''),
    title: toast.title || '',
    duration: Number.isFinite(toast.duration) ? toast.duration : TOAST_DEFAULT_DURATION,
    actionLabel: toast.actionLabel || '',
    onAction: typeof toast.onAction === 'function' ? toast.onAction : null
  };
  currentToasts = [...currentToasts, next].slice(-TOAST_LIMIT);
  notifyListeners();
  return id;
};

const dismissToast = (id) => {
  currentToasts = currentToasts.filter(toast => toast.id !== id);
  notifyListeners();
};

const showToast = (options = {}) => {
  if (!options || typeof options !== 'object') return null;
  if (typeof options === 'string') return addToast({ message: options, type: 'info' });
  return addToast(options);
};

const ToastItem = ({ toast, onDismiss }) => {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return undefined;
    timerRef.current = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const pause = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resume = () => {
    if (!toast.duration || toast.duration <= 0 || timerRef.current) return;
    timerRef.current = window.setTimeout(() => onDismiss(toast.id), toast.duration);
  };

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border shadow-lg shadow-[#000000]/15 animate-scale-in"
      style={{ background: style.bg, borderColor: style.border }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: style.accent }}
        />
        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-extrabold text-[#000000]">{toast.title}</p>
          )}
          <p className={`text-sm leading-5 text-[#000000] ${toast.title ? 'mt-0.5' : ''}`}>
            {toast.message}
          </p>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction();
                onDismiss(toast.id);
              }}
              className="mt-2 inline-flex min-h-[40px] items-center rounded-lg px-3 text-xs font-bold text-white transition"
              style={{ background: style.accent }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#000000] transition hover:bg-white/60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState(currentToasts);

  useEffect(() => {
    const listener = (next) => setToasts(next);
    toastListeners.add(listener);
    return () => { toastListeners.delete(listener); };
  }, []);

  const onDismiss = useCallback((id) => dismissToast(id), []);

  if (!toasts.length) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[300] flex flex-col items-center gap-2 px-4 pb-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0 sm:pb-0"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

Object.assign(window, { ToastContainer, showToast, dismissToast });
