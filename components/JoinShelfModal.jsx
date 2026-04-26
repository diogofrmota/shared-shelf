const React = window.React;
const { useState, useEffect } = React;

function JoinShelfModal({ isOpen, onClose, onJoin, token }) {
  const sectionOptions = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'locations', label: 'Locations' },
    { id: 'trips', label: 'Trips' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'watchlist', label: 'Watchlist' }
  ];
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [code, setCode] = useState('');
  const [selectedSections, setSelectedSections] = useState(sectionOptions.map(section => section.id));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMode('create');
      setName('');
      setShelfId('');
      setCode('');
      setSelectedSections(sectionOptions.map(section => section.id));
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const toggleSection = (sectionId) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        const next = prev.filter(id => id !== sectionId);
        return next.length ? next : prev;
      }
      return [...prev, sectionId];
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const created = await createShelf(name.trim(), selectedSections);

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
  const labelClass = "mb-1.5 block text-sm font-bold text-slate-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="join-shelf-modal w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setError('');
            }}
            className={`join-shelf-tab flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'create' ? 'join-shelf-tab-active bg-white text-slate-950' : 'bg-white/5 text-white'
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
            className={`join-shelf-tab flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'join' ? 'join-shelf-tab-active bg-white text-slate-950' : 'bg-white/5 text-white'
            }`}
          >
            Join
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="create-shelf-name">Shelf Name</label>
              <input
                id="create-shelf-name"
                type="text"
                name="shelf-name"
                autoComplete="off"
                placeholder="Weekend plans"
                value={name}
                onChange={e => setName(e.target.value)}
                className="join-shelf-input w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                required
              />
            </div>
            <div className="join-shelf-sections space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="join-shelf-section-title text-sm font-semibold text-white">Shared items</p>
              <div className="grid grid-cols-2 gap-2">
                {sectionOptions.map(section => (
                  <label key={section.id} className="join-shelf-section-option flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="join-shelf-checkbox accent-white"
                    />
                    <span>{section.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="join-shelf-error text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="join-shelf-secondary flex-1 rounded-xl bg-white/5 py-3 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="join-shelf-primary flex-1 rounded-xl bg-white py-3 font-medium text-slate-950 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="join-shelf-id">Shelf ID</label>
              <input
                id="join-shelf-id"
                type="text"
                name="shelf-id"
                autoComplete="off"
                spellCheck={false}
                placeholder="Shelf ID"
                value={shelfId}
                onChange={e => setShelfId(e.target.value)}
                className="join-shelf-input w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="join-code">Join Code</label>
              <input
                id="join-code"
                type="text"
                name="join-code"
                autoComplete="off"
                spellCheck={false}
                placeholder="Join Code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="join-shelf-input w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none"
                required
              />
            </div>
            {error && <p className="join-shelf-error text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="join-shelf-secondary flex-1 rounded-xl bg-white/5 py-3 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="join-shelf-primary flex-1 rounded-xl bg-white py-3 font-medium text-slate-950 disabled:opacity-50"
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
