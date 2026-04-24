const React = window.React;
const { useState } = React;

function JoinShelfModal({ isOpen, onClose, onJoin, token }) {
  const [shelfId, setShelfId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const API_BASE = window.API_BASE_URL ?? '';

  const handleSubmit = async (e) => {
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
        const data = await res.json();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">Join a Shelf</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Shelf ID"
            value={shelfId}
            onChange={e => setShelfId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            required
          />
          <input
            type="text"
            placeholder="Join Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white"
            >
              {loading ? 'Joining…' : 'Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.JoinShelfModal = JoinShelfModal;
