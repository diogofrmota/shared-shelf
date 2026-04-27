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
        if (active) setShareInfo(nextShareInfo);
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load share details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadShareInfo();
    return () => { active = false; };
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
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[#E1D8D4] bg-white p-6 shadow-2xl shadow-[#410001]/30" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#410001]">Share shelf</h2>
            <p className="mt-1 text-sm text-[#534340]">
              Share this shelf ID and one-time code so someone else can join.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            aria-label="Close share modal"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Shelf</p>
          <p className="mt-1 text-lg font-extrabold text-[#410001]">{shelf.name}</p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm font-medium text-[#534340]">Loading share details...</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Shelf ID</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 break-all text-sm font-bold text-[#241A18]">{shareInfo?.shelfId || shelf.id}</code>
                <button
                  onClick={() => copyValue('shelfId', shareInfo?.shelfId || shelf.id)}
                  className="rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                >
                  {copiedField === 'shelfId' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Join code</p>
                  <p className="mt-1 text-xs text-[#534340]">This code works once, then expires.</p>
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="rounded-lg bg-[#E63B2E] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-50"
                >
                  {regenerating ? 'Generating...' : 'New code'}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 break-all text-lg font-extrabold tracking-[0.25em] text-[#241A18]">{shareInfo?.joinCode || '--------'}</code>
                <button
                  onClick={() => shareInfo?.joinCode && copyValue('joinCode', shareInfo.joinCode)}
                  disabled={!shareInfo?.joinCode}
                  className="rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5] disabled:opacity-50"
                >
                  {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {error && <p className="text-sm font-semibold text-[#C1121F]">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

window.ShareShelfModal = ShareShelfModal;
