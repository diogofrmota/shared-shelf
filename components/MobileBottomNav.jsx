const React = window.React;

const getNavComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

const MOBILE_NAV_TABS = [
  { id: 'calendar', label: 'Calendar', category: 'plan', icon: 'CalendarIcon' },
  { id: 'tasks', label: 'Tasks', category: 'plan', icon: 'CheckSquare' },
  { id: 'dates', label: 'Dates', category: 'go', icon: 'MapPin' },
  { id: 'trips', label: 'Trips', category: 'go', icon: 'Plane' },
  { id: 'recipes', label: 'Recipes', category: 'go', icon: 'ChefHat' },
  { id: 'media', label: 'Entertainment', category: 'media', icon: 'Tv' }
];

function MobileBottomNav({
  activeCategory,
  activeSubTab,
  onCategoryChange,
  enabledSections
}) {
  const enabledSet = new Set(Array.isArray(enabledSections) && enabledSections.length
    ? enabledSections
    : ['calendar', 'tasks', 'dates', 'trips', 'recipes', 'watchlist']);
  const visibleTabs = MOBILE_NAV_TABS.filter(tab =>
    tab.id === 'media' ? enabledSet.has('watchlist') : enabledSet.has(tab.id)
  );

  if (!visibleTabs.length) return null;

  const isTabActive = (tab) => tab.id === 'media'
    ? activeCategory === 'media'
    : activeCategory === tab.category && activeSubTab === tab.id;

  const handleClick = (tab) => {
    if (tab.id === 'media') onCategoryChange('media', null);
    else onCategoryChange(tab.category, tab.id);
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E1D8D4] bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-white/85 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul
        className="mx-auto grid w-full max-w-2xl"
        style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map(tab => {
          const Icon = getNavComponent(tab.icon);
          const active = isTabActive(tab);
          return (
            <li key={tab.id} className="flex">
              <button
                type="button"
                onClick={() => handleClick(tab)}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-bold transition ${
                  active
                    ? 'text-[#E63B2E]'
                    : 'text-[#000000]/70 hover:text-[#000000]'
                }`}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                  active ? 'bg-[#FFDAD4]' : 'bg-transparent'
                }`}>
                  <Icon size={20} />
                </span>
                <span className="truncate leading-none">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

Object.assign(window, { MobileBottomNav });
