const React = window.React;

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
    className={`px-3 sm:px-4 py-2 rounded-full font-semibold text-sm transition ${
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

const EmptyState = ({ onAddClick }) => (
  <div className="rounded-2xl border border-[#E1D8D4] bg-white px-6 py-12 text-center shadow-sm sm:py-16">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E] sm:mb-6 sm:h-20 sm:w-20">
      <Search size={26} />
    </div>
    <h3 className="mb-2 text-lg font-bold text-[#410001] sm:text-xl">Nothing here yet</h3>
    <p className="mb-5 text-sm text-[#534340] sm:text-base">
      Add your first item to get started.
    </p>
    <button
      onClick={onAddClick}
      className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] sm:text-base"
    >
      <Plus size={18} />
      Add your first item
    </button>
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

const UserAvatar = ({ user, size = 32 }) => {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
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
  FilterButton, FilterBar, EmptyState, MediaGrid, LoadingScreen, UserAvatar, getAvatarTextColor
});
