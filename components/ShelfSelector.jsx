const React = window.React;
const { useState, useEffect } = React;

function ShelfSelector({ onSelectShelf, onBackToLogin, token, currentUser }) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [removingShelfId, setRemovingShelfId] = useState('');
  const [error, setError] = useState('');
  const [activePanel, setActivePanel] = useState('');

  const API_BASE = window.API_BASE_URL ?? '';
  const PROFILE_COLORS = ['#ae2012', '#ee9b00', '#0a9396', '#9d4edd'];

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
  const username = currentUser?.username || currentUser?.name || 'User';
  const profileInitial = (displayName.trim().charAt(0) || 'U').toUpperCase();
  const profileColor = PROFILE_COLORS[
    Array.from(`${currentUser?.id || currentUser?.email || displayName}`).reduce((sum, char) => sum + char.charCodeAt(0), 0) % PROFILE_COLORS.length
  ];

  const togglePanel = (panel) => {
    setActivePanel(prev => prev === panel ? '' : panel);
  };

  const CatalogIcon = ({ size = 58 }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h7" />
      <path d="M9 11h5" />
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
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Join your shared space</h1>
          <div className="relative flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => togglePanel('profile')}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Profile
            </button>
            <button
              onClick={onBackToLogin}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Logout
            </button>

            {activePanel === 'profile' && (
              <div className="absolute right-0 top-12 z-20 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-black/30">
                <div className="flex justify-center">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white ring-4 ring-slate-100"
                    style={{ backgroundColor: profileColor }}
                    aria-label="Profile photo"
                  >
                    {profileInitial}
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-left text-sm">
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
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="rounded-xl bg-[#031A6B] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#033860]"
                  >
                    Change password
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-[#087CA7] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#004385]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mb-5 text-sm text-rose-300">{error}</p>}

        <div className="mb-4 mt-16 flex justify-center sm:mt-20 lg:mt-24">
          <div className="flex max-w-full gap-6 overflow-x-auto pb-4">
            {shelves.map(shelf => (
              <div key={shelf.id} className="flex-none">
                <div className="relative">
                  {manageMode && (
                    <button
                      onClick={() => handleRemoveShelf(shelf)}
                      disabled={removingShelfId === shelf.id}
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-900 text-lg font-bold leading-none text-white transition hover:bg-red-800 disabled:opacity-50"
                      aria-label={`Remove ${shelf.name}`}
                    >
                      X
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
                className="flex h-36 w-36 items-center justify-center rounded-3xl border-2 border-dashed border-white bg-transparent text-5xl font-light text-white transition hover:-translate-y-1 hover:bg-white/5"
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
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Manage
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
