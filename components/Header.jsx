const React = window.React;
const { useState } = React;

const { SettingsIcon, UserIcon, Plus, LogoutIcon, ChevronRight } = window;

const Header = ({
  shelfName,
  activeCategory,
  activeSubTab,
  onCategoryChange,
  onGlobalAddClick,
  onSettingsClick,
  onAccountClick,
  isOnline,
  lastSynced,
  onBackToShelves,
  onLogout
}) => {
  const [mediaSubTabsOpen, setMediaSubTabsOpen] = useState(true);

  const handleTabClick = (category, subTab) => {
    onCategoryChange(category, subTab);
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

  const navTabs = [
    { id: 'calendar', label: 'Calendar', category: 'plan' },
    { id: 'tasks', label: 'Tasks', category: 'plan' },
    { id: 'dates', label: 'Date Ideas', category: 'go' },
    { id: 'trips', label: 'Trips', category: 'go' },
    { id: 'recipes', label: 'Recipes', category: 'go' },
    { id: 'media', label: 'Media', category: 'media' }
  ];

  const mediaTabs = [
    { id: 'tvshows', label: 'TV Shows' },
    { id: 'movies', label: 'Movies' },
    { id: 'books', label: 'Books' }
  ];

  const baseHeaderButton = 'flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10';
  const fixedHeaderButton = `${baseHeaderButton} w-24`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-[#031A6B] shadow-lg shadow-[#031A6B]/20">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <button
              onClick={onSettingsClick}
              className="max-w-full truncate text-left text-xl font-bold text-white transition hover:text-[#05B2DC] lg:max-w-[220px]"
              title="Edit shelf name"
            >
              {shelfName || 'Shared Shelf'}
            </button>

            <nav className="flex flex-wrap items-center gap-2">
              {navTabs.map(tab => {
                const isActive = tab.id === 'media'
                  ? activeCategory === 'media'
                  : activeCategory === tab.category && activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'media') {
                        handleTabClick('media', activeCategory === 'media' ? activeSubTab : 'tvshows');
                        setMediaSubTabsOpen(prev => activeCategory === 'media' ? !prev : true);
                      } else {
                        handleTabClick(tab.category, tab.id);
                        setMediaSubTabsOpen(false);
                      }
                    }}
                    className={`h-10 rounded-xl px-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-white text-[#031A6B]'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              onClick={onGlobalAddClick}
              className={`${fixedHeaderButton} bg-white text-[#031A6B] hover:bg-[#EAF8FC]`}
            >
              <Plus size={18} />
              <span className="ml-1.5">Add</span>
            </button>

            <button
              onClick={onSettingsClick}
              className={fixedHeaderButton}
              title="Shelf settings"
            >
              <SettingsIcon size={16} />
              <span className="ml-1.5">Settings</span>
            </button>

            <button
              onClick={onAccountClick}
              className={fixedHeaderButton}
              title="Profile"
            >
              <UserIcon size={16} />
              <span className="ml-1.5">Profile</span>
            </button>

            <button
              onClick={onLogout}
              className={fixedHeaderButton}
              title="Logout"
            >
              <LogoutIcon size={16} />
              <span className="ml-1.5">Logout</span>
            </button>

            {shelfName && (
              <button
                onClick={onBackToShelves}
                className={`${fixedHeaderButton} order-last lg:order-none`}
                title="Back to shelves"
              >
                <span>Back</span>
                <ChevronRight size={16} className="ml-1.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-3 text-xs text-white/70">
          <span className="inline-flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-[#05B2DC]' : 'bg-white/40'}`} />
            <span>{syncLabel}</span>
          </span>

          {activeCategory === 'media' && mediaSubTabsOpen && (
            <div className="flex flex-wrap items-center gap-2">
              {mediaTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    handleTabClick('media', tab.id);
                    setMediaSubTabsOpen(true);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeSubTab === tab.id
                      ? 'bg-white text-[#031A6B]'
                      : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

Object.assign(window, { Header });
