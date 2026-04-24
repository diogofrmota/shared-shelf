const React = window.React;
const { useState, useEffect } = React;

function ShelfSelector({ onSelectShelf, onBackToLogin, token }) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
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

  const handleCreateShelf = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;

    setError('');
    setCreating(true);

    try {
      const res = await fetch(`${API_BASE}/api/shelves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: createName.trim() })
      });

      if (res.ok) {
        const { shelf } = await res.json();
        setShelves(prev => [...prev, shelf]);
        setCreateName('');
        setShowCreateForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.hint || 'Failed to create shelf');
      }
    } catch {
      setError('Connection error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinShelf = () => {
    fetchShelves();
  };

  const getShelfBadge = (name) => {
    const trimmed = (name || '').trim();
    return trimmed ? trimmed.slice(0, 2).toUpperCase() : 'SH';
  };

  if (loading) {
    return <div className="mt-20 text-center text-white">Loading shelves...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_right,rgba(244,114,182,0.12),transparent_28%),linear-gradient(160deg,#020617_0%,#0f172a_55%,#111827_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/70">Shared Shelf</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Join a Shelve</h1>
          </div>

          <button
            onClick={onBackToLogin}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Back to login
          </button>
        </div>

        {error && <p className="mb-5 text-sm text-rose-300">{error}</p>}

        <div className="mb-10 flex gap-5 overflow-x-auto pb-4">
          {shelves.map(shelf => (
            <div key={shelf.id} className="flex-none">
              <button
                onClick={() => onSelectShelf(shelf)}
                className="group flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur transition hover:-translate-y-1 hover:border-sky-300/40 hover:bg-sky-400/10"
                title={shelf.name}
              >
                <span className="text-4xl font-black uppercase tracking-[0.18em] text-white transition group-hover:text-sky-100">
                  {getShelfBadge(shelf.name)}
                </span>
              </button>
              <p className="mt-3 max-w-36 text-center text-sm font-medium text-slate-200">{shelf.name}</p>
            </div>
          ))}

          <div className="flex-none">
            <button
              onClick={() => {
                setError('');
                setShowCreateForm(prev => !prev);
              }}
              className="flex h-36 w-36 items-center justify-center rounded-[2rem] border-2 border-dashed border-white/20 bg-white/4 text-5xl font-light text-slate-300 transition hover:-translate-y-1 hover:border-sky-300/50 hover:bg-white/8 hover:text-white"
              aria-label="Add Shelve"
            >
              +
            </button>
            <p className="mt-3 text-center text-sm font-medium text-slate-200">Add Shelve</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Manage Shelves</h2>
            <button
              onClick={() => setJoinOpen(true)}
              className="rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-300/40 hover:bg-sky-400/20"
            >
              Join with code
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-5">
              <p className="mb-2 text-sm font-semibold text-white">Create a new shelve</p>
              <p className="mb-4 text-sm text-slate-400">
                Make another shared space for trips, recipes, plans, or anything else.
              </p>

              {showCreateForm ? (
                <form onSubmit={handleCreateShelf} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    placeholder="New shelve name"
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/45"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Open create form
                </button>
              )}
            </div>

            <div className="rounded-3xl border border-white/8 bg-slate-950/35 p-5">
              <p className="mb-2 text-sm font-semibold text-white">Join an existing shelve</p>
              <p className="mb-4 text-sm text-slate-400">
                Use a shelf id and one-time code to enter a shared space someone invited you to.
              </p>
              <button
                onClick={() => setJoinOpen(true)}
                className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
              >
                Open join form
              </button>
            </div>
          </div>
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
