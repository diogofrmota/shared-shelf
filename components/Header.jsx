const React = window.React;

const { SettingsIcon, UserIcon, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film } = window;

const Header = ({
  shelfName,
  activeCategory,
  activeSubTab,
  onCategoryChange,
  onSettingsClick,
  onAccountClick,
  enabledSections
}) => {
  const handleTabClick = (category, subTab) => {
    onCategoryChange(category, subTab);
  };

  const navTabs = [
    { id: 'calendar', label: 'Calendar', category: 'plan', icon: CalendarIcon },
    { id: 'tasks', label: 'Tasks', category: 'plan', icon: CheckSquare },
    { id: 'locations', label: 'Locations', category: 'go', icon: MapPin },
    { id: 'trips', label: 'Trips', category: 'go', icon: Film },
    { id: 'recipes', label: 'Recipes', category: 'go', icon: ChefHat },
    { id: 'media', label: 'Watchlist', category: 'media', icon: Tv }
  ];
  const enabledSet = new Set(Array.isArray(enabledSections) && enabledSections.length
    ? enabledSections
    : ['calendar', 'tasks', 'locations', 'trips', 'recipes', 'watchlist']);
  const visibleNavTabs = navTabs.filter(tab => tab.id === 'media' ? enabledSet.has('watchlist') : enabledSet.has(tab.id));

  const headerButton = 'flex h-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/15 sm:px-4';

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-gradient-to-r from-purple-950 via-violet-900 to-fuchsia-800 shadow-lg shadow-purple-950/20 backdrop-blur">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <h1 className="max-w-full truncate text-left text-xl font-bold text-white lg:max-w-[220px]">
              {shelfName || 'Shared Shelf'}
            </h1>

            <nav className="flex flex-wrap items-center gap-2">
              {visibleNavTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = tab.id === 'media'
                  ? activeCategory === 'media'
                  : activeCategory === tab.category && activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => {
                      if (tab.id === 'media') {
                        handleTabClick('media', null);
                      } else {
                        handleTabClick(tab.category, tab.id);
                      }
                    }}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-white text-[#3B0764] shadow-sm'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              onClick={onSettingsClick}
              className={headerButton}
              title="Shelf settings"
            >
              <SettingsIcon size={16} />
              <span className="ml-1.5">Settings</span>
            </button>

            <button
              onClick={onAccountClick}
              className={headerButton}
              title="Profile"
            >
              <UserIcon size={16} />
              <span className="ml-1.5">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

Object.assign(window, { Header });
