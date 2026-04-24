const React = window.React;
const { useEffect, useState } = React;

function ShareShelfModal({ isOpen, onClose, shelf }) {
  const [shareInfo, setShareInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    if (!isOpen || !shelf?.id) {
      setShareInfo(null);
      setError('');
      setCopiedField('');
      return;
    }

    let active = true;

    const loadShareInfo = async () => {
      setLoading(true);
      setError('');

      try {
        const nextShareInfo = await getShelfShareInfo(shelf.id);
        if (active) {
          setShareInfo(nextShareInfo);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || 'Failed to load share details');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadShareInfo();

    return () => {
      active = false;
    };
  }, [isOpen, shelf?.id]);

  if (!isOpen || !shelf) return null;

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(''), 1500);
    } catch {
      setCopiedField('');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');

    try {
      const nextShareInfo = await regenerateShelfJoinCode(shelf.id);
      setShareInfo(nextShareInfo);
    } catch (err) {
      setError(err?.message || 'Failed to generate a new code');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Share Shelf</h2>
            <p className="mt-1 text-sm text-slate-400">
              Share this shelf ID and one-time code so someone else can join.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Close share modal"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shelf</p>
          <p className="mt-2 text-lg font-semibold text-white">{shelf.name}</p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-300">Loading share details...</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shelf ID</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all text-sm text-white">{shareInfo?.shelfId || shelf.id}</code>
                <button
                  onClick={() => copyValue('shelfId', shareInfo?.shelfId || shelf.id)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                >
                  {copiedField === 'shelfId' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Join Code</p>
                  <p className="mt-1 text-xs text-slate-400">This code works once, then expires.</p>
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {regenerating ? 'Generating...' : 'Generate New'}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 break-all text-lg font-semibold tracking-[0.3em] text-white">{shareInfo?.joinCode || '--------'}</code>
                <button
                  onClick={() => shareInfo?.joinCode && copyValue('joinCode', shareInfo.joinCode)}
                  disabled={!shareInfo?.joinCode}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

window.ShareShelfModal = ShareShelfModal;
