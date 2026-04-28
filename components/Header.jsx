const React = window.React;
const { useState, useEffect, useRef } = React;
const { BrandLogo } = window;

const { SettingsIcon, UserIcon, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film, LogoutIcon, ShareIcon, ConfirmationDialog } = window;

const Header = ({
  spaceName,
  activeCategory,
  activeSubTab,
  onCategoryChange,
  onSettingsClick,
  onAccountClick,
  onShareClick,
  onBackToSpaces,
  currentUser,
  onLogout,
  onLeaveSpace,
  enabledSections
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLeaveSpace, setConfirmLeaveSpace] = useState(false);
  const [leavingSpace, setLeavingSpace] = useState(false);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);
  const profileRef = useRef(null);

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

  useEffect(() => {
    if (!settingsOpen && !profileOpen) return;
    const handleClickOutside = (event) => {
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen, profileOpen]);

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
  const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
  const username = currentUser?.username || 'User';
  const userInitial = displayName.trim().charAt(0).toUpperCase();

  const openSettingsDropdown = () => {
    setSettingsOpen(prev => !prev);
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const openProfileDropdown = () => {
    setProfileOpen(prev => !prev);
    setSettingsOpen(false);
    setMenuOpen(false);
  };

  const handleLeaveSpace = async () => {
    if (!onLeaveSpace) return;
    setLeavingSpace(true);
    try {
      await onLeaveSpace();
      setProfileOpen(false);
    } finally {
      setLeavingSpace(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E1D8D4] bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand + space name */}
        <button
          type="button"
          onClick={onBackToSpaces}
          className="flex min-h-[44px] min-w-0 max-w-[58vw] items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:opacity-90 sm:max-w-xs"
          title="Back to your spaces"
        >
          <BrandLogo
            subtitle={spaceName || 'Your space'}
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
          <div className="relative hidden sm:block" ref={settingsRef}>
            <button
              type="button"
              onClick={openSettingsDropdown}
              className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              title="Settings"
              aria-label="Settings"
              aria-haspopup="menu"
              aria-expanded={settingsOpen}
            >
              <SettingsIcon size={18} />
              <span>Settings</span>
            </button>

            {settingsOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-56 origin-top-right overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="p-1">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { onSettingsClick?.(); setSettingsOpen(false); }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <SettingsIcon size={18} />
                    Space settings
                  </button>
                  {onShareClick && (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => { onShareClick?.(); setSettingsOpen(false); }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      <ShareIcon size={18} />
                      Share space
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative hidden sm:block" ref={profileRef}>
            <button
              type="button"
              onClick={openProfileDropdown}
              className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              title="Profile"
              aria-label="Profile"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <UserIcon size={18} />
              <span>Profile</span>
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="border-b border-[#E1D8D4] bg-[#FFF8F5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E63B2E]">Signed in as</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-sm font-extrabold text-white shadow-sm">
                      {userInitial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[#410001]" title={displayName}>{displayName}</p>
                      <p className="truncate text-xs font-semibold text-[#534340]" title={username}>{username}</p>
                      {currentUser?.email && <p className="truncate text-xs text-[#534340]" title={currentUser.email}>{currentUser.email}</p>}
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { onAccountClick?.(); setProfileOpen(false); }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <UserIcon size={18} />
                    Edit profile
                  </button>
                  {onLeaveSpace && (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => setConfirmLeaveSpace(true)}
                      disabled={leavingSpace}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5] disabled:opacity-60"
                    >
                      {leavingSpace ? 'Leaving...' : 'Leave shared space'}
                    </button>
                  )}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => { onLogout?.(); setProfileOpen(false); }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <LogoutIcon size={18} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>

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
                    Settings
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { onAccountClick?.(); setMenuOpen(false); }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <UserIcon size={18} />
                    Profile
                  </button>
                  {onBackToSpaces && (
                    <button
                      role="menuitem"
                      onClick={() => { onBackToSpaces?.(); setMenuOpen(false); }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      <LogoutIcon size={18} />
                      Back to spaces
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {ConfirmationDialog && (
        <ConfirmationDialog
          isOpen={confirmLeaveSpace}
          title="Leave shared space?"
          message="You will be removed from this space and sent back to space selection. If no other members remain, the space and its data are deleted."
          confirmLabel={leavingSpace ? 'Leaving...' : 'Leave space'}
          cancelLabel="Stay"
          tone="danger"
          onConfirm={async () => {
            setConfirmLeaveSpace(false);
            await handleLeaveSpace();
          }}
          onCancel={() => setConfirmLeaveSpace(false)}
        />
      )}
    </header>
  );
};

Object.assign(window, { Header });
