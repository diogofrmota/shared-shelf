const React = window.React;
const { useState, useEffect, useRef } = React;
const { BrandLogo } = window;

const { SettingsIcon, UserIcon, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film, LogoutIcon } = window;

const Header = ({
  shelfName,
  activeCategory,
  activeSubTab,
  onCategoryChange,
  onSettingsClick,
  onAccountClick,
  onBackToShelves,
  enabledSections
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleTabClick = (category, subTab) => {
    onCategoryChange(category, subTab);
    setMenuOpen(false);
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

  const isTabActive = (tab) => tab.id === 'media'
    ? activeCategory === 'media'
    : activeCategory === tab.category && activeSubTab === tab.id;

  const activeTabLabel = visibleNavTabs.find(isTabActive)?.label || 'Menu';

  return (
    <header className="sticky top-0 z-40 border-b border-[#E1D8D4] bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand + shelf name */}
        <button
          type="button"
          onClick={onBackToShelves}
          className="flex min-h-[44px] min-w-0 max-w-[58vw] items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:opacity-90 sm:max-w-xs"
          title="Back to your spaces"
        >
          <BrandLogo
            subtitle={shelfName || 'Your shelf'}
            markClassName="h-9 w-9 sm:h-10 sm:w-10"
            textClassName="text-base font-extrabold tracking-tight text-[#410001] sm:text-lg"
          />
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {visibleNavTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = isTabActive(tab);
            return (
              <button
                key={tab.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (tab.id === 'media') handleTabClick('media', null);
                  else handleTabClick(tab.category, tab.id);
                }}
                className={`relative inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                  isActive
                    ? 'text-[#E63B2E]'
                    : 'text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {isActive && <span className="absolute inset-x-2 -bottom-[14px] h-[3px] rounded-full bg-[#E63B2E]"></span>}
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onSettingsClick}
            className="hidden h-11 w-11 items-center justify-center rounded-lg text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] sm:flex"
            title="Shelf settings"
            aria-label="Shelf settings"
          >
            <SettingsIcon size={18} />
          </button>

          <button
            onClick={onAccountClick}
            className="hidden h-11 w-11 items-center justify-center rounded-lg text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] sm:flex"
            title="Profile"
            aria-label="Profile"
          >
            <UserIcon size={18} />
          </button>

          {/* Mobile menu trigger */}
          <div className="relative lg:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(prev => !prev)}
              className="flex h-11 items-center gap-1.5 rounded-lg border border-[#E1D8D4] bg-white px-3 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="max-w-[80px] truncate sm:max-w-[120px]">{activeTabLabel}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-60 origin-top-right overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="p-1">
                  {visibleNavTabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = isTabActive(tab);
                    return (
                      <button
                        key={tab.id}
                        role="menuitem"
                        onClick={() => {
                          if (tab.id === 'media') handleTabClick('media', null);
                          else handleTabClick(tab.category, tab.id);
                        }}
                        className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          isActive
                            ? 'bg-[#FFDAD4] text-[#E63B2E]'
                            : 'text-[#410001] hover:bg-[#FFF8F5]'
                        }`}
                      >
                        <Icon size={18} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-[#E1D8D4] p-1">
                  <button
                    role="menuitem"
                    onClick={() => { onSettingsClick?.(); setMenuOpen(false); }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <SettingsIcon size={18} />
                    Shelf settings
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { onAccountClick?.(); setMenuOpen(false); }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <UserIcon size={18} />
                    Profile
                  </button>
                  {onBackToShelves && (
                    <button
                      role="menuitem"
                      onClick={() => { onBackToShelves?.(); setMenuOpen(false); }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      <LogoutIcon size={18} />
                      Back to shelves
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

Object.assign(window, { Header });
