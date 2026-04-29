const React = window.React;
const { useEffect, useRef, useState } = React;

function ShareSpaceModal({ isOpen, onClose, space }) {
  const [shareInfo, setShareInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const copiedTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !space?.id) {
      setShareInfo(null);
      setError('');
      setCopiedField('');
      setConfirmRegenerate(false);
      return;
    }

    let active = true;

    const loadShareInfo = async () => {
      setLoading(true);
      setError('');

      try {
        const nextShareInfo = await window.getSpaceShareInfo?.(space.id);
        if (active) setShareInfo(nextShareInfo);
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load share details');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadShareInfo();
    return () => { active = false; };
  }, [isOpen, space?.id]);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
  }, []);

  if (!isOpen || !space) return null;

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      if (copiedTimeoutRef.current) window.clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = window.setTimeout(() => setCopiedField(''), 1500);
    } catch {
      setCopiedField('');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError('');

    try {
      const nextShareInfo = await window.regenerateSpaceJoinCode?.(space.id);
      setShareInfo(nextShareInfo);
    } catch (err) {
      setError(err?.message || 'Failed to generate a new code');
    } finally {
      setRegenerating(false);
    }
  };
  const ModalShell = window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;
  const CloseIcon = window.getWindowComponent?.('Close', window.MissingIcon) || window.MissingIcon;
  const ConfirmationDialog = window.getWindowComponent?.('ConfirmationDialog', window.MissingComponent) || window.MissingComponent;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[180]"
      ariaLabel="Share space"
      dialogClassName="w-full max-w-md rounded-2xl border border-[#E1D8D4] bg-white p-6 shadow-2xl shadow-[#410001]/30"
    >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#410001]">Share space</h2>
            <p className="mt-1 text-sm text-[#534340]">
              Share this space ID and one-time code so someone else can join.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            aria-label="Close share modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Space</p>
          <p className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-[#410001]" title={space.name}>{space.name}</p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm font-medium text-[#534340]">Loading share details...</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Space ID</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 break-all text-sm font-bold text-[#241A18]">{shareInfo?.spaceId || space.id}</code>
                <button
                  onClick={() => copyValue('spaceId', shareInfo?.spaceId || space.id)}
                  className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                >
                  {copiedField === 'spaceId' ? 'Copied' : 'Copy'}
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
                  onClick={() => setConfirmRegenerate(true)}
                  disabled={regenerating}
                  className="min-h-[44px] rounded-lg bg-[#E63B2E] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#CC302F] disabled:opacity-50"
                >
                  {regenerating ? 'Generating...' : 'New code'}
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="flex-1 break-all text-lg font-extrabold tracking-[0.25em] text-[#241A18]">{shareInfo?.joinCode || '--------'}</code>
                <button
                  onClick={() => shareInfo?.joinCode && copyValue('joinCode', shareInfo.joinCode)}
                  disabled={!shareInfo?.joinCode}
                  className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5] disabled:opacity-50"
                >
                  {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {error && <p className="text-sm font-semibold text-[#C1121F]">{error}</p>}
          </div>
        )}
        <ConfirmationDialog
          isOpen={confirmRegenerate}
          title="Generate new join code?"
          message="The current join code will stop working. Anyone you invite will need the new code."
          confirmLabel="Generate code"
          cancelLabel="Keep current code"
          tone="primary"
          onConfirm={() => {
            setConfirmRegenerate(false);
            handleRegenerate();
          }}
          onCancel={() => setConfirmRegenerate(false)}
        />
    </ModalShell>
  );
}

window.ShareSpaceModal = ShareSpaceModal;
