const React = window.React;
const { useState, useEffect } = React;

function ShelfSelector({ onSelectShelf, onBackToLogin, userId, token }) {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = window.API_BASE_URL ?? '';

  // Set document title for this view
  useEffect(() => {
    document.title = 'Shared Shelf - Join your Shelf';
  }, []);

  // Fetch user's shelves
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
      } else {
        setError('Failed to load shelves');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShelves(); }, [token]);

  // Create a new shelf
  const handleCreateShelf = async (e) => {
    e.preventDefault();
    if (!createName.trim()) return;
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
      } else {
        setError('Failed to create shelf');
      }
    } catch {
      setError('Connection error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinShelf = (shelfId, code) => {
    // Called after successful join
    fetchShelves();
  };

  if (loading) return <div className="text-white text-center mt-20">Loading shelves…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Shelves</h1>
          <button onClick={onBackToLogin} className="text-slate-400 hover:text-white text-sm">
            ← Back to login
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Shelf cards horizontally */}
        <div className="flex overflow-x-auto gap-4 pb-4 mb-8">
          {shelves.map(shelf => (
            <button
              key={shelf.id}
              onClick={() => onSelectShelf(shelf)}
              className="flex-none w-40 h-40 bg-slate-800/80 hover:bg-purple-800/50 border border-slate-700 hover:border-purple-500 rounded-xl flex items-center justify-center text-white font-medium transition"
            >
              {shelf.name}
            </button>
          ))}

          {/* Add new shelf square */}
          <button
            onClick={() => setCreateName('') /* to focus the input below, we show inline form */}
            className="flex-none w-40 h-40 bg-slate-800/40 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition text-3xl"
          >
            +
          </button>
        </div>

        {/* Inline create shelf form (appears when you click +) */}
        {createName !== undefined && (
          <form onSubmit={handleCreateShelf} className="mb-6 flex gap-3">
            <input
              type="text"
              placeholder="New shelf name"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
              autoFocus
            />
            <button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        )}

        {/* Join a Shelf button */}
        <button
          onClick={() => setJoinOpen(true)}
          className="w-full py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-purple-500 rounded-xl text-slate-200 font-medium transition"
        >
          Join a Shelf
        </button>
      </div>

      {/* Join Shelf Modal */}
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
