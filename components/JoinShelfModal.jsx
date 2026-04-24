const React = window.React;
const { useState, useEffect } = React;

function JoinShelfModal({ isOpen, onClose, onJoin, token }) {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const created = await createShelf(name.trim());

      if (created?.shelf) {
        onJoin(created.shelf);
        onClose();
      } else {
        setError('Failed to create shelf');
      }
    } catch (err) {
      setError(err?.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const joined = await joinShelf(shelfId.trim(), code.trim());

      if (joined?.shelf) {
        onJoin(joined.shelf);
        onClose();
      } else {
        setError('Invalid code');
      }
    } catch (err) {
      setError(err?.message || 'Connection error');
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
              placeholder="Shelf name"
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
