const React = window.React;
const { useState, useEffect } = React;

function ShelfSelector({ onSelectShelf, onBackToLogin, token }) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [removingShelfId, setRemovingShelfId] = useState('');
  const [error, setError] = useState('');

  const API_BASE = window.API_BASE_URL ?? '';

  useEffect(() => {
    document.title = 'Shared Shelf - Join your Shelf';
  }, []);

  const fetchShelves = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/shelves`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setShelves(data.shelves || []);
        setError('');
      } else {
        setError('Failed to load shelves');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, [token]);

  const handleJoinShelf = () => {
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

  const getShelfBadge = (name) => {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.slice(0, 2).toUpperCase() : 'SH';
  };

  if (loading) {
    return <div className="mt-20 text-center text-white">Loading shelves...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Join a Shelve</h1>
          <button
            onClick={onBackToLogin}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        {error && <p className="mb-5 text-sm text-rose-300">{error}</p>}

        <div className="mb-8 flex gap-5 overflow-x-auto pb-4">
          {shelves.map(shelf => (
            <div key={shelf.id} className="flex-none">
              <div className="relative">
                {manageMode && (
                  <button
                    onClick={() => handleRemoveShelf(shelf)}
                    disabled={removingShelfId === shelf.id}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg text-white transition hover:bg-black disabled:opacity-50"
                    aria-label={`Remove ${shelf.name}`}
                  >
                    X
                  </button>
                )}
                <button
                  onClick={() => !manageMode && onSelectShelf(shelf)}
                  disabled={manageMode}
                  className={`flex h-36 w-36 items-center justify-center rounded-3xl border border-white/10 bg-slate-900 text-white transition ${
                    manageMode
                      ? 'cursor-default'
                      : 'hover:-translate-y-1 hover:border-white/25 hover:bg-slate-800'
                  }`}
                  title={shelf.name}
                >
                  <span className="text-4xl font-bold uppercase tracking-[0.18em]">
                    {getShelfBadge(shelf.name)}
                  </span>
                </button>
              </div>
              <p className="mt-3 max-w-36 text-center text-sm font-medium text-slate-200">{shelf.name}</p>
            </div>
          ))}

          <div className="flex-none">
            <button
              onClick={() => {
                setError('');
                setJoinOpen(true);
              }}
              className="flex h-36 w-36 items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-transparent text-5xl font-light text-white transition hover:-translate-y-1 hover:border-white/40 hover:bg-white/5"
              aria-label="Add or join a shelve"
            >
              +
            </button>
            <p className="mt-3 text-center text-sm font-medium text-slate-200">Add/ Join a Shelve</p>
          </div>
        </div>

        <button
          onClick={() => setManageMode(prev => !prev)}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Manage Shelves
        </button>
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
