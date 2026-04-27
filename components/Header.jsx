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

  const headerButton = 'flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-[#410001] transition hover:bg-[#fff8f5] hover:text-[#e63b2e] sm:px-4';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#fdfbf7]/95 shadow-sm backdrop-blur">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e63b2e] text-white shadow-sm">
                <Tv size={18} />
              </span>
              <h1 className="max-w-full truncate text-left text-xl font-bold text-[#410001] lg:max-w-[220px]">
                {shelfName || 'Shared Shelf'}
              </h1>
            </div>

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
                        ? 'border-b-2 border-[#e63b2e] bg-[#fff8f5] text-[#e63b2e]'
                        : 'text-[#534340] hover:bg-[#fff8f5] hover:text-[#e63b2e]'
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
