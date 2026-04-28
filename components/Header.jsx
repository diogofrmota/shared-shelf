const React = window.React;
const { useState, useEffect, useRef } = React;
const { BrandLogo } = window;

const { SettingsIcon, UserIcon, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film, LogoutIcon, ShareIcon, PencilIcon } = window;

const Header = ({
  spaceName,
  space,
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
  onSaveSpace,
  enabledSections
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [confirmLeaveSpace, setConfirmLeaveSpace] = useState(false);
  const [leavingSpace, setLeavingSpace] = useState(false);
  const [shareExpanded, setShareExpanded] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [spaceSettingsExpanded, setSpaceSettingsExpanded] = useState(false);
  const [editingSpaceName, setEditingSpaceName] = useState(false);
  const [settingsName, setSettingsName] = useState(spaceName || '');
  const [settingsSections, setSettingsSections] = useState(Array.isArray(enabledSections) && enabledSections.length ? enabledSections : []);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
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
        setConfirmLeaveSpace(false);
        setShareExpanded(false);
        setSpaceSettingsExpanded(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen, profileOpen]);

  useEffect(() => {
    setShareExpanded(false);
    setShareInfo(null);
    setShareError('');
    setCopiedField('');
    setSpaceSettingsExpanded(false);
    setEditingSpaceName(false);
    setSettingsError('');
    setSettingsSaved(false);
  }, [space?.id]);

  useEffect(() => {
    setSettingsName(spaceName || '');
  }, [spaceName]);

  useEffect(() => {
    setSettingsSections(Array.isArray(enabledSections) && enabledSections.length ? enabledSections : []);
  }, [enabledSections]);

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
  const sectionOptions = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'locations', label: 'Locations' },
    { id: 'trips', label: 'Trips' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'watchlist', label: 'Watchlist' }
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
  const canGenerateInvite = !space?.role || space.role === 'owner';
  const canEditSpaceSettings = !space?.role || space.role === 'owner';

  const openSettingsDropdown = () => {
    setSettingsOpen(prev => {
      const nextOpen = !prev;
      if (!nextOpen) {
        setConfirmLeaveSpace(false);
        setShareExpanded(false);
        setSpaceSettingsExpanded(false);
      }
      return nextOpen;
    });
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const openProfileDropdown = () => {
    setProfileOpen(prev => !prev);
    setSettingsOpen(false);
    setConfirmLeaveSpace(false);
    setShareExpanded(false);
    setSpaceSettingsExpanded(false);
    setMenuOpen(false);
  };

  const handleLeaveSpace = async () => {
    if (!onLeaveSpace) return;
    setLeavingSpace(true);
    try {
      await onLeaveSpace();
      setProfileOpen(false);
      setSettingsOpen(false);
      setConfirmLeaveSpace(false);
      setShareExpanded(false);
      setSpaceSettingsExpanded(false);
    } finally {
      setLeavingSpace(false);
    }
  };

  const toggleSpaceSettingsPanel = () => {
    setShareExpanded(false);
    setConfirmLeaveSpace(false);
    setSettingsError('');
    setSettingsSaved(false);
    setSpaceSettingsExpanded(prev => !prev);
  };

  const toggleSettingsSection = (sectionId) => {
    setSettingsSaved(false);
    setSettingsSections(prev => {
      if (prev.includes(sectionId)) {
        const next = prev.filter(id => id !== sectionId);
        return next.length ? next : prev;
      }
      return [...prev, sectionId];
    });
  };

  const handleSaveSettings = async () => {
    if (!onSaveSpace || settingsSaving || !canEditSpaceSettings) return;
    const nextName = settingsName.trim() || spaceName || 'Our Space';
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSaved(false);
    try {
      await onSaveSpace({ name: nextName, enabledSections: settingsSections });
      setSettingsName(nextName);
      setEditingSpaceName(false);
      setSettingsSaved(true);
      window.setTimeout(() => setSettingsSaved(false), 1500);
    } catch (err) {
      setSettingsError(err?.message || 'Failed to save space settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const loadShareInfo = async () => {
    if (!space?.id) return;
    setShareLoading(true);
    setShareError('');
    try {
      const nextShareInfo = await getSpaceShareInfo(space.id);
      setShareInfo(nextShareInfo);
    } catch (err) {
      setShareError(err?.message || 'Failed to load share details');
    } finally {
      setShareLoading(false);
    }
  };

  const toggleSharePanel = () => {
    setConfirmLeaveSpace(false);
    setSpaceSettingsExpanded(false);
    const nextExpanded = !shareExpanded;
    setShareExpanded(nextExpanded);
    if (nextExpanded && !shareInfo && !shareLoading) loadShareInfo();
  };

  const copyValue = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(''), 1500);
    } catch {
      setCopiedField('');
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!space?.id) return;
    setShareGenerating(true);
    setShareError('');
    try {
      const nextShareInfo = await regenerateSpaceJoinCode(space.id);
      setShareInfo(nextShareInfo);
      if (nextShareInfo?.inviteLink) copyValue('inviteLink', nextShareInfo.inviteLink);
    } catch (err) {
      setShareError(err?.message || 'Failed to generate invite link');
    } finally {
      setShareGenerating(false);
    }
  };

  const formatExpiry = (value) => {
    if (!value) return 'Expires in 7 days';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Expires in 7 days';
    return `Expires ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
                className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="border-b border-[#E1D8D4] bg-[#FFF8F5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E63B2E]">Space controls</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-white shadow-sm">
                      <SettingsIcon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[#410001]" title={spaceName || 'Your space'}>{spaceName || 'Your space'}</p>
                      <p className="truncate text-xs text-[#534340]">Settings and sharing</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={toggleSpaceSettingsPanel}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    aria-expanded={spaceSettingsExpanded}
                  >
                    <SettingsIcon size={18} />
                    <span className="flex-1">Space settings</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${spaceSettingsExpanded ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {spaceSettingsExpanded && (
                    <div className="mx-1 mb-2 space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                      <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Space name</p>
                            {editingSpaceName ? (
                              <input
                                type="text"
                                value={settingsName}
                                onChange={(event) => {
                                  setSettingsName(event.target.value);
                                  setSettingsSaved(false);
                                }}
                                className="mt-2 w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-semibold text-[#241A18] outline-none transition focus:border-[#E63B2E]"
                                placeholder="Our space"
                                maxLength={80}
                                autoFocus
                              />
                            ) : (
                              <p className="mt-1 truncate text-sm font-extrabold text-[#410001]" title={settingsName || spaceName || 'Our Space'}>{settingsName || spaceName || 'Our Space'}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSpaceName(prev => !prev);
                              setSettingsError('');
                              setSettingsSaved(false);
                            }}
                            disabled={!canEditSpaceSettings || settingsSaving}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] disabled:opacity-50"
                            aria-label={editingSpaceName ? 'Done editing space name' : 'Edit space name'}
                            title={editingSpaceName ? 'Done' : 'Edit space name'}
                          >
                            {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Shared items</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {sectionOptions.map(section => (
                            <label key={section.id} className="flex min-h-[40px] items-center gap-2 rounded-lg border border-[#E1D8D4] bg-white px-2.5 py-2 text-xs font-bold text-[#410001] transition hover:bg-[#FFF8F5]">
                              <input
                                type="checkbox"
                                checked={settingsSections.includes(section.id)}
                                onChange={() => toggleSettingsSection(section.id)}
                                disabled={!canEditSpaceSettings || settingsSaving}
                                className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
                              />
                              <span>{section.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {!canEditSpaceSettings && (
                        <p className="rounded-lg border border-[#FFDAD4] bg-white px-3 py-2 text-xs font-semibold text-[#534340]">
                          Only the space owner can change these settings.
                        </p>
                      )}
                      {settingsError && <p className="text-sm font-semibold text-[#C1121F]">{settingsError}</p>}
                      {settingsSaved && <p className="text-sm font-semibold text-[#2F855A]">Saved</p>}
                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={settingsSaving || !canEditSpaceSettings}
                        className="min-h-[40px] w-full rounded-lg bg-[#E63B2E] px-3 text-sm font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                      >
                        {settingsSaving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  )}
                  {onShareClick && (
                    <div>
                      <button
                        role="menuitem"
                        type="button"
                        onClick={toggleSharePanel}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                        aria-expanded={shareExpanded}
                      >
                        <ShareIcon size={18} />
                        <span className="flex-1">Share space</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${shareExpanded ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {shareExpanded && (
                        <div className="mx-1 mb-2 space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                          {shareLoading ? (
                            <p className="py-4 text-center text-sm font-semibold text-[#534340]">Loading share details...</p>
                          ) : (
                            <>
                              <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Space ID</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <code className="min-w-0 flex-1 break-all text-xs font-bold text-[#241A18]">{shareInfo?.spaceId || space?.id || 'Unavailable'}</code>
                                  <button
                                    type="button"
                                    onClick={() => copyValue('spaceId', shareInfo?.spaceId || space?.id)}
                                    className="min-h-[36px] rounded-lg border border-[#E1D8D4] bg-white px-2.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                                  >
                                    {copiedField === 'spaceId' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                              </div>

                              <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Join code</p>
                                    <p className="mt-1 text-xs text-[#534340]">{formatExpiry(shareInfo?.expiresAt)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => copyValue('joinCode', shareInfo?.joinCode)}
                                    disabled={!shareInfo?.joinCode}
                                    className="min-h-[36px] rounded-lg border border-[#E1D8D4] bg-white px-2.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5] disabled:opacity-50"
                                  >
                                    {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <code className="mt-2 block break-all text-lg font-extrabold tracking-[0.2em] text-[#241A18]">{shareInfo?.joinCode || '--------'}</code>
                              </div>

                              <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Invite link</p>
                                <p className="mt-1 text-xs text-[#534340]">
                                  {canGenerateInvite ? 'Generates a new one-use link valid for 7 days.' : 'Ask the space owner to generate a new invite link.'}
                                </p>
                                {shareInfo?.inviteLink && (
                                  <code className="mt-2 block max-h-16 overflow-auto break-all rounded-lg bg-[#FFF8F5] p-2 text-xs font-semibold text-[#241A18]">
                                    {shareInfo.inviteLink}
                                  </code>
                                )}
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={handleGenerateInviteLink}
                                    disabled={shareGenerating || !canGenerateInvite}
                                    className="min-h-[40px] rounded-lg bg-[#E63B2E] px-2 text-xs font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                                  >
                                    {shareGenerating ? 'Generating...' : 'Generate invite link'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyValue('inviteLink', shareInfo?.inviteLink)}
                                    disabled={!shareInfo?.inviteLink}
                                    className="min-h-[40px] rounded-lg border border-[#E1D8D4] bg-white px-2 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5] disabled:opacity-50"
                                  >
                                    {copiedField === 'inviteLink' ? 'Copied' : 'Copy link'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          {shareError && <p className="text-sm font-semibold text-[#C1121F]">{shareError}</p>}
                        </div>
                      )}
                    </div>
                  )}
                  {onLeaveSpace && (
                    confirmLeaveSpace ? (
                      <div className="rounded-xl border border-[#FFDAD4] bg-[#FFF8F5] p-3">
                        <p className="text-sm font-bold text-[#410001]">Leave shared space?</p>
                        <p className="mt-1 text-xs leading-5 text-[#534340]">
                          You will be removed and sent back to space selection.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmLeaveSpace(false)}
                            disabled={leavingSpace}
                            className="min-h-[40px] rounded-lg border border-[#E1D8D4] bg-white px-3 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5] disabled:opacity-60"
                          >
                            Stay
                          </button>
                          <button
                            type="button"
                            onClick={handleLeaveSpace}
                            disabled={leavingSpace}
                            className="min-h-[40px] rounded-lg bg-[#C1121F] px-3 text-sm font-bold text-white transition hover:bg-[#A80F1A] disabled:opacity-60"
                          >
                            {leavingSpace ? 'Leaving...' : 'Leave space'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => { setSpaceSettingsExpanded(false); setShareExpanded(false); setConfirmLeaveSpace(true); }}
                        disabled={leavingSpace}
                        className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5] disabled:opacity-60"
                      >
                        <LogoutIcon size={18} />
                        {leavingSpace ? 'Leaving...' : 'Leave shared space'}
                      </button>
                    )
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
    </header>
  );
};

Object.assign(window, { Header });
