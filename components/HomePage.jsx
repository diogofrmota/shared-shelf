const React = window.React;
const { useState, useEffect, useRef } = React;
const getHomeComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

const FEATURES = [
  {
    icon: 'CalendarIcon',
    title: 'Shared Calendar',
    description: 'Plan dates, anniversaries, and recurring routines on one calendar that both of you see.',
    bg: '#FFE4E0',
    border: '#F5ADA5',
    accent: '#D8271C',
    fade: '#F76B5F'
  },
  {
    icon: 'CheckSquare',
    title: 'Tasks List',
    description: 'Split chores and errands, assign tasks to either of you, set due dates, and repeat the ones that come back every week.',
    bg: '#E1F5EE',
    border: '#91D7BF',
    accent: '#00845F',
    fade: '#3AB68E'
  },
  {
    icon: 'MapPin',
    title: 'Favourite Locations',
    description: 'Save restaurants, bars, and date ideas on a shared map with categories, ratings, and notes.',
    bg: '#FFE8D7',
    border: '#F2B27A',
    accent: '#D65A00',
    fade: '#F39A3D'
  },
  {
    icon: 'Film',
    title: 'Plan Your Next Trip',
    bg: '#E4EEFF',
    border: '#9CBFF4',
    accent: '#1D6BDA',
    fade: '#6EA5F2',
    description: 'Keep itineraries, bookings, packing lists, and notes for your upcoming and past trips together.'
  },
  {
    icon: 'ChefHat',
    title: 'Recipe Collection',
    description: 'Build a shared recipe book with ingredients, instructions, prep time, and source links for the meals you cook together.',
    bg: '#FFE4F6',
    border: '#EAA3D6',
    accent: '#B8329B',
    fade: '#E36AC5'
  },
  {
    icon: 'Tv',
    title: 'Entertainment',
    description: 'Track the movies, TV shows and books you want to watch and read together, with statuses, ratings, and season progress.',
    bg: '#ECE8FF',
    border: '#B9ADF2',
    accent: '#6B52D9',
    fade: '#9B86F2'
  }
];

const AudienceHomeIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="m3 10 9-7 9 7"></path>
    <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
    <path d="M9 21v-6h6v6"></path>
  </svg>
);

const AudiencePlaneIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5S18.5 3 17 4.5L13.5 8 5.3 6.2 4 7.5l6.5 3.5L7 14.5l-3-.5-1 1 4 2 2 4 1-1-.5-3 3.5-3.5 3.5 6.5z"></path>
  </svg>
);

const AudienceHeartIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
  </svg>
);

const AudienceUsersIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const COUPLE_SCENARIOS = [
  {
    icon: AudiencePlaneIcon,
    title: 'Planning a weekend away',
    description: 'Keep trip dates, bookings, packing notes, and the places you want to visit together in one shared plan.',
    bg: '#FFE3DD',
    border: '#F2A69B',
    accent: '#D8271C'
  },
  {
    icon: AudienceHomeIcon,
    title: 'Splitting weekly chores',
    description: 'Assign errands, repeat household tasks, and see what is due without digging through old messages.',
    bg: '#E3F5EA',
    border: '#95D3AC',
    accent: '#00845F'
  },
  {
    icon: AudienceHeartIcon,
    title: 'Saving date night ideas',
    bg: '#FFE2F3',
    border: '#E89BC7',
    accent: '#B8329B',
    description: 'Collect restaurants, bars, activities, and little ideas for the next time you ask what you should do.'
  },
  {
    icon: AudienceUsersIcon,
    title: 'Tracking shows you watch together',
    bg: '#E3EEFF',
    border: '#9CBFF4',
    accent: '#1D6BDA',
    description: 'Queue movies and TV shows, track progress, and remember what you both wanted to watch next.'
  }
];

function HomePage({ onNavigate, currentUser, onUpdateUser, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
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
  const profileRef = useRef(null);
  const usernameCheckRef = useRef(null);
  const usernameCheckSeqRef = useRef(0);

  const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
  const username = currentUser?.username || 'User';
  const accountEmail = currentUser?.email || 'Email unavailable';

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
  }, [profileOpen, currentUser?.id]);

  useEffect(() => {
    return () => {
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
      usernameCheckSeqRef.current += 1;
    };
  }, []);

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
        if (!result || result.available == null) { setProfileUsernameStatus(null); return; }
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

  const goTo = (path) => (event) => {
    if (event) event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const scrollToId = (id) => (event) => {
    if (event) event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const SiteFooter = window.getWindowComponent?.('SiteFooter', null);
  const BrandLogo = window.getWindowComponent?.('BrandLogo', window.MissingComponent) || window.MissingComponent;
  const UserIcon = getHomeComponent('UserIcon');
  const PencilIcon = getHomeComponent('PencilIcon');
  const LogoutIcon = getHomeComponent('LogoutIcon');

  const navLinks = [
    { id: 'what-it-is', label: 'What it is' },
    { id: 'features', label: 'Features' },
    { id: 'who-it-is-for', label: 'Who it is for' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <header className="sticky top-0 z-30 border-b border-[#E1D8D4]/70 bg-[#FFF8F5]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" onClick={goTo('/')} className="flex items-center gap-2">
            <BrandLogo />
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={scrollToId(link.id)}
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFDAD4]/50 hover:text-[#A9372C]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/dashboard-selection/"
                onClick={goTo('/dashboard-selection/')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] sm:px-4"
              >
                Go to dashboard
              </a>
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(prev => !prev)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-[#000000] transition hover:bg-[#F5EFEC] sm:w-auto sm:max-w-[220px] sm:gap-2 sm:px-3"
                  title="Account"
                  aria-label="Account"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <UserIcon size={22} />
                  <span className="hidden truncate text-[#000000] sm:inline" title="Account">Account</span>
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-xl shadow-[#000000]/10 animate-scale-in"
                  >
                    <div className="border-b border-[#E1D8D4] bg-[#FFF8F5] p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#E63B2E]">Signed in as</p>
                      <p className="mt-1 truncate text-base font-bold text-[#000000]" title={displayName}>{displayName}</p>
                      <p className="truncate text-xs font-semibold text-[#000000]" title={username}>{username}</p>
                      <p className="truncate text-xs text-[#000000]" title={accountEmail}>{accountEmail}</p>
                    </div>

                    {isEditingProfile ? (
                      <div className="space-y-3 p-4 text-left text-sm">
                        <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Name</p>
                              <p className="mt-1 truncate font-semibold text-[#000000]" title={displayName}>{displayName}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setEditingProfileField('name'); setProfileName(displayName); setProfileEmailError(''); setProfileEmailSuccess(''); setProfileError(''); }}
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#000000] transition hover:bg-white hover:text-[#E63B2E]"
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
                                className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#000000] outline-none transition focus:border-[#E63B2E]"
                                autoComplete="name"
                                aria-label="Name"
                              />
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { setEditingProfileField(null); setProfileName(displayName); setProfileError(''); }} className="min-h-[40px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5]" disabled={profileSaving}>Cancel</button>
                                <button type="submit" className="min-h-[40px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#CC302F] disabled:opacity-60" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save'}</button>
                              </div>
                            </form>
                          )}
                        </div>

                        <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Username</p>
                              <p className="mt-1 truncate font-semibold text-[#000000]" title={username}>{username}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setEditingProfileField('username'); setProfileUsername(username); setProfileUsernameStatus(null); setProfileEmailError(''); setProfileEmailSuccess(''); setProfileError(''); }}
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#000000] transition hover:bg-white hover:text-[#E63B2E]"
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
                                  className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#000000] outline-none transition focus:border-[#E63B2E]"
                                  autoComplete="username"
                                  spellCheck={false}
                                  aria-label="Username"
                                />
                                {profileUsernameStatus === 'checking' ? <p className="mt-1 text-xs text-[#000000]">Checking availability...</p>
                                  : profileUsernameStatus === 'available' ? <p className="mt-1 text-xs font-semibold text-[#2F855A]">Username is available</p>
                                  : profileUsernameStatus === 'taken' ? <p className="mt-1 text-xs font-semibold text-[#C1121F]">Username already taken</p>
                                  : null}
                              </div>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { setEditingProfileField(null); setProfileUsername(username); setProfileUsernameStatus(null); setProfileError(''); }} className="min-h-[40px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5]" disabled={profileSaving}>Cancel</button>
                                <button type="submit" className="min-h-[40px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#CC302F] disabled:opacity-60" disabled={profileSaving || profileUsernameStatus === 'taken' || profileUsernameStatus === 'checking'}>{profileSaving ? 'Saving...' : 'Save'}</button>
                              </div>
                            </form>
                          )}
                        </div>

                        <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Email</p>
                              <p className="mt-1 truncate font-semibold text-[#000000]" title={accountEmail}>{accountEmail}</p>
                              {profileEmailSuccess && <p className="mt-1 break-words text-xs font-semibold text-[#2F855A]" role="status">{profileEmailSuccess}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => { setEditingProfileField('email'); setProfileNewEmail(''); setProfileEmailError(''); setProfileEmailSuccess(''); setProfileError(''); }}
                              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#000000] transition hover:bg-white hover:text-[#E63B2E]"
                              aria-label="Edit email"
                              title="Edit email"
                            >
                              <PencilIcon size={16} />
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
                                  className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#000000] outline-none transition focus:border-[#E63B2E]"
                                  autoComplete="email"
                                  placeholder="you@example.com"
                                  spellCheck={false}
                                  aria-label="New email address"
                                />
                                <p className="mt-1 text-xs text-[#000000]">A confirmation link will be sent to the new address.</p>
                              </div>
                              {profileEmailError && <p className="text-xs font-semibold text-[#C1121F]" role="alert">{profileEmailError}</p>}
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { setEditingProfileField(null); setProfileNewEmail(''); setProfileEmailError(''); setProfileEmailSuccess(''); }} className="min-h-[40px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5]" disabled={profileEmailSaving}>Cancel</button>
                                <button type="submit" className="min-h-[40px] flex-1 rounded-lg bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#CC302F] disabled:opacity-60" disabled={profileEmailSaving}>{profileEmailSaving ? 'Sending...' : 'Send'}</button>
                              </div>
                            </form>
                          )}
                        </div>

                        {profileError && <p className="text-sm font-semibold text-[#C1121F]">{profileError}</p>}
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => { setIsEditingProfile(false); setEditingProfileField(null); setProfileName(displayName); setProfileUsername(username); setProfileUsernameStatus(null); setProfileNewEmail(''); setProfileEmailError(''); setProfileEmailSuccess(''); setProfileError(''); }}
                            className="min-h-[44px] flex-1 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5]"
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
                          onClick={() => { setIsEditingProfile(true); setEditingProfileField(null); setProfileName(displayName); setProfileUsername(username); setProfileUsernameStatus(null); setProfileNewEmail(''); setProfileEmailError(''); setProfileEmailSuccess(''); setProfileError(''); }}
                          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#000000] transition hover:bg-[#FFF8F5]"
                        >
                          <UserIcon size={18} />
                          Edit profile
                        </button>
                        <button
                          type="button"
                          onClick={() => { setProfileOpen(false); onLogout?.(); }}
                          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#000000] transition hover:bg-[#FFF8F5]"
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
          ) : (
            <nav className="flex items-center gap-2 sm:gap-3">
              <a
                href="/login?mode=signup"
                onClick={goTo('/login?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-3 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] sm:px-4"
              >
                Register
              </a>
              <a
                href="/login"
                onClick={goTo('/login')}
                className="inline-flex rounded-xl border border-[#E63B2E]/40 bg-white px-3 py-2 text-sm font-bold text-[#A9372C] transition hover:border-[#E63B2E] hover:bg-[#FFDAD4]/40 sm:px-4"
              >
                Login
              </a>
            </nav>
          )}
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="flex-1">
        <section className="app-auth-bg">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-8 py-10 text-white sm:px-12 sm:py-12 lg:flex-row lg:items-center lg:gap-12 lg:px-16 lg:py-14">
            <div className="flex-1">
              <h1 className="flex flex-nowrap items-center gap-2 text-[2rem] font-extrabold leading-none tracking-tight text-white min-[380px]:gap-3 min-[380px]:text-4xl sm:gap-4 sm:text-5xl lg:text-6xl">
                <img
                  src="/assets/brand-mark.svg"
                  alt=""
                  aria-hidden="true"
                  className="brand-logo-hero block h-10 w-10 flex-shrink-0 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                />
                <span className="whitespace-nowrap leading-none">Couple Planner</span>
              </h1>
              <p className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Plan your life together.
              </p>
              <p className="mt-5 max-w-xl text-base font-medium text-white/90 sm:text-lg">
                Couple Planner is an app that lets you and your partner create a shared
                dashboard. One private place to share your calendar, tasks, date ideas, trips, recipes,
                and watchlists.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="/login?mode=signup"
                  onClick={goTo('/login?mode=signup')}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-[#A9372C] shadow-lg shadow-black/20 transition hover:bg-[#FFDAD4] hover:text-[#000000]"
                >
                  Create Account
                </a>
                <a
                  href="/login"
                  onClick={goTo('/login')}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 text-base font-bold text-white transition hover:bg-white hover:text-[#A9372C]"
                >
                  Sign In
                </a>
              </div>
            </div>
            <div className="w-full max-w-2xl lg:flex-1 lg:max-w-4xl">
              <figure className="flex justify-center">
                <img
                  src="/assets/ui-showcase-no-background.png"
                  alt="Two phone mockups showing Couple Planner entertainment and calendar screens."
                  className="block w-full max-w-[136rem] object-contain drop-shadow-2xl lg:max-w-[168rem]"
                  loading="eager"
                />
              </figure>
            </div>
          </div>
        </section>

        <section id="what-it-is" className="scroll-mt-24 bg-[#FFF8F5] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <span className="ss-tag mb-4">What it is</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#000000] sm:text-4xl">
              A private dashboard you can share with your partner.
            </h2>
            <p className="mt-5 text-base text-[#000000] sm:text-lg">
              Couple Planner brings together everything you coordinate as a couple, including
              your calendar, tasks, date ideas, trips, recipes, and shared entertainment, into
              one private dashboard. Both partners can read and update the same content, so nothing
              gets lost across multiple apps.
            </p>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-[#FBF2ED] py-8 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center sm:mb-10">
              <span className="ss-tag mb-4">Features</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#000000] sm:text-3xl lg:text-4xl">
                Plan your relationship, synced in one place.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
              {FEATURES.map((feature) => {
                const Icon = getHomeComponent(feature.icon);
                return (
                  <div
                    key={feature.title}
                    className="ss-card p-4 transition ss-card-hover sm:p-6"
                    style={{
                      backgroundColor: feature.accent,
                      backgroundImage: `linear-gradient(135deg, ${feature.accent} 0%, ${feature.accent} 68%, ${feature.fade} 100%)`,
                      borderColor: feature.accent,
                      borderWidth: '3px'
                    }}
                  >
                    <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                      <span
                        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm sm:h-11 sm:w-11"
                      >
                        <Icon size={18} />
                      </span>
                      <h3 className="text-sm font-extrabold text-white sm:text-lg">{feature.title}</h3>
                    </div>
                    <p className="mt-1 text-xs font-medium text-white/90 sm:mt-2 sm:text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="who-it-is-for" className="scroll-mt-24 bg-[#FFF8F5] py-8 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center sm:mb-10">
              <span className="ss-tag mb-4">Who it is for</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#000000] sm:text-3xl lg:text-4xl">
                Built for the plans couples actually make.
              </h2>
              <p className="mt-3 text-sm text-[#000000] sm:text-lg">
                Coordinate all your everyday moments in one shared dashboard.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              {COUPLE_SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <div
                    key={scenario.title}
                    className="ss-card p-4 sm:p-6"
                    style={{ borderWidth: '3px' }}
                  >
                    <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
                      <span
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[#000000] sm:h-10 sm:w-10"
                      >
                        <Icon size={17} />
                      </span>
                      <h3 className="text-sm font-extrabold text-[#000000] sm:text-lg">{scenario.title}</h3>
                    </div>
                    <p className="text-xs text-[#000000] sm:text-sm">{scenario.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#FBF2ED] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-10">
              <span className="ss-tag mb-4">Private by design</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#000000] sm:text-4xl">
                Start planning together in three simple steps.
              </h2>
              <p className="mt-3 text-base text-[#000000] sm:text-lg">
                Create a shared space, invite your partner, and keep your plans moving.
              </p>
            </div>
            <ol className="space-y-4">
              <li
                className="ss-card flex items-start gap-4 p-5 sm:p-6"
                style={{ borderWidth: '3px' }}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">1</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#000000]">Create a private dashboard</h3>
                  <p className="mt-1 text-sm text-[#000000]">
                    Set up the dashboard that you will share with your partner.
                  </p>
                </div>
              </li>
              <li
                className="ss-card flex items-start gap-4 p-5 sm:p-6"
                style={{ borderWidth: '3px' }}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">2</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#000000]">Invite your partner</h3>
                  <p className="mt-1 text-sm text-[#000000]">
                    Keep everything private, only invited people can see the information.
                  </p>
                </div>
              </li>
              <li
                className="ss-card flex items-start gap-4 p-5 sm:p-6"
                style={{ borderWidth: '3px' }}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">3</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#000000]">Start planning together</h3>
                  <p className="mt-1 text-sm text-[#000000]">
                    Add plans, tasks, date ideas, and keep everything synced in one dashboard.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="bg-[#FFF8F5] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#E1D8D4] bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#000000] sm:text-3xl">
              Ready to manage your relationship together?
            </h2>
            <p className="mt-3 text-base text-[#000000]">
              Sign in if you already have an account, or create one to start planning with your partner.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/login?mode=signup"
                onClick={goTo('/login?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-6 py-3 text-base font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] hover:text-white"
              >
                Create Account
              </a>
              <a
                href="/login"
                onClick={goTo('/login')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-6 py-3 text-base font-bold text-[#000000] transition hover:bg-[#FBF2ED]"
              >
                Sign In
              </a>
            </div>
          </div>
        </section>
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

window.HomePage = HomePage;
