const React = window.React;
const { useState, useEffect } = React;

function ShelfSelector({ onSelectShelf, onBackToLogin, onUpdateUser, token, currentUser }) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [removingShelfId, setRemovingShelfId] = useState('');
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const API_BASE = window.API_BASE_URL ?? '';

  useEffect(() => {
    document.title = 'Shared Shelf - Join your Shelf';
  }, []);

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

  const handleRemoveShelf = async (shelf) => {
    const confirmed = window.confirm(`Do you want to remove "${shelf.name}"?`);
    if (!confirmed) return;

    setError('');
    setRemovingShelfId(shelf.id);

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

  const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
  const username = currentUser?.username || 'User';

  useEffect(() => {
    if (activePanel === 'profile') {
      setIsEditingProfile(false);
      setProfileName(displayName);
      setProfileUsername(username);
      setProfileError('');
    }
  }, [activePanel, currentUser?.id, displayName, username]);

  const togglePanel = (panel) => {
    setActivePanel(prev => prev === panel ? '' : panel);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const nextName = profileName.trim();
    const nextUsername = profileUsername.trim();

    if (!nextName) {
      setProfileError('Name is required');
      return;
    }
    if (nextName.length > 20) {
      setProfileError('Name must be 20 characters or fewer');
      return;
    }
    if (!/^[A-Za-z ]+$/.test(nextName)) {
      setProfileError('Name can only contain letters and spaces');
      return;
    }
    if (!nextUsername) {
      setProfileError('Username is required');
      return;
    }
    if (nextUsername.length > 20) {
      setProfileError('Username must be 20 characters or fewer');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(nextUsername)) {
      setProfileError('Username can only contain letters and numbers');
      return;
    }

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
    { bg: '#8ecae6', border: '#4f9fbd', text: '#073b4c' },
    { bg: '#ffb703', border: '#d78d00', text: '#3d2b00' },
    { bg: '#b8f2c2', border: '#64b874', text: '#0f3d1c' },
    { bg: '#f7a8b8', border: '#ce6477', text: '#4a1020' },
    { bg: '#ffdad4', border: '#ffb4a9', text: '#410001' },
    { bg: '#90dbf4', border: '#38a9c9', text: '#063949' },
    { bg: '#fdd85d', border: '#d4a21a', text: '#3a2c05' },
    { bg: '#a7c957', border: '#6f9230', text: '#24340d' }
  ];

  const getMemberName = (member) => (
    member?.name || member?.displayName || member?.username || member?.email || 'User'
  );

  const getAvatarStyle = (member) => {
    const seed = String(member?.id || getMemberName(member))
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const color = avatarPalette[seed % avatarPalette.length];
    return {
      backgroundColor: color.bg,
      borderColor: color.border,
      color: color.text
    };
  };

  const AvatarBubble = ({ member, className = '' }) => {
    const name = getMemberName(member);
    const initial = name.trim().charAt(0).toUpperCase() || '?';

    return (
      <span
        className={`absolute flex h-14 w-14 items-center justify-center rounded-full border-4 text-xl font-black shadow-md shadow-slate-950/10 ${className}`}
        style={getAvatarStyle(member)}
        title={name}
        aria-label={name}
      >
        {initial}
      </span>
    );
  };

  const AvatarCluster = ({ shelf }) => {
    const shelfMembers = Array.isArray(shelf.members) && shelf.members.length
      ? shelf.members
      : [currentUser].filter(Boolean);
    const visibleMembers = shelfMembers.slice(0, 4);
    const overflowCount = Math.max(0, shelfMembers.length - visibleMembers.length);
    const positionsByCount = {
      1: ['left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'],
      2: ['left-3 top-1/2 -translate-y-1/2', 'right-3 top-1/2 -translate-y-1/2'],
      3: ['left-3 top-3', 'right-3 top-3', 'left-1/2 bottom-3 -translate-x-1/2'],
      4: ['left-3 top-3', 'right-3 top-3', 'left-3 bottom-3', 'right-3 bottom-3']
    };
    const positions = positionsByCount[visibleMembers.length] || positionsByCount[1];
    const memberNames = shelfMembers.map(getMemberName).join(', ');

    return (
      <span className="relative block h-28 w-28" aria-label={`${shelf.name} members: ${memberNames}`}>
        {visibleMembers.map((member, index) => (
          <AvatarBubble
            key={member?.id || `${getMemberName(member)}-${index}`}
            member={member}
            className={`${positions[index]} ${index > 0 ? '-ml-2' : ''}`}
          />
        ))}
        {overflowCount > 0 && (
          <span className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-slate-500 bg-slate-200 text-sm font-black text-slate-800 shadow-lg shadow-slate-950/15">
            +{overflowCount}
          </span>
        )}
      </span>
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
    return <LoadingScreen label="Logging in..." />;
  }

  return (
    <div className="min-h-screen bg-[#fbf2ed] px-4 py-8 text-[#241a18] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-5 rounded-xl border border-[#e1d8d4] bg-[#fff8f5] px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.16em] text-[#e63b2e]">Shared Shelf</p>
            <h1 className="text-2xl font-bold text-[#410001] sm:text-3xl lg:text-4xl">Your Shelves</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[#534340] sm:text-base">
              Open an existing shelf, create a new one, or join with an invite code.
            </p>
          </div>
          <div className="relative flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => togglePanel('profile')}
              className="flex h-10 w-24 items-center justify-center rounded-lg border border-[#e1d8d4] bg-white px-4 text-sm font-semibold text-[#410001] transition hover:bg-[#fbf2ed]"
            >
              <span>Profile</span>
            </button>
            <button
              onClick={onBackToLogin}
              className="flex h-10 w-24 items-center justify-center rounded-lg border border-[#e1d8d4] bg-white px-4 text-sm font-semibold text-[#410001] transition hover:bg-[#fbf2ed]"
            >
              Logout
            </button>

            {activePanel === 'profile' && (
              <div className="absolute right-0 top-14 z-20 w-80 rounded-xl border border-[#e1d8d4] bg-white p-5 shadow-2xl shadow-red-950/10">
                {isEditingProfile ? (
                  <form className="space-y-4 text-left text-sm" onSubmit={handleProfileSave}>
                    <div>
                      <label className="mb-1 block font-bold text-[#410001]" htmlFor="profile-name">Name</label>
                      <input
                        id="profile-name"
                        type="text"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        className="w-full rounded-lg border border-[#e1d8d4] bg-[#fbf2ed] px-3 py-2 text-[#241a18] outline-none transition focus:border-[#e63b2e]"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-[#410001]" htmlFor="profile-username">Username</label>
                      <input
                        id="profile-username"
                        type="text"
                        value={profileUsername}
                        onChange={(event) => setProfileUsername(event.target.value)}
                        className="w-full rounded-lg border border-[#e1d8d4] bg-[#fbf2ed] px-3 py-2 text-[#241a18] outline-none transition focus:border-[#e63b2e]"
                        autoComplete="username"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[#410001]">Email:</p>
                      <p className="break-words font-medium text-black">{currentUser?.email || 'No email available'}</p>
                    </div>
                    {profileError && <p className="text-sm font-semibold text-[#c1121f]">{profileError}</p>}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileName(displayName);
                          setProfileUsername(username);
                          setProfileError('');
                        }}
                        className="flex-1 rounded-xl bg-[#ced4da] px-3 py-3 text-sm font-bold text-[#1f2937] transition hover:bg-[#adb5bd]"
                        disabled={profileSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-[#e63b2e] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#a9372c] disabled:opacity-60"
                        disabled={profileSaving}
                      >
                        {profileSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="space-y-3 text-left text-sm">
                      <div>
                        <p className="font-bold text-[#410001]">Name:</p>
                        <p className="break-words font-medium text-black">{displayName}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#410001]">Username:</p>
                        <p className="break-words font-medium text-black">{username}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#410001]">Email:</p>
                        <p className="break-words font-medium text-black">{currentUser?.email || 'No email available'}</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="shelf-profile-action w-full rounded-lg bg-[#e63b2e] px-3 py-3 text-sm font-bold transition hover:bg-[#a9372c]"
                        style={{ color: '#ffffff' }}
                      >
                        Edit Information
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="mb-5 text-sm text-rose-300">{error}</p>}

        {shelves.length === 0 && !error && (
          <div className="mx-auto mb-2 max-w-xl rounded-xl border border-[#e1d8d4] bg-white p-5 text-center text-[#241a18] shadow-sm">
            <p className="text-lg font-bold">No shelves yet</p>
            <p className="mt-1 text-sm text-[#534340]">Create a shelf for shared plans, or join one with a shelf ID and code.</p>
          </div>
        )}

        <div className={`mb-4 flex justify-center ${shelves.length ? 'mt-16 sm:mt-20 lg:mt-24' : 'mt-8'}`}>
          <div className="flex max-w-full gap-6 overflow-x-auto px-1 pb-4 pt-2">
            {shelves.map(shelf => (
              <div key={shelf.id} className="flex-none">
                <div className="relative">
                  {manageMode && (
                    <button
                      onClick={() => handleRemoveShelf(shelf)}
                      disabled={removingShelfId === shelf.id}
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#c1121f] text-white transition hover:bg-[#a80f1a] disabled:opacity-50"
                      aria-label={`Remove ${shelf.name}`}
                    >
                      <TrashCanIcon />
                    </button>
                  )}
                  <button
                    onClick={() => !manageMode && onSelectShelf(shelf)}
                    disabled={manageMode}
                    className={`flex h-36 w-36 items-center justify-center rounded-xl border border-[#e1d8d4] bg-white text-[#410001] shadow-sm transition ${
                      manageMode
                        ? 'cursor-default'
                        : 'hover:-translate-y-1 hover:border-[#e63b2e] hover:bg-[#fff8f5] hover:shadow-lg hover:shadow-red-950/10'
                    }`}
                    title={shelf.name}
                  >
                    <AvatarCluster shelf={shelf} />
                  </button>
                </div>
                <p className="mt-3 max-w-36 text-center text-base font-bold text-[#410001]">{shelf.name}</p>
              </div>
            ))}

            <div className="flex-none">
              <button
                onClick={() => {
                  setError('');
                  setJoinOpen(true);
                }}
                className="shelf-add-tile flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-[#e63b2e] bg-white text-5xl font-light text-[#e63b2e] transition hover:-translate-y-1 hover:bg-[#fff8f5]"
                aria-label="Add or join a shelf"
              >
                +
              </button>
              <p className="mt-3 text-center text-base font-bold text-[#410001]">Add / Join a Shelf</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          {shelves.length > 0 && (
            <button
              onClick={() => setManageMode(prev => !prev)}
              className={`flex h-11 w-28 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition ${
                manageMode
                  ? 'border-[#e63b2e] bg-white text-[#410001] hover:bg-[#fff8f5]'
                  : 'border-[#e1d8d4] bg-white text-[#410001] hover:bg-[#fff8f5]'
              }`}
            >
              {manageMode ? 'Cancel' : 'Manage'}
            </button>
          )}
        </div>
      </div>

      <JoinShelfModal
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={handleJoinShelf}
        token={token}
      />
    </div>
  );
}

window.ShelfSelector = ShelfSelector;
