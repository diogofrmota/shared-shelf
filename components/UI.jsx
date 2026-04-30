const React = window.React;
const { useEffect, useRef } = React;

// ============================================================================
// UI COMPONENTS
// ============================================================================

const getAvatarTextColor = (backgroundColor) => {
  if (!backgroundColor || !/^#([0-9a-f]{6})$/i.test(backgroundColor)) {
    return '#ffffff';
  }

  const hex = backgroundColor.slice(1);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? '#000000' : '#FFFFFF';
};

const FilterButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`min-h-[44px] px-3 py-2 sm:px-4 rounded-full font-semibold text-sm transition ${
      isActive
        ? 'bg-[#E63B2E] text-white shadow-sm shadow-[#E63B2E]/30'
        : 'bg-white text-[#000000] hover:bg-[#FFF8F5] hover:text-[#000000] border border-[#E1D8D4]'
    }`}
  >
    {label}
  </button>
);

const FilterBar = ({ label, children }) => (
  <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
    {label && (
      <span className="self-center text-sm font-medium text-[#000000]">
        {label}
      </span>
    )}
    {children}
  </div>
);

const getFocusableElements = (container) => {
  if (!container) return [];
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  };
  return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(element => !element.disabled && isVisible(element));
};

const useModalA11y = ({ isOpen, onClose, dialogRef, initialFocusRef }) => {
  useEffect(() => {
    if (!isOpen) return;
    const previousActiveElement = document.activeElement;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialogRef.current);
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus?.();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => {
      const focusable = getFocusableElements(dialogRef.current);
      const target = initialFocusRef?.current || focusable[0] || dialogRef.current;
      target?.focus?.();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement && document.contains(previousActiveElement)) {
        previousActiveElement.focus?.();
      }
    };
  }, [isOpen]);
};

const ModalShell = ({
  isOpen,
  onClose,
  children,
  zClass = 'z-50',
  overlayClassName = '',
  dialogClassName = '',
  ariaLabel = 'Dialog',
  role = 'dialog',
  initialFocusRef
}) => {
  const dialogRef = useRef(null);
  useModalA11y({ isOpen, onClose, dialogRef, initialFocusRef });

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm ${overlayClassName}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex="-1"
        className={dialogClassName}
      >
        {children}
      </div>
    </div>
  );
};

const EmptyState = ({
  title = 'Nothing here yet',
  message = 'Add your first item to get started.',
  actionLabel = 'Add your first item',
  onAddClick,
  icon: Icon = window.MissingIcon,
  compact = false
}) => {
  const PlusIcon = window.getWindowComponent?.('Plus', window.MissingIcon) || window.MissingIcon;
  const EmptyIcon = typeof Icon === 'function' ? Icon : window.MissingIcon;
  return (
    <div className={`rounded-2xl border border-dashed border-[#E1D8D4] bg-white px-5 text-center shadow-sm ${compact ? 'py-8' : 'py-12 sm:py-16'}`}>
      <div className={`mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E] ${compact ? 'h-12 w-12' : 'h-16 w-16 sm:mb-6 sm:h-20 sm:w-20'}`}>
        <EmptyIcon size={compact ? 22 : 26} />
      </div>
      <h3 className={`mb-2 font-bold text-[#000000] ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>{title}</h3>
      {message && (
        <p className={`mx-auto text-[#000000] ${compact ? 'max-w-sm text-sm' : 'max-w-md text-sm sm:text-base'} ${onAddClick ? 'mb-5' : ''}`}>
          {message}
        </p>
      )}
      {onAddClick && (
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] sm:text-base"
        >
          <PlusIcon size={18} />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

const MediaGrid = ({ items, renderItem, emptyComponent }) => (
  <>
    {items.length === 0 ? (
      emptyComponent
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 animate-fade-in">
        {items.map(renderItem)}
      </div>
    )}
  </>
);

const LoadingScreen = ({ label = 'Loading...' }) => (
  <div className="app-auth-bg flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-5 inline-block h-12 w-12 animate-spin rounded-full border-4 border-white/40 border-t-white"></div>
      <p className="text-2xl font-bold text-white sm:text-3xl">{label}</p>
    </div>
  </div>
);

const FailureScreen = ({
  eyebrow = 'Something went wrong',
  title = 'Couple Planner needs a moment',
  message = 'We could not finish loading this part of the app. Try again, or head back to a safe place.',
  primaryLabel = 'Go home',
  primaryPath = '/',
  secondaryLabel = 'Report a bug',
  secondaryPath = '/report-a-bug',
  onNavigate,
  icon: Icon = window.MissingIcon
}) => {
  const FailureIcon = typeof Icon === 'function' ? Icon : window.MissingIcon;
  const handleNavigate = (path) => (event) => {
    event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-2xl rounded-2xl border border-[#E1D8D4] bg-white p-6 text-center shadow-lg shadow-[#000000]/10 sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E]">
            <FailureIcon size={28} />
          </div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#A9372C]">{eyebrow}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#000000] sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#000000] sm:text-base">{message}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={primaryPath}
              onClick={handleNavigate(primaryPath)}
              className="inline-flex items-center justify-center rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] hover:text-white"
            >
              {primaryLabel}
            </a>
            {secondaryLabel && secondaryPath && (
              <a
                href={secondaryPath}
                onClick={handleNavigate(secondaryPath)}
                className="inline-flex items-center justify-center rounded-xl border border-[#E1D8D4] bg-white px-5 py-3 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#000000]"
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </section>
      </main>
      {typeof window.SiteFooter === 'function' && <window.SiteFooter onNavigate={onNavigate} />}
    </div>
  );
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Couple Planner render failure:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <FailureScreen
          eyebrow="App error"
          title="We hit a snag"
          message="Couple Planner could not finish rendering this screen. Your saved data is not shown here, but you can go back to a safe place and try again."
          primaryLabel="Go home"
          primaryPath="/"
          secondaryLabel="Report a bug"
          secondaryPath="/report-a-bug"
        />
      );
    }

    return this.props.children;
  }
}

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel
}) => {
  const confirmButtonRef = useRef(null);
  const dialogRef = useRef(null);
  useModalA11y({ isOpen, onClose: onCancel, dialogRef, initialFocusRef: confirmButtonRef });

  if (!isOpen) return null;

  const TrashIcon = window.getWindowComponent?.('Trash', window.MissingIcon) || window.MissingIcon;
  const SettingsIconComponent = window.getWindowComponent?.('SettingsIcon', window.MissingIcon) || window.MissingIcon;
  const confirmClass = tone === 'danger'
    ? 'bg-[#C1121F] text-white shadow-md shadow-[#C1121F]/20 hover:bg-[#A80F1A]'
    : 'bg-[#E63B2E] text-white shadow-md shadow-[#E63B2E]/20 hover:bg-[#CC302F]';

  return (
    <div
      className="fixed inset-0 z-[260] flex items-end justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-message"
        tabIndex="-1"
        className="w-full max-w-md rounded-2xl border border-[#E1D8D4] bg-white p-5 shadow-2xl shadow-[#000000]/30 animate-scale-in"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-[#FFDAD4] text-[#C1121F]' : 'bg-[#FFDAD4] text-[#E63B2E]'}`}>
            {tone === 'danger' ? <TrashIcon size={18} /> : <SettingsIconComponent size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirmation-dialog-title" className="text-lg font-extrabold text-[#000000]">
              {title}
            </h2>
            <p id="confirmation-dialog-message" className="mt-1 text-sm leading-6 text-[#000000]">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-[#E1D8D4] bg-white px-4 py-2.5 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold transition ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserAvatar = ({ user, size = 32 }) => {
  const safeUser = user || {};
  const displayName = safeUser.name || safeUser.username || safeUser.email || '?';
  const safeAvatar = window.safeImageUrl?.(safeUser.avatar) || '';
  if (safeAvatar) {
    return (
      <img
        src={safeAvatar}
        alt={displayName}
        loading="lazy"
        decoding="async"
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = safeUser.color || '#E63B2E';
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        color: getAvatarTextColor(color)
      }}
    >
      {(displayName.charAt(0) || '?').toUpperCase()}
    </div>
  );
};

Object.assign(window, {
  FilterButton, FilterBar, EmptyState, MediaGrid, LoadingScreen, FailureScreen, AppErrorBoundary, UserAvatar, getAvatarTextColor, ConfirmationDialog, ModalShell, useModalA11y
});
