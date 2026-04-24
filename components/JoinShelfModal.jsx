const React = window.React;
const { useState, useEffect } = React;

function JoinShelfModal({ isOpen, onClose, onJoin, token }) {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_BASE = window.API_BASE_URL ?? '';

  useEffect(() => {
    if (!isOpen) {
      setMode('create');
      setName('');
      setShelfId('');
      setCode('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/shelves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name.trim() })
      });

      if (res.ok) {
        onJoin();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.hint || 'Failed to create shelf');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/shelves/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shelfId: shelfId.trim(), joinCode: code.trim() })
      });

      if (res.ok) {
        onJoin();
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid code');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError('');
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'create' ? 'bg-white text-slate-950' : 'bg-white/5 text-white'
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setError('');
            }}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'join' ? 'bg-white text-slate-950' : 'bg-white/5 text-white'
            }`}
          >
            Join
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Shelve name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/5 py-3 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-white py-3 font-medium text-slate-950 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              placeholder="Shelf ID"
              value={shelfId}
              onChange={e => setShelfId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              required
            />
            <input
              type="text"
              placeholder="Join Code"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/5 py-3 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-white py-3 font-medium text-slate-950 disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

window.JoinShelfModal = JoinShelfModal;
