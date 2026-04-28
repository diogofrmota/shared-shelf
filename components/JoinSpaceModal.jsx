const React = window.React;
const { useState, useEffect } = React;

function JoinSpaceModal({ isOpen, onClose, onJoin, token }) {
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
  const [spaceId, setSpaceId] = useState('');
  const [code, setCode] = useState('');
  const [selectedSections, setSelectedSections] = useState(sectionOptions.map(section => section.id));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMode('create');
      setName('');
      setSpaceId('');
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
      const created = await createSpace(name.trim(), selectedSections);
      if (created?.space) {
        onJoin(created.space);
        onClose();
      } else {
        setError('Failed to create space');
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
      const joined = await joinSpace(spaceId.trim(), code.trim());
      if (joined?.space) {
        onJoin(joined.space);
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

  const inputCls = "w-full rounded-xl border border-[#E1D8D4] bg-white px-4 py-3 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#534340]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#E1D8D4] bg-white p-6 shadow-2xl shadow-[#410001]/30">
        <div className="mb-5">
          <h2 className="text-xl font-extrabold text-[#410001]">
            {mode === 'create' ? 'Create a space' : 'Join a space'}
          </h2>
          <p className="mt-1 text-sm text-[#534340]">
            {mode === 'create'
              ? 'Start a new shared space and pick what you want to track.'
              : 'Enter the space ID and one-time join code from a space owner.'}
          </p>
        </div>

        <div className="mb-5 flex gap-1.5 rounded-xl bg-[#FBF2ED] p-1.5">
          <button
            type="button"
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'create' ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#534340] hover:text-[#410001]'}`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => { setMode('join'); setError(''); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'join' ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#534340] hover:text-[#410001]'}`}
          >
            Join
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="create-space-name">Space name</label>
              <input
                id="create-space-name"
                type="text"
                name="space-name"
                autoComplete="off"
                placeholder="Weekend plans"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <p className={labelCls}>Shared items</p>
              <div className="grid grid-cols-2 gap-2">
                {sectionOptions.map(section => (
                  <label key={section.id} className="flex items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
                    />
                    <span>{section.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-sm font-semibold text-[#C1121F]">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create space'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="join-space-id">Space ID</label>
              <input
                id="join-space-id"
                type="text"
                name="space-id"
                autoComplete="off"
                spellCheck={false}
                placeholder="Space ID"
                value={spaceId}
                onChange={e => setSpaceId(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="join-code">Join code</label>
              <input
                id="join-code"
                type="text"
                name="join-code"
                autoComplete="off"
                spellCheck={false}
                placeholder="Join code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            {error && <p className="text-sm font-semibold text-[#C1121F]">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join space'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

window.JoinSpaceModal = JoinSpaceModal;
