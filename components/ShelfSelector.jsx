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
      const res = await fetch(`${API_BASE}/api/shelves/${shelf.id}/membership`, {
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

    if (nextName.length < 2) {
      setProfileError('Name must be at least 2 characters');
      return;
    }
    if (nextUsername.length < 4) {
      setProfileError('Username must be at least 4 characters');
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

  const CatalogIcon = ({ size = 58 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h7" />
      <path d="M9 11h5" />
    </svg>
  );

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center">
        <p className="text-3xl font-semibold text-white sm:text-4xl">
          Logging in ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Join your shared space</h1>
          <div className="relative flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => togglePanel('profile')}
              className="flex h-10 w-24 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <span>Profile</span>
            </button>
            <button
              onClick={onBackToLogin}
              className="flex h-10 w-24 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Logout
            </button>

            {activePanel === 'profile' && (
              <div className="absolute right-0 top-14 z-20 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-black/30">
                {isEditingProfile ? (
                  <form className="space-y-4 text-left text-sm" onSubmit={handleProfileSave}>
                    <div>
                      <label className="mb-1 block font-bold text-[#031A6B]" htmlFor="profile-name">Name</label>
                      <input
                        id="profile-name"
                        type="text"
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-black outline-none transition focus:border-[#031A6B]"
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-[#031A6B]" htmlFor="profile-username">Username</label>
                      <input
                        id="profile-username"
                        type="text"
                        value={profileUsername}
                        onChange={(event) => setProfileUsername(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-black outline-none transition focus:border-[#031A6B]"
                        autoComplete="username"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[#031A6B]">Email:</p>
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
                        className="flex-1 rounded-xl bg-[#031A6B] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#033860] disabled:opacity-60"
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
                        <p className="font-bold text-[#031A6B]">Name:</p>
                        <p className="break-words font-medium text-black">{displayName}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#031A6B]">Username:</p>
                        <p className="break-words font-medium text-black">{username}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#031A6B]">Email:</p>
                        <p className="break-words font-medium text-black">{currentUser?.email || 'No email available'}</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="shelf-profile-action w-full rounded-xl bg-[#031A6B] px-3 py-3 text-sm font-bold transition hover:bg-[#033860]"
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

        <div className="mb-4 mt-16 flex justify-center sm:mt-20 lg:mt-24">
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
                    className={`flex h-36 w-36 items-center justify-center rounded-3xl border border-white/10 bg-white text-[#031A6B] shadow-xl shadow-black/20 transition ${
                      manageMode
                        ? 'cursor-default'
                        : 'hover:-translate-y-1 hover:border-white/25 hover:bg-slate-100'
                    }`}
                    title={shelf.name}
                  >
                    <CatalogIcon />
                  </button>
                </div>
                <p className="mt-3 max-w-36 text-center text-base font-bold text-slate-100">{shelf.name}</p>
              </div>
            ))}

            <div className="flex-none">
              <button
                onClick={() => {
                  setError('');
                  setJoinOpen(true);
                }}
                className="shelf-add-tile flex h-36 w-36 items-center justify-center rounded-3xl border-2 border-dashed border-white bg-transparent text-5xl font-light text-white transition hover:-translate-y-1"
                aria-label="Add or join a shelf"
              >
                +
              </button>
              <p className="mt-3 text-center text-base font-bold text-slate-100">Add / Join a Shelf</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setManageMode(prev => !prev)}
            className={`flex h-11 w-28 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition ${
              manageMode
                ? 'border-[#ced4da] bg-[#ced4da] text-[#1f2937] hover:bg-[#adb5bd]'
                : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {manageMode ? 'Cancel' : 'Manage'}
          </button>
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
