const React = window.React;
const { useState, useEffect, useRef } = React;
const { BrandLogo } = window;

function SpaceSelector({ onSelectSpace, onBackToLogin, onUpdateUser, onNavigate, currentUser }) {
  const sectionOptions = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'locations', label: 'Locations' },
    { id: 'trips', label: 'Trips' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'watchlist', label: 'Watchlist' }
  ];

  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [code, setCode] = useState('');
  const [selectedSections, setSelectedSections] = useState(sectionOptions.map(section => section.id));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    document.title = 'Couple Planner - Create or Join a Space';
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

  useEffect(() => {
    if (profileOpen) {
      setIsEditingProfile(false);
      setProfileName(displayName);
      setProfileUsername(username);
      setProfileError('');
    }
  }, [profileOpen, currentUser?.id, displayName, username]);

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
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const created = await createSpace(name.trim(), selectedSections);
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
      const joined = await joinSpace(spaceId.trim(), code.trim());
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

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const nextName = profileName.trim();
    const nextUsername = profileUsername.trim();

    if (!nextName) { setProfileError('Name is required'); return; }
    if (nextName.length > 20) { setProfileError('Name must be 20 characters or fewer'); return; }
    if (!/^[A-Za-z ]+$/.test(nextName)) { setProfileError('Name can only contain letters and spaces'); return; }
    if (!nextUsername) { setProfileError('Username is required'); return; }
    if (nextUsername.length > 20) { setProfileError('Username must be 20 characters or fewer'); return; }
    if (!/^[A-Za-z0-9]+$/.test(nextUsername)) { setProfileError('Username can only contain letters and numbers'); return; }

    setProfileSaving(true);
    setProfileError('');

    try {
      const updatedUser = await updateAccount({ name: nextName, username: nextUsername });
      onUpdateUser?.(updatedUser);
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const userInitial = (displayName || '?').trim().charAt(0).toUpperCase();
  const SiteFooter = window.SiteFooter;

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
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E63B2E] text-xs font-bold text-white">{userInitial}</span>
              <span className="hidden truncate text-[#410001] sm:inline" title={displayName}>{displayName.split(' ')[0]}</span>
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#410001]/10 animate-scale-in"
              >
                <div className="border-b border-[#E1D8D4] bg-[#FFF8F5] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#E63B2E]">Signed in as</p>
                  <p className="mt-1 truncate text-base font-bold text-[#410001]" title={displayName}>{displayName}</p>
                  <p className="truncate text-xs text-[#534340]" title={currentUser?.email || username}>{currentUser?.email || username}</p>
                </div>

                {isEditingProfile ? (
                  <form className="space-y-3 p-4 text-left text-sm" onSubmit={handleProfileSave}>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#E63B2E]" htmlFor="profile-name">Name</label>
                      <input
                        id="profile-name"
                        type="text"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] outline-none transition focus:border-[#E63B2E]"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#E63B2E]" htmlFor="profile-username">Username</label>
                      <input
                        id="profile-username"
                        type="text"
                        value={profileUsername}
                        onChange={(event) => setProfileUsername(event.target.value)}
                        className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] outline-none transition focus:border-[#E63B2E]"
                        autoComplete="username"
                      />
                    </div>
                    {profileError && <p className="text-sm font-semibold text-[#C1121F]">{profileError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileName(displayName);
                          setProfileUsername(username);
                          setProfileError('');
                        }}
                        className="min-h-[44px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                        disabled={profileSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="min-h-[44px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                        disabled={profileSaving}
                      >
                        {profileSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
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
            {mode === 'create' ? 'Create your shared space' : 'Join your partner\'s space'}
          </h1>
          <p className="mt-3 text-base font-medium text-[#534340]">
            {mode === 'create'
              ? 'Start a new private space and pick what you want to plan together.'
              : 'Enter the space ID and one-time join code your partner shared with you.'}
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
