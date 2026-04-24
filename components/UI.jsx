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

  return brightness > 150 ? '#000000' : '#FFFFFF';
};

const FilterButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
      isActive
        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700'
    }`}
  >
    {label}
  </button>
);

const FilterBar = ({ label, children }) => (
  <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
    {label && (
      <span className="text-slate-400 font-medium self-center text-sm sm:text-base">
        {label}
      </span>
    )}
    {children}
  </div>
);

const EmptyState = ({ onAddClick }) => (
  <div className="text-center py-12 sm:py-20">
    <div className="inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-800/50 mb-4 sm:mb-6">
      <Search size={24} />
    </div>
    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No items found</h3>
    <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
      Add some items to your list to get started
    </p>
    <button
      onClick={onAddClick}
      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
    >
      <Plus size={18} />
      Add Your First Item
    </button>
  </div>
);

const MediaGrid = ({ items, renderItem, emptyComponent }) => (
  <>
    {items.length === 0 ? (
      emptyComponent
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 animate-fade-in">
        {items.map(renderItem)}
      </div>
    )}
  </>
);

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
    <div className="text-center">
      <div className="inline-block w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
      <p className="text-3xl font-semibold text-white sm:text-4xl">Loading ...</p>
    </div>
  </div>
);

const UserAvatar = ({ user, size = 32 }) => {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: user.color || '#031A6B',
        color: getAvatarTextColor(user.color || '#031A6B')
      }}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
};

Object.assign(window, {
  FilterButton, FilterBar, EmptyState, MediaGrid, LoadingScreen, UserAvatar, getAvatarTextColor
});
