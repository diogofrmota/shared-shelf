const React = window.React;
const { useState, useEffect, useRef } = React;

function SpaceSelector({ onSelectSpace, onBackToLogin, onUpdateUser, onNavigate, currentUser }) {
  const sectionOptions = window.SECTION_OPTIONS || [];

  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [code, setCode] = useState('');
  const [selectedSections, setSelectedSections] = useState(sectionOptions.map(section => section.id));
  const [error, setError] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileField, setEditingProfileField] = useState(null); // null | 'name' | 'username' | 'email'
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileUsernameStatus, setProfileUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [profileNewEmail, setProfileNewEmail] = useState('');
  const [profileEmailError, setProfileEmailError] = useState('');
  const [profileEmailSuccess, setProfileEmailSuccess] = useState('');
  const [profileEmailSaving, setProfileEmailSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRef = useRef(null);
  const usernameCheckRef = useRef(null);
  const usernameCheckSeqRef = useRef(0);

  useEffect(() => {
    document.title = 'Couple Planner - Select a Space';
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteSpace = params.get('inviteSpace');
    const inviteCode = params.get('inviteCode');
    if (!inviteSpace || !inviteCode) return;

    setMode('join');
    setSpaceId(inviteSpace);
    setCode(inviteCode);
    setInviteNotice('Invite link ready. Join this private space when you are ready.');
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
  const username = currentUser?.username || 'User';
  const accountEmail = currentUser?.email || 'Email unavailable';

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
    // Only re-run when the dropdown opens/closes or the user identity changes,
    // so currentUser updates from save don't clobber in-progress edits.
  }, [profileOpen, currentUser?.id]);

  useEffect(() => {
    return () => {
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
      usernameCheckSeqRef.current += 1;
    };
  }, []);

  const toggleSection = (sectionId) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        const next = prev.filter(id => id !== sectionId);
        return next.length ? next : prev;
      }
      return [...prev, sectionId];
    });
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    if (nextMode !== 'join') setInviteNotice('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const created = await window.createSpace?.(name.trim(), selectedSections);
      if (created?.space) {
        onSelectSpace(created.space);
      } else {
        setError('Failed to create space');
      }
    } catch (err) {
      setError(err?.message || 'Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const joined = await window.joinSpace?.(spaceId.trim(), code.trim());
      if (joined?.space) {
        onSelectSpace(joined.space);
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      setError(err?.message || 'Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUsernameChange = (value) => {
    setProfileUsername(value);
    const trimmed = value.trim();

    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    usernameCheckSeqRef.current += 1;
    if (!trimmed || !/^[A-Za-z0-9]+$/.test(trimmed) || trimmed.length > 20) {
      setProfileUsernameStatus(null);
      return;
    }
    if (trimmed.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
      setProfileUsernameStatus(null);
      return;
    }

    setProfileUsernameStatus('checking');
    const requestId = usernameCheckSeqRef.current;
    usernameCheckRef.current = setTimeout(async () => {
      try {
        const result = await window.checkUsernameAvailable?.(trimmed, currentUser?.id);
        if (requestId !== usernameCheckSeqRef.current) return;
        if (!result || result.available == null) {
          setProfileUsernameStatus(null);
          return;
        }
        setProfileUsernameStatus(result.available ? 'available' : 'taken');
      } catch {
        if (requestId !== usernameCheckSeqRef.current) return;
        setProfileUsernameStatus(null);
      }
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
      const updatedUser = await window.updateAccount?.({ name: nextName, username: nextUsername });
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
      const result = await window.changeEmail?.(trimmedEmail);
      setProfileEmailSuccess(result.message || `A confirmation link has been sent to ${trimmedEmail}.`);
      setProfileNewEmail('');
      setEditingProfileField(null);
    } catch (err) {
      setProfileEmailError(err.message || 'Failed to initiate email change');
    } finally {
      setProfileEmailSaving(false);
    }
  };

  const userInitial = (displayName || '?').trim().charAt(0).toUpperCase();
  const SiteFooter = window.getWindowComponent?.('SiteFooter', null);
  const PencilIcon = window.getWindowComponent?.('PencilIcon', window.MissingIcon) || window.MissingIcon;
  const UserIcon = window.getWindowComponent?.('UserIcon', window.MissingIcon) || window.MissingIcon;
  const LogoutIcon = window.getWindowComponent?.('LogoutIcon', window.MissingIcon) || window.MissingIcon;
  const BrandLogo = window.getWindowComponent?.('BrandLogo', window.MissingComponent) || window.MissingComponent;

  const inputCls = "w-full rounded-xl border border-[#E1D8D4] bg-white px-4 py-3 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#534340]";

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED] text-[#241A18]">
      {/* Top header */}
      <header className="border-b border-[#E1D8D4] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo
              subtitle="Plan your life together"
              markClassName="h-9 w-9 sm:h-10 sm:w-10"
              textClassName="text-base font-extrabold tracking-tight text-[#410001] sm:text-lg"
            />
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(prev => !prev)}
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
                className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
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
                      onClick={() => { setProfileOpen(false); onBackToLogin?.(); }}
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="mb-8 sm:mb-10 text-center">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#E63B2E]">Welcome</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
            Create your shared space
          </h1>
          <p className="mt-3 text-base font-medium text-[#534340]">
            Start or join a private space and pick what you want to plan together.
          </p>
        </section>

        <div className="rounded-2xl border border-[#E1D8D4] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex gap-1.5 rounded-xl bg-[#FBF2ED] p-1.5">
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'create' ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#534340] hover:text-[#410001]'}`}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => switchMode('join')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'join' ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#534340] hover:text-[#410001]'}`}
            >
              Join
            </button>
          </div>

          <div className="min-h-[17.5rem]">
            {mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4" noValidate>
                <div>
                  <label className={labelCls} htmlFor="create-space-name">Space name</label>
                  <input
                    id="create-space-name"
                    type="text"
                    name="space-name"
                    autoComplete="off"
                    placeholder="Our space"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <p className={labelCls}>Shared items</p>
                  <div className="grid grid-cols-2 gap-2">
                    {sectionOptions.map(section => (
                      <label key={section.id} className="flex items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(section.id)}
                          onChange={() => toggleSection(section.id)}
                          className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
                        />
                        <span>{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {inviteNotice && <p className="rounded-xl border border-[#FFDAD4] bg-[#FFF8F5] px-3 py-2 text-sm font-semibold text-[#534340]">{inviteNotice}</p>}
                {error && <p className="text-sm font-semibold text-[#C1121F]">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create space'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4" noValidate>
                <div>
                  <label className={labelCls} htmlFor="join-space-id">Space ID</label>
                  <input
                    id="join-space-id"
                    type="text"
                    name="space-id"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Space ID"
                    value={spaceId}
                    onChange={(event) => setSpaceId(event.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="join-code">Join code</label>
                  <input
                    id="join-code"
                    type="text"
                    name="join-code"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Join code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                {error && <p className="text-sm font-semibold text-[#C1121F]">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-50"
                >
                  {submitting ? 'Joining...' : 'Join space'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 border-t border-[#E1D8D4]/70 pt-5 text-center text-sm text-[#534340]">
            {mode === 'create' ? 'Have a join code from your partner?' : 'Want to start a new space instead?'}
            <button
              type="button"
              onClick={() => switchMode(mode === 'create' ? 'join' : 'create')}
              className="ml-1 font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
            >
              {mode === 'create' ? 'Join a space' : 'Create one'}
            </button>
          </p>
        </div>
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

window.SpaceSelector = SpaceSelector;
