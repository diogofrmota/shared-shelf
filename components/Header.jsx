const React = window.React;
const { useState, useEffect, useRef } = React;
const { BrandLogo } = window;

const { SettingsIcon, UserIcon, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film, LogoutIcon, ShareIcon, ConfirmationDialog, PencilIcon } = window;

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileField, setEditingProfileField] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileUsernameStatus, setProfileUsernameStatus] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(null);
  const menuRef = useRef(null);
  const settingsRef = useRef(null);
  const profileRef = useRef(null);
  const usernameCheckRef = useRef(null);

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

  useEffect(() => {
    if (profileOpen && !isEditingProfile) {
      setProfileName(displayName);
      setProfileUsername(username);
      setEditingProfileField(null);
      setProfileUsernameStatus(null);
      setProfileError('');
    }
  }, [profileOpen]);

  useEffect(() => {
    return () => {
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    };
  }, []);

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
  const accountEmail = currentUser?.email || 'Email unavailable';
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
      setSettingsOpen(false);
    } finally {
      setLeavingSpace(false);
    }
  };

  const handleProfileUsernameChange = (value) => {
    setProfileUsername(value);
    const trimmed = value.trim();

    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    if (!trimmed || !/^[A-Za-z0-9]+$/.test(trimmed) || trimmed.length > 20) {
      setProfileUsernameStatus(null);
      return;
    }
    if (trimmed.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
      setProfileUsernameStatus(null);
      return;
    }

    setProfileUsernameStatus('checking');
    usernameCheckRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailable(trimmed, currentUser?.id || '');
      if (result.available === null) {
        setProfileUsernameStatus(null);
        return;
      }
      setProfileUsernameStatus(result.available ? 'available' : 'taken');
    }, 450);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const nextName = profileName.trim();
    const nextUsername = profileUsername.trim();

    if (editingProfileField === 'name') {
      if (!nextName) { setProfileError('Name is required'); return; }
      if (nextName.length > 20) { setProfileError('Name must be 20 characters or fewer'); return; }
      if (!/^[A-Za-z ]+$/.test(nextName)) { setProfileError('Name can only contain letters and spaces'); return; }
    }
    if (editingProfileField === 'username') {
      if (!nextUsername) { setProfileError('Username is required'); return; }
      if (nextUsername.length > 20) { setProfileError('Username must be 20 characters or fewer'); return; }
      if (!/^[A-Za-z0-9]+$/.test(nextUsername)) { setProfileError('Username can only contain letters and numbers'); return; }
      if (profileUsernameStatus === 'taken') { setProfileError('Username already taken'); return; }
      if (profileUsernameStatus === 'checking') { setProfileError('Username availability is still being checked'); return; }
    }

    setProfileSaving(true);
    setProfileError('');

    try {
      const updatedUser = await updateAccount({ name: nextName, username: nextUsername });
      setProfileName(updatedUser?.name || nextName);
      setProfileUsername(updatedUser?.username || nextUsername);
      setEditingProfileField(null);
      setProfileUsernameStatus(null);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
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
                className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="p-2">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => setSettingsExpanded(settingsExpanded === 'space' ? null : 'space')}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                  >
                    <SettingsIcon size={18} />
                    Space settings
                  </button>
                  {settingsExpanded === 'space' && (
                    <div className="border-t border-[#E1D8D4] p-2 mt-2">
                      <button
                        type="button"
                        onClick={() => { onSettingsClick?.(); setSettingsOpen(false); setSettingsExpanded(null); }}
                        className="flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#410001]"
                      >
                        Open space settings
                      </button>
                    </div>
                  )}
                  {onShareClick && (
                    <>
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => setSettingsExpanded(settingsExpanded === 'share' ? null : 'share')}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                      >
                        <ShareIcon size={18} />
                        Share space
                      </button>
                      {settingsExpanded === 'share' && (
                        <div className="border-t border-[#E1D8D4] p-2 mt-2">
                          <button
                            type="button"
                            onClick={() => { onShareClick?.(); setSettingsOpen(false); setSettingsExpanded(null); }}
                            className="flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#410001]"
                          >
                            Share space details
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {onLeaveSpace && (
                    <>
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => setSettingsExpanded(settingsExpanded === 'leave' ? null : 'leave')}
                        disabled={leavingSpace}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5] disabled:opacity-60"
                      >
                        <LogoutIcon size={18} />
                        {leavingSpace ? 'Leaving...' : 'Leave shared space'}
                      </button>
                      {settingsExpanded === 'leave' && (
                        <div className="border-t border-[#E1D8D4] p-2 mt-2">
                          <p className="text-xs text-[#534340] mb-2">Are you sure you want to leave this space?</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSettingsExpanded(null)}
                              className="flex-1 min-h-[40px] rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-xs font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                              disabled={leavingSpace}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConfirmLeaveSpace(true); setSettingsOpen(false); setSettingsExpanded(null); }}
                              disabled={leavingSpace}
                              className="flex-1 min-h-[40px] rounded-lg bg-[#E63B2E] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                            >
                              Leave
                            </button>
                          </div>
                        </div>
                      )}
                    </>
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
              title="Account"
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <UserIcon size={18} />
              <span>Account</span>
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
                      <p className="truncate text-xs text-[#534340]" title={accountEmail}>{accountEmail}</p>
                    </div>
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-3 p-4 text-left text-sm">
                    <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Name</p>
                          <p className="mt-1 truncate font-semibold text-[#410001]" title={displayName}>{displayName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileField('name');
                            setProfileName(displayName);
                            setProfileError('');
                          }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-white hover:text-[#E63B2E]"
                          aria-label="Edit name"
                          title="Edit name"
                        >
                          <PencilIcon size={16} />
                        </button>
                      </div>
                      {editingProfileField === 'name' && (
                        <form className="mt-3 space-y-3" onSubmit={handleProfileSave}>
                          <input
                            id="profile-name"
                            type="text"
                            value={profileName}
                            onChange={(event) => setProfileName(event.target.value)}
                            className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] outline-none transition focus:border-[#E63B2E]"
                            autoComplete="name"
                            aria-label="Name"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfileField(null);
                                setProfileName(displayName);
                                setProfileError('');
                              }}
                              className="min-h-[40px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                              disabled={profileSaving}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="min-h-[40px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                              disabled={profileSaving}
                            >
                              {profileSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Username</p>
                          <p className="mt-1 truncate font-semibold text-[#410001]" title={username}>{username}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileField('username');
                            setProfileUsername(username);
                            setProfileUsernameStatus(null);
                            setProfileError('');
                          }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-white hover:text-[#E63B2E]"
                          aria-label="Edit username"
                          title="Edit username"
                        >
                          <PencilIcon size={16} />
                        </button>
                      </div>
                      {editingProfileField === 'username' && (
                        <form className="mt-3 space-y-3" onSubmit={handleProfileSave}>
                          <div>
                            <input
                              id="profile-username"
                              type="text"
                              value={profileUsername}
                              onChange={(event) => handleProfileUsernameChange(event.target.value)}
                              className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] outline-none transition focus:border-[#E63B2E]"
                              autoComplete="username"
                              spellCheck={false}
                              aria-label="Username"
                            />
                            {profileUsernameStatus === 'checking'
                              ? <p className="mt-1 text-xs text-[#857370]">Checking availability...</p>
                              : profileUsernameStatus === 'available'
                                ? <p className="mt-1 text-xs font-semibold text-[#2F855A]">Username is available</p>
                                : profileUsernameStatus === 'taken'
                                  ? <p className="mt-1 text-xs font-semibold text-[#C1121F]">Username already taken</p>
                                  : null}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfileField(null);
                                setProfileUsername(username);
                                setProfileUsernameStatus(null);
                                setProfileError('');
                              }}
                              className="min-h-[40px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                              disabled={profileSaving}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="min-h-[40px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                              disabled={profileSaving || profileUsernameStatus === 'taken' || profileUsernameStatus === 'checking'}
                            >
                              {profileSaving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {profileError && <p className="text-sm font-semibold text-[#C1121F]">{profileError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setEditingProfileField(null);
                          setProfileName(displayName);
                          setProfileUsername(username);
                          setProfileUsernameStatus(null);
                          setProfileError('');
                        }}
                        className="min-h-[44px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                        disabled={profileSaving}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setEditingProfileField(null);
                        setProfileName(displayName);
                        setProfileUsername(username);
                        setProfileUsernameStatus(null);
                        setProfileError('');
                      }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      <UserIcon size={18} />
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => { onLogout?.(); setProfileOpen(false); }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      <LogoutIcon size={18} />
                      Log out
                    </button>
                  </div>
                )}
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
                    Account
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
