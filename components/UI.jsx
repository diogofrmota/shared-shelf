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

  return brightness > 150 ? '#241A18' : '#FFFFFF';
};

const FilterButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`min-h-[44px] px-3 py-2 sm:px-4 rounded-full font-semibold text-sm transition ${
      isActive
        ? 'bg-[#E63B2E] text-white shadow-sm shadow-[#E63B2E]/30'
        : 'bg-white text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001] border border-[#E1D8D4]'
    }`}
  >
    {label}
  </button>
);

const FilterBar = ({ label, children }) => (
  <div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3">
    {label && (
      <span className="self-center text-sm font-medium text-[#534340]">
        {label}
      </span>
    )}
    {children}
  </div>
);

const EmptyState = ({
  title = 'Nothing here yet',
  message = 'Add your first item to get started.',
  actionLabel = 'Add your first item',
  onAddClick,
  icon: Icon = Search,
  compact = false
}) => (
  <div className={`rounded-2xl border border-dashed border-[#E1D8D4] bg-white px-5 text-center shadow-sm ${compact ? 'py-8' : 'py-12 sm:py-16'}`}>
    <div className={`mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E] ${compact ? 'h-12 w-12' : 'h-16 w-16 sm:mb-6 sm:h-20 sm:w-20'}`}>
      <Icon size={compact ? 22 : 26} />
    </div>
    <h3 className={`mb-2 font-bold text-[#410001] ${compact ? 'text-base' : 'text-lg sm:text-xl'}`}>{title}</h3>
    {message && (
      <p className={`mx-auto text-[#534340] ${compact ? 'max-w-sm text-sm' : 'max-w-md text-sm sm:text-base'} ${onAddClick ? 'mb-5' : ''}`}>
        {message}
      </p>
    )}
    {onAddClick && (
      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] sm:text-base"
      >
        <Plus size={18} />
        {actionLabel}
      </button>
    )}
  </div>
);

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
  icon: Icon = Search
}) => {
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
        <section className="w-full max-w-2xl rounded-2xl border border-[#E1D8D4] bg-white p-6 text-center shadow-lg shadow-[#410001]/10 sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E]">
            <Icon size={28} />
          </div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-[#A9372C]">{eyebrow}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#534340] sm:text-base">{message}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={primaryPath}
              onClick={handleNavigate(primaryPath)}
              className="inline-flex items-center justify-center rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] hover:text-white"
            >
              {primaryLabel}
            </a>
            {secondaryLabel && secondaryPath && (
              <a
                href={secondaryPath}
                onClick={handleNavigate(secondaryPath)}
                className="inline-flex items-center justify-center rounded-xl border border-[#E1D8D4] bg-white px-5 py-3 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5] hover:text-[#410001]"
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </section>
      </main>
      {typeof SiteFooter === 'function' && <SiteFooter onNavigate={onNavigate} />}
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

  useEffect(() => {
    if (!isOpen) return;
    const previousActiveElement = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.();
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
          .filter(element => !element.disabled && element.offsetParent !== null)
        : [];
      if (!focusable.length) return;

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
    window.setTimeout(() => confirmButtonRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmClass = tone === 'danger'
    ? 'bg-[#C1121F] text-white shadow-md shadow-[#C1121F]/20 hover:bg-[#A80F1A]'
    : 'bg-[#E63B2E] text-white shadow-md shadow-[#E63B2E]/20 hover:bg-[#A9372C]';

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
        className="w-full max-w-md rounded-2xl border border-[#E1D8D4] bg-white p-5 shadow-2xl shadow-[#410001]/30 animate-scale-in"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-[#FFDAD4] text-[#C1121F]' : 'bg-[#FFDAD4] text-[#E63B2E]'}`}>
            {tone === 'danger' ? <Trash size={18} /> : <SettingsIcon size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirmation-dialog-title" className="text-lg font-extrabold text-[#410001]">
              {title}
            </h2>
            <p id="confirmation-dialog-message" className="mt-1 text-sm leading-6 text-[#534340]">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-xl border border-[#E1D8D4] bg-white px-4 py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
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
  const safeAvatar = window.safeImageUrl?.(user.avatar) || '';
  if (safeAvatar) {
    return (
      <img
        src={safeAvatar}
        alt={user.name}
        loading="lazy"
        decoding="async"
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: user.color || '#E63B2E',
        color: getAvatarTextColor(user.color || '#E63B2E')
      }}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
};

Object.assign(window, {
  FilterButton, FilterBar, EmptyState, MediaGrid, LoadingScreen, FailureScreen, AppErrorBoundary, UserAvatar, getAvatarTextColor, ConfirmationDialog
});
