const React = window.React;
const { useState, useEffect, useRef } = React;

function ShelfSelector({ onSelectShelf, onBackToLogin, onUpdateUser, token, currentUser }) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [removingShelfId, setRemovingShelfId] = useState('');
  const [error, setError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [pendingShelfRemoval, setPendingShelfRemoval] = useState(null);
  const profileRef = useRef(null);

  const API_BASE = window.API_BASE_URL ?? '';

  useEffect(() => {
    document.title = 'Shared Shelf - Your shelves';
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

  const fetchShelves = async () => {
    try {
      const nextShelves = await getUserShelves();
      setShelves(nextShelves);
      setError('');
    } catch {
      setError('Failed to load shelves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, [token]);

  const handleJoinShelf = (shelf) => {
    if (shelf) {
      setShelves(prev => {
        const remaining = prev.filter(item => item.id !== shelf.id);
        return [shelf, ...remaining];
      });
      onSelectShelf(shelf);
      return;
    }
    fetchShelves();
  };

  const removeShelfMembership = async (shelf) => {
    setError('');
    setRemovingShelfId(shelf.id);
    setPendingShelfRemoval(null);

    try {
      const res = await fetch(`${API_BASE}/api/shelf/${shelf.id}/membership`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setShelves(prev => prev.filter(item => item.id !== shelf.id));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to remove shelf');
      }
    } catch {
      setError('Connection error');
    } finally {
      setRemovingShelfId('');
    }
  };

  const handleRemoveShelf = (shelf) => {
    setPendingShelfRemoval(shelf);
  };

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

  const avatarPalette = [
    { bg: '#FFB4A9', text: '#410001' },
    { bg: '#FFDAD4', text: '#410001' },
    { bg: '#FBD08A', text: '#3A2C05' },
    { bg: '#A7C957', text: '#24340D' },
    { bg: '#8ECAE6', text: '#073B4C' },
    { bg: '#F7A8B8', text: '#4A1020' },
    { bg: '#90DBF4', text: '#063949' },
    { bg: '#E63B2E', text: '#FFFFFF' }
  ];

  const getMemberName = (member) => (
    member?.name || member?.displayName || member?.username || member?.email || 'User'
  );

  const getAvatarStyle = (member) => {
    const seed = String(member?.id || getMemberName(member))
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const color = avatarPalette[seed % avatarPalette.length];
    return { backgroundColor: color.bg, color: color.text };
  };

  const MemberStack = ({ members, max = 3 }) => {
    const visible = members.slice(0, max);
    const overflow = Math.max(0, members.length - visible.length);
    return (
      <div className="flex -space-x-2">
        {visible.map((member, idx) => {
          const name = getMemberName(member);
          const initial = name.trim().charAt(0).toUpperCase() || '?';
          return (
            <span
              key={member?.id || `${name}-${idx}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-sm"
              style={getAvatarStyle(member)}
              title={name}
              aria-label={name}
            >
              {initial}
            </span>
          );
        })}
        {overflow > 0 && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#410001] text-[10px] font-bold text-white shadow-sm">
            +{overflow}
          </span>
        )}
      </div>
    );
  };

  const TrashCanIcon = ({ size = 16 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );

  if (loading) {
    return <LoadingScreen label="Loading your shelves..." />;
  }

  const userInitial = (displayName || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FBF2ED] text-[#241A18]">
      {/* Top header */}
      <header className="border-b border-[#E1D8D4] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E63B2E] text-white shadow-sm shadow-[#E63B2E]/25 sm:h-10 sm:w-10">
              <Tv size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-[#410001] sm:text-lg">Shared Shelf</p>
              <p className="text-xs font-medium text-[#534340]">Your collaborative spaces</p>
            </div>
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

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Hero */}
        <section className="mb-8 sm:mb-10">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#E63B2E]">Your shelves</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl lg:text-5xl">Join your shared space</h1>
          <p className="mt-3 max-w-2xl text-base font-medium text-[#534340]">
            Open an existing shelf to keep planning, or create a new one for your family, roommates, or friends.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-[#FFB4A9] bg-[#FFDAD4] px-4 py-3 text-sm font-semibold text-[#410001]">
            {error}
          </div>
        )}

        {/* Action bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setError(''); setJoinOpen(true); }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
            >
              <Plus size={16} />
              Create or join
            </button>
            {shelves.length > 0 && (
              <button
                type="button"
                onClick={() => setManageMode(prev => !prev)}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                  manageMode
                    ? 'border-[#E63B2E] bg-[#FFDAD4] text-[#410001]'
                    : 'border-[#E1D8D4] bg-white text-[#410001] hover:bg-[#FFF8F5]'
                }`}
              >
                {manageMode ? 'Done managing' : 'Manage shelves'}
              </button>
            )}
          </div>
          <span className="text-sm font-medium text-[#534340]">{shelves.length} {shelves.length === 1 ? 'shelf' : 'shelves'}</span>
        </div>

        {shelves.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E]">
              <Plus size={28} />
            </div>
            <h2 className="text-xl font-bold text-[#410001]">No shelves yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#534340]">
              Create a shelf for shared plans, or join one with a shelf ID and code.
            </p>
            <button
              type="button"
              onClick={() => { setError(''); setJoinOpen(true); }}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
            >
              <Plus size={16} />
              Create your first shelf
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelves.map(shelf => {
              const shelfMembers = Array.isArray(shelf.members) && shelf.members.length
                ? shelf.members
                : [currentUser].filter(Boolean);
              return (
                <div key={shelf.id} className="group relative overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#410001]/10">
                  {manageMode && (
                    <button
                      onClick={() => handleRemoveShelf(shelf)}
                      disabled={removingShelfId === shelf.id}
                      className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#C1121F] text-white shadow-md transition hover:bg-[#A80F1A] disabled:opacity-50"
                      aria-label={`Remove ${shelf.name}`}
                    >
                      <TrashCanIcon />
                    </button>
                  )}
                  <button
                    onClick={() => !manageMode && onSelectShelf(shelf)}
                    disabled={manageMode}
                    className="block min-h-[44px] w-full text-left"
                  >
                    <div
                      className="flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-[#A9372C] via-[#E63B2E] to-[#8C4F45] text-white"
                      aria-hidden="true"
                    >
                      <span className="text-4xl font-extrabold tracking-tight opacity-90">
                        {shelf.name?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="line-clamp-2 text-lg font-extrabold leading-tight text-[#410001]" title={shelf.name}>{shelf.name}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        <MemberStack members={shelfMembers} />
                        <span className="rounded-full bg-[#FFDAD4] px-2.5 py-0.5 text-xs font-bold text-[#410001]">
                          {shelfMembers.length} {shelfMembers.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Add tile */}
            <button
              type="button"
              onClick={() => { setError(''); setJoinOpen(true); }}
              className="group flex min-h-[224px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#E63B2E]/60 bg-white text-[#E63B2E] transition hover:-translate-y-1 hover:border-[#E63B2E] hover:bg-[#FFF8F5] hover:shadow-lg hover:shadow-[#410001]/10"
              aria-label="Create or join a shelf"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E] transition group-hover:bg-[#E63B2E] group-hover:text-white">
                <Plus size={26} />
              </span>
              <span className="text-base font-extrabold text-[#410001]">Add or join a shelf</span>
            </button>
          </div>
        )}
      </main>

      <JoinShelfModal
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={handleJoinShelf}
        token={token}
      />
      <ConfirmationDialog
        isOpen={Boolean(pendingShelfRemoval)}
        title="Remove shelf?"
        message={`This removes "${pendingShelfRemoval?.name || 'this shelf'}" from your account. Other members can keep using it if they still have access.`}
        confirmLabel={removingShelfId ? 'Removing...' : 'Remove shelf'}
        cancelLabel="Keep shelf"
        onConfirm={() => pendingShelfRemoval && removeShelfMembership(pendingShelfRemoval)}
        onCancel={() => setPendingShelfRemoval(null)}
      />
    </div>
  );
}

window.ShelfSelector = ShelfSelector;
