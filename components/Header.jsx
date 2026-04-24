const React = window.React;
const { useEffect, useState } = React;

const { ShareIcon, SettingsIcon, UserIcon, Plus } = window;

const UserAvatar = window.UserAvatar || (({ user, size }) => {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} className="rounded-full" style={{ width: size, height: size }} />;
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold text-xs"
      style={{ width: size, height: size, backgroundColor: user.color || '#7c3aed' }}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
});

const Header = ({
  shelfLogo,
  shelfName,
  activeCategory,
  activeSubTab,
  onCategoryChange,
  onGlobalAddClick,
  onShareClick,
  onSettingsClick,
  onAccountClick,
  profile,
  isOnline,
  lastSynced,
  onBackToShelves
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [shelfLogo]);

  const toggleDropdown = (category) => {
    setOpenDropdown(prev => (prev === category ? null : category));
  };

  const handleSubTabClick = (category, subTab) => {
    onCategoryChange(category, subTab);
    setOpenDropdown(null);
  };

  const formatLastSynced = (timestamp) => {
    if (!timestamp) return null;

    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const syncLabel = isOnline
    ? (lastSynced ? `Synced ${formatLastSynced(lastSynced)}` : 'Online')
    : 'Offline';

  const users = profile?.users || [];
  const shelfInitials = (shelfName || 'Shared Shelf')
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderNavGroup = (category, label, tabs) => (
    <div className="relative">
      <button
        onClick={() => toggleDropdown(category)}
        className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
          activeCategory === category
            ? 'bg-purple-600 text-white'
            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
        }`}
      >
        {label}
      </button>

      {openDropdown === category && (
        <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 min-w-[150px]">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleSubTabClick(category, tab.id)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${index === tabs.length - 1 ? 'rounded-b-xl' : ''} ${
                activeCategory === category && activeSubTab === tab.id ? 'text-purple-400' : 'text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 rounded-full transition hover:ring-2 hover:ring-purple-500"
              title="Edit shelf logo"
            >
              {shelfLogo && !logoFailed ? (
                <img
                  src={shelfLogo}
                  alt="Shelf logo"
                  className="h-8 w-8 rounded-full border-2 border-slate-700 object-cover sm:h-10 sm:w-10"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-700 bg-gradient-to-br from-amber-400 to-rose-500 text-xs font-bold text-slate-950 sm:h-10 sm:w-10">
                  {shelfInitials}
                </div>
              )}
            </button>

            <button
              onClick={onSettingsClick}
              className="truncate text-lg font-bold text-white transition hover:text-purple-400 sm:text-xl"
              title="Edit shelf name"
            >
              {shelfName || 'Shared Shelf'}
            </button>

            {shelfName && (
              <button
                onClick={onBackToShelves}
                className="ml-1 text-sm text-slate-400 hover:text-white"
                title="Back to shelves"
              >
                Back
              </button>
            )}

            <div className="ml-4 flex items-center gap-1">
              {renderNavGroup('plan', 'Plan', [
                { id: 'tasks', label: 'Tasks' },
                { id: 'calendar', label: 'Calendar' }
              ])}
              {renderNavGroup('go', 'Go', [
                { id: 'dates', label: 'Dates' },
                { id: 'trips', label: 'Trips' },
                { id: 'recipes', label: 'Recipes' }
              ])}
              {renderNavGroup('media', 'Media Track', [
                { id: 'tvshows', label: 'TV Shows' },
                { id: 'movies', label: 'Movies' },
                { id: 'books', label: 'Books' }
              ])}
            </div>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              onClick={onGlobalAddClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all duration-300 hover:scale-105 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-900/40 sm:flex-none sm:px-5"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              onClick={onShareClick}
              className="flex items-center gap-1 rounded-xl bg-slate-700/30 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60"
              title="Share shelf"
            >
              <ShareIcon size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={onSettingsClick}
              className="flex items-center gap-1 rounded-xl bg-slate-700/30 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60"
              title="Shelf settings"
            >
              <SettingsIcon size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={onAccountClick}
              className="flex flex-none items-center gap-2 rounded-xl border border-slate-700 bg-slate-700/30 px-2.5 py-2 transition-all duration-200 hover:border-purple-500/50 hover:bg-slate-700/60"
              title="Account"
            >
              {users.length > 0 ? (
                <div className="flex items-center -space-x-2">
                  {users.slice(0, 3).map(user => (
                    <UserAvatar key={user.id} user={user} size={26} />
                  ))}
                </div>
              ) : (
                <UserIcon size={18} className="text-slate-300" />
              )}
              <span className="hidden text-sm font-medium text-slate-300 sm:inline">Account</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-2 text-xs text-slate-500">
          <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
          <span>{syncLabel}</span>
          {activeCategory && (
            <>
              <span className="text-slate-600">|</span>
              <span className="capitalize">{activeCategory} / {activeSubTab}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Header });
