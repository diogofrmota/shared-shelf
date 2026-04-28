const React = window.React;
const { useState, useEffect, useRef } = React;
const { BrandLogo } = window;

const { SettingsIcon, UserIcon, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film, LogoutIcon, ShareIcon, PencilIcon, Trash } = window;

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
  onUpdateUser,
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
  const [shareGenerating, setShareGenerating] = useState(false);
  const [shareGeneratingType, setShareGeneratingType] = useState('');
  const [shareGeneratedType, setShareGeneratedType] = useState('');
  const [shareError, setShareError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [spaceSettingsExpanded, setSpaceSettingsExpanded] = useState(false);
  const [editingSpaceName, setEditingSpaceName] = useState(false);
  const [settingsName, setSettingsName] = useState(spaceName || '');
  const [settingsSections, setSettingsSections] = useState(Array.isArray(enabledSections) && enabledSections.length ? enabledSections : []);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileField, setEditingProfileField] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileUsernameStatus, setProfileUsernameStatus] = useState(null);
  const [profileNewEmail, setProfileNewEmail] = useState('');
  const [profileEmailError, setProfileEmailError] = useState('');
  const [profileEmailSuccess, setProfileEmailSuccess] = useState('');
  const [profileEmailSaving, setProfileEmailSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
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
    setShareGeneratingType('');
    setShareGeneratedType('');
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

  useEffect(() => {
    if (profileOpen) {
      setIsEditingProfile(false);
      setEditingProfileField(null);
      setProfileName(displayName);
      setProfileUsername(username);
      setProfileUsernameStatus(null);
      setProfileNewEmail('');
      setProfileEmailError('');
      setProfileEmailSuccess('');
      setProfileError('');
    }
  }, [profileOpen, currentUser?.id, displayName, username, currentUser?.email]);

  useEffect(() => {
    return () => {
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    };
  }, []);

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

  const toggleSharePanel = () => {
    setConfirmLeaveSpace(false);
    setSpaceSettingsExpanded(false);
    setShareError('');
    setShareExpanded(prev => !prev);
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
      onUpdateUser?.(updatedUser);
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

  const handleProfileEmailSave = async (event) => {
    event.preventDefault();
    const trimmedEmail = profileNewEmail.trim();

    setProfileEmailError('');
    setProfileEmailSuccess('');
    setProfileError('');

    if (!trimmedEmail) { setProfileEmailError('Email is required'); return; }
    if (!trimmedEmail.includes('@')) { setProfileEmailError('Email must include @'); return; }

    setProfileEmailSaving(true);
    try {
      const result = await changeEmail(trimmedEmail);
      setProfileEmailSuccess(result.message || `A confirmation link has been sent to ${trimmedEmail}.`);
      setProfileNewEmail('');
      setEditingProfileField(null);
    } catch (err) {
      setProfileEmailError(err.message || 'Failed to initiate email change');
    } finally {
      setProfileEmailSaving(false);
    }
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

  const handleGenerateShare = async (type) => {
    if (!space?.id) return;
    setShareGenerating(true);
    setShareGeneratingType(type);
    setShareError('');
    try {
      const nextShareInfo = await regenerateSpaceJoinCode(space.id);
      setShareInfo(nextShareInfo);
      setShareGeneratedType(type);
    } catch (err) {
      setShareError(err?.message || `Failed to generate ${type === 'code' ? 'join code' : 'invite link'}`);
    } finally {
      setShareGenerating(false);
      setShareGeneratingType('');
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
                <div className="p-2">
                  <button
                    role="menuitem"
                    type="button"
                    onClick={toggleSpaceSettingsPanel}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    aria-expanded={spaceSettingsExpanded}
                  >
                    <PencilIcon size={18} />
                    <span className="flex-1">Customize Space</span>
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
                        <span className="flex-1">Share</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${shareExpanded ? 'rotate-180' : ''}`}>
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      {shareExpanded && (
                        <div className="mx-1 mb-2 space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                          <div className="grid gap-2">
                            <button
                              type="button"
                              onClick={() => handleGenerateShare('code')}
                              disabled={shareGenerating || !canGenerateInvite}
                              className="min-h-[40px] rounded-lg bg-[#E63B2E] px-3 text-sm font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                            >
                              {shareGenerating && shareGeneratingType === 'code' ? 'Generating...' : 'Generate code to join'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateShare('link')}
                              disabled={shareGenerating || !canGenerateInvite}
                              className="min-h-[40px] rounded-lg border border-[#E1D8D4] bg-white px-3 text-sm font-bold text-[#E63B2E] transition hover:bg-white/80 disabled:opacity-60"
                            >
                              {shareGenerating && shareGeneratingType === 'link' ? 'Generating...' : 'Generate link to join'}
                            </button>
                          </div>

                          {!canGenerateInvite && (
                            <p className="rounded-lg border border-[#FFDAD4] bg-white px-3 py-2 text-xs font-semibold text-[#534340]">
                              Only the space owner can generate join invites.
                            </p>
                          )}

                          {shareGeneratedType === 'code' && shareInfo?.joinCode && (
                            <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Join code</p>
                                  <p className="mt-1 text-xs text-[#534340]">{formatExpiry(shareInfo?.expiresAt)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyValue('joinCode', shareInfo.joinCode)}
                                  className="min-h-[36px] rounded-lg border border-[#E1D8D4] bg-white px-2.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                                >
                                  {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <code className="mt-2 block break-all text-lg font-extrabold tracking-[0.2em] text-[#241A18]">{shareInfo.joinCode}</code>
                            </div>
                          )}

                          {shareGeneratedType === 'link' && shareInfo?.inviteLink && (
                            <div className="rounded-lg border border-[#E1D8D4] bg-white p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Invite link</p>
                                  <p className="mt-1 text-xs text-[#534340]">{formatExpiry(shareInfo?.expiresAt)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyValue('inviteLink', shareInfo.inviteLink)}
                                  className="min-h-[36px] rounded-lg border border-[#E1D8D4] bg-white px-2.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                                >
                                  {copiedField === 'inviteLink' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <code className="mt-2 block max-h-20 overflow-auto break-all rounded-lg bg-[#FFF8F5] p-2 text-xs font-semibold text-[#241A18]">
                                {shareInfo.inviteLink}
                              </code>
                            </div>
                          )}
                          {shareError && <p className="text-sm font-semibold text-[#C1121F]">{shareError}</p>}
                        </div>
                      )}
                    </div>
                  )}
                  {onLeaveSpace && (
                    confirmLeaveSpace ? (
                      <div className="rounded-xl border border-[#FFDAD4] bg-[#FFF8F5] p-3">
                        <p className="text-sm font-bold text-[#410001]">Exit space?</p>
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
                            {leavingSpace ? 'Exiting...' : 'Exit Space'}
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
                        <Trash size={18} />
                        {leavingSpace ? 'Exiting...' : 'Exit Space'}
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
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFDAD4] text-sm font-bold text-[#410001] shadow-sm transition hover:bg-[#FFB4A9] sm:w-auto sm:max-w-[220px] sm:gap-2 sm:px-3"
              title="Account"
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E63B2E] text-xs font-bold text-white">{userInitial}</span>
              <span className="hidden truncate text-[#410001] sm:inline" title="Account">Account</span>
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="border-b border-[#E1D8D4] bg-[#FFF8F5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E63B2E]">Signed in as</p>
                  <p className="mt-1 truncate text-base font-bold text-[#410001]" title={displayName}>{displayName}</p>
                  <p className="truncate text-xs font-semibold text-[#534340]" title={username}>{username}</p>
                  <p className="truncate text-xs text-[#534340]" title={accountEmail}>{accountEmail}</p>
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
                            setProfileEmailError('');
                            setProfileEmailSuccess('');
                            setProfileError('');
                          }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-white hover:text-[#E63B2E]"
                          aria-label="Edit name"
                          title="Edit name"
                        >
                          {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
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
                            setProfileEmailError('');
                            setProfileEmailSuccess('');
                            setProfileError('');
                          }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-white hover:text-[#E63B2E]"
                          aria-label="Edit username"
                          title="Edit username"
                        >
                          {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
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

                    <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Email</p>
                          <p className="mt-1 truncate font-semibold text-[#410001]" title={accountEmail}>{accountEmail}</p>
                          {profileEmailSuccess && <p className="mt-1 break-words text-xs font-semibold text-[#2F855A]" role="status">{profileEmailSuccess}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileField('email');
                            setProfileNewEmail('');
                            setProfileEmailError('');
                            setProfileEmailSuccess('');
                            setProfileError('');
                          }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-white hover:text-[#E63B2E]"
                          aria-label="Edit email"
                          title="Edit email"
                        >
                          {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
                        </button>
                      </div>
                      {editingProfileField === 'email' && (
                        <form className="mt-3 space-y-3" onSubmit={handleProfileEmailSave}>
                          <div>
                            <input
                              id="profile-email"
                              type="email"
                              value={profileNewEmail}
                              onChange={(event) => setProfileNewEmail(event.target.value)}
                              className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] outline-none transition focus:border-[#E63B2E]"
                              autoComplete="email"
                              placeholder="you@example.com"
                              spellCheck={false}
                              aria-label="New email address"
                            />
                            <p className="mt-1 text-xs text-[#857370]">A confirmation link will be sent to the new address.</p>
                          </div>
                          {profileEmailError && <p className="text-xs font-semibold text-[#C1121F]" role="alert">{profileEmailError}</p>}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfileField(null);
                                setProfileNewEmail('');
                                setProfileEmailError('');
                                setProfileEmailSuccess('');
                              }}
                              className="min-h-[40px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                              disabled={profileEmailSaving}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="min-h-[40px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                              disabled={profileEmailSaving}
                            >
                              {profileEmailSaving ? 'Sending...' : 'Send'}
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
                          setProfileNewEmail('');
                          setProfileEmailError('');
                          setProfileEmailSuccess('');
                          setProfileError('');
                        }}
                        className="min-h-[44px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                        disabled={profileSaving || profileEmailSaving}
                      >
                        Cancel
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
                        setProfileNewEmail('');
                        setProfileEmailError('');
                        setProfileEmailSuccess('');
                        setProfileError('');
                      }}
                      className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      <UserIcon size={18} />
                      Edit profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLogout?.();
                        setProfileOpen(false);
                      }}
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
    </header>
  );
};

Object.assign(window, { Header });
