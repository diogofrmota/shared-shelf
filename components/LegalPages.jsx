const React = window.React;
const { useState, useEffect, useRef } = React;

function LegalPageShell({ title, lastUpdated, onNavigate, currentUser, onUpdateUser, onLogout, children }) {
  const SiteFooter = window.getWindowComponent?.('SiteFooter', null);
  const BrandLogo = window.getWindowComponent?.('BrandLogo', window.MissingComponent) || window.MissingComponent;
  const PencilIcon = window.getWindowComponent?.('PencilIcon', window.MissingIcon) || window.MissingIcon;
  const UserIcon = window.getWindowComponent?.('UserIcon', window.MissingIcon) || window.MissingIcon;
  const LogoutIcon = window.getWindowComponent?.('LogoutIcon', window.MissingIcon) || window.MissingIcon;

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

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout?.();
  };

  const goTo = (path) => (event) => {
    if (event) event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <header className="sticky top-0 z-30 border-b border-[#E1D8D4]/70 bg-[#FFF8F5]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" onClick={goTo('/')} className="flex items-center gap-2">
            <BrandLogo />
          </a>

          <nav className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <>
                <a
                  href="/dashboard-selection/"
                  onClick={goTo('/dashboard-selection/')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
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
                              >
                                {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
                              </button>
                            </div>
                            {editingProfileField === 'name' && (
                              <form className="mt-3 space-y-3" onSubmit={handleProfileSave}>
                                <input
                                  type="text"
                                  value={profileName}
                                  onChange={(e) => setProfileName(e.target.value)}
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
                              >
                                {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
                              </button>
                            </div>
                            {editingProfileField === 'username' && (
                              <form className="mt-3 space-y-3" onSubmit={handleProfileSave}>
                                <div>
                                  <input
                                    type="text"
                                    value={profileUsername}
                                    onChange={(e) => handleProfileUsernameChange(e.target.value)}
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
                              >
                                {PencilIcon ? <PencilIcon size={16} /> : 'Edit'}
                              </button>
                            </div>
                            {editingProfileField === 'email' && (
                              <form className="mt-3 space-y-3" onSubmit={handleProfileEmailSave}>
                                <div>
                                  <input
                                    type="email"
                                    value={profileNewEmail}
                                    onChange={(e) => setProfileNewEmail(e.target.value)}
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
                            onClick={handleLogout}
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
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={goTo('/login')}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-[#000000] transition hover:text-[#E63B2E]"
                >
                  Log in
                </a>
                <a
                  href="/login?mode=register"
                  onClick={goTo('/login?mode=register')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
                >
                  Register
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-[#E1D8D4] bg-white p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#000000] sm:text-4xl">{title}</h1>
            {lastUpdated && (
              <p className="mt-2 text-sm font-medium text-[#000000]">Last updated: {lastUpdated}</p>
            )}
            <div className="mt-6 space-y-5 text-[#000000]">
              {children}
            </div>
          </div>
        </div>
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

const sectionHeadingClass = "mt-2 text-xl font-extrabold text-[#000000]";
const paragraphClass = "text-sm leading-relaxed text-[#000000] sm:text-base";
const listClass = "ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-[#000000] sm:text-base";

function PrivacyPolicyPage({ onNavigate, currentUser, onUpdateUser, onLogout }) {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="April 2026" onNavigate={onNavigate} currentUser={currentUser} onUpdateUser={onUpdateUser} onLogout={onLogout}>
      <p className={paragraphClass}>
        This Privacy Policy describes what Couple Planner collects, why, and how it is stored. Couple Planner is a small
        side-project app, so the policy below intentionally stays short and direct.
      </p>

      <h2 className={sectionHeadingClass}>What we collect</h2>
      <ul className={listClass}>
        <li>Account information you provide: name, username, email, and a hashed password.</li>
        <li>dashboard content you create: calendar activities, tasks, dates, trips, recipes, and entertainment items.</li>
        <li>
          Technical data needed to run the app: session tokens stored in your browser, basic request logs from the
          hosting platform, and database records for your dashboards and memberships.
        </li>
      </ul>

      <h2 className={sectionHeadingClass}>How we use it</h2>
      <ul className={listClass}>
        <li>To sign you in and let you read and write the dashboards you belong to.</li>
        <li>To send transactional email such as account confirmation and password reset links.</li>
        <li>To keep the app available, debug failures, and prevent abuse.</li>
      </ul>

      <h2 className={sectionHeadingClass}>What we do not do</h2>
      <ul className={listClass}>
        <li>We do not sell or rent your personal data.</li>
        <li>We do not run advertising or third-party tracking on the app.</li>
        <li>
          dashboard content is only visible to invited dashboard members. We do not share private dashboard content with anyone
          else.
        </li>
      </ul>

      <h2 className={sectionHeadingClass}>Third-party services</h2>
      <p className={paragraphClass}>
        Couple Planner relies on a small set of third parties to operate. By using the app, your data may be processed by
        these services in line with their own privacy policies:
      </p>
      <ul className={listClass}>
        <li>Vercel for hosting the website and serverless API.</li>
        <li>Vercel Postgres / Neon for storing your account, dashboard metadata, and dashboard content.</li>
        <li>Resend for sending account confirmation and password reset emails when configured.</li>
        <li>TMDB, Open Library, Jikan, and OpenStreetMap Nominatim for media and location lookups you trigger.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Your choices</h2>
      <ul className={listClass}>
        <li>You can update your name and username from the account modal.</li>
        <li>You can leave a dashboard at any time from the dashboard selection page.</li>
        <li>
          To delete your account or any dashboard you own, contact us through the bug report page and ask. We will respond
          and act on the request manually.
        </li>
      </ul>

      <h2 className={sectionHeadingClass}>Contact</h2>
      <p className={paragraphClass}>
        Questions about privacy? Use the <a href="/report-a-bug" onClick={(event) => { event.preventDefault(); onNavigate?.('/report-a-bug'); }} className="font-bold text-[#E63B2E] hover:text-[#A9372C]">Report a Bug</a> page to reach us.
      </p>
    </LegalPageShell>
  );
}

function TermsOfServicePage({ onNavigate, currentUser, onUpdateUser, onLogout }) {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="April 2026" onNavigate={onNavigate} currentUser={currentUser} onUpdateUser={onUpdateUser} onLogout={onLogout}>
      <p className={paragraphClass}>
        These terms describe the basic rules for using Couple Planner. By creating an account or using the app, you
        agree to them.
      </p>

      <h2 className={sectionHeadingClass}>Your account</h2>
      <ul className={listClass}>
        <li>You are responsible for keeping your account credentials safe.</li>
        <li>You confirm that the information you provide at sign-up is accurate and that you are old enough to use the app where you live.</li>
        <li>You are responsible for the activity that happens under your account.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Your content</h2>
      <ul className={listClass}>
        <li>You keep ownership of the content you add to your dashboards.</li>
        <li>You give Couple Planner the limited permission needed to store, display, and back up that content for dashboard members.</li>
        <li>You confirm that your content does not break the law and does not violate other people's rights.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Acceptable use</h2>
      <ul className={listClass}>
        <li>Do not abuse the service, attempt to break authentication, or scrape it.</li>
        <li>Do not use the app to harass other people or to store illegal content.</li>
        <li>Do not attempt to overload the API or work around rate-limits and quotas.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Service availability</h2>
      <p className={paragraphClass}>
        Couple Planner is provided as-is and may be unavailable from time to time. The app runs on a free hosting plan
        and may be paused, throttled, or change behavior at any time. We do our best to preserve your data, but you
        should not rely on Couple Planner as the only place where critical information lives.
      </p>

      <h2 className={sectionHeadingClass}>Termination</h2>
      <p className={paragraphClass}>
        You can stop using Couple Planner at any time. We may suspend or remove accounts that break these terms or that
        threaten the safety or stability of the service.
      </p>

      <h2 className={sectionHeadingClass}>Changes</h2>
      <p className={paragraphClass}>
        These terms may change as the app evolves. The date at the top reflects the most recent update. Continued use
        of the app after a change means you accept the updated terms.
      </p>

      <h2 className={sectionHeadingClass}>Contact</h2>
      <p className={paragraphClass}>
        Questions or concerns? Use the <a href="/report-a-bug" onClick={(event) => { event.preventDefault(); onNavigate?.('/report-a-bug'); }} className="font-bold text-[#E63B2E] hover:text-[#A9372C]">Report a Bug</a> page to reach us.
      </p>
    </LegalPageShell>
  );
}

window.PrivacyPolicyPage = PrivacyPolicyPage;
window.TermsOfServicePage = TermsOfServicePage;
window.LegalPageShell = LegalPageShell;
