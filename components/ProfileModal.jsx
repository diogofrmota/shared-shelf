const React = window.React;
const { useState, useEffect } = React;
const {
  UserIcon,
  Close,
  LogoutIcon,
  updateAccount,
  changePassword,
  changeEmail,
  checkUsernameAvailable
} = window;

// ============================================================================
// PROFILE / SETTINGS / ACCOUNT MODAL
// ============================================================================

const AVATAR_COLORS = ['#E63B2E', '#A9372C', '#8C4F45', '#FFB4A9', '#FBD08A', '#A7C957'];

const PROFILE_SECTION_OPTIONS = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'locations', label: 'Locations' },
  { id: 'trips', label: 'Trips' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'watchlist', label: 'Watchlist' }
];

const getAvatarTextColor = (backgroundColor) => {
  if (!backgroundColor || !/^#([0-9a-f]{6})$/i.test(backgroundColor)) {
    return '#ffffff';
  }
  const hex = backgroundColor.slice(1);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? '#241A18' : '#FFFFFF';
};

const UserAvatar = ({ user, size = 40 }) => {
  const initials = (user.name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const color = user.color || AVATAR_COLORS[0];
  const [imgError, setImgError] = useState(false);
  const safeAvatar = window.safeImageUrl?.(user.avatar) || '';

  if (safeAvatar && !imgError) {
    return (
      <img
        src={safeAvatar}
        alt={user.name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size, minWidth: size }}
        className="flex-shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        background: color,
        color: getAvatarTextColor(color)
      }}
      className="flex flex-shrink-0 items-center justify-center rounded-full border-2 border-white font-bold shadow-sm"
    >
      <span style={{ fontSize: Math.max(10, size * 0.35) }}>{initials}</span>
    </div>
  );
};

const inputCls = "min-h-[44px] w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2.5 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wide text-[#534340]";

const ProfileModal = ({ mode = 'profiles', isOpen, onClose, profile, onSave, space, onSaveSpace, currentUser, onSaveAccount, onLogout, onLeaveSpace }) => {
  const sectionOptions = PROFILE_SECTION_OPTIONS;
  const [users, setUsers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [name, setName] = useState(space?.name || '');
  const [selectedSections, setSelectedSections] = useState(sectionOptions.map(section => section.id));
  const [shareInfo, setShareInfo] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [regeneratingShare, setRegeneratingShare] = useState(false);
  const [accountEditing, setAccountEditing] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [accountUsername, setAccountUsername] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);
  const [confirmRegenerateShare, setConfirmRegenerateShare] = useState(false);
  const [confirmLeaveSpace, setConfirmLeaveSpace] = useState(false);
  const [leavingSpace, setLeavingSpace] = useState(false);

  // Change-password sub-flow
  const [pwSection, setPwSection] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Change-email sub-flow
  const [emailSection, setEmailSection] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  // Username availability in edit mode
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const usernameCheckRef = React.useRef(null);

  useEffect(() => {
    if (mode === 'profiles' && isOpen) {
      setUsers((profile?.users || []).map(u => ({ ...u })));
      setExpandedId(null);
    }
  }, [mode, isOpen, profile?.users]);

  useEffect(() => {
    if (mode === 'settings' && isOpen) {
      setName(space?.name || '');
      setSelectedSections(Array.isArray(space?.enabledSections) && space.enabledSections.length ? space.enabledSections : sectionOptions.map(section => section.id));
      setShareInfo(null);
      setShareError('');
      setCopiedField('');
      setConfirmRegenerateShare(false);
      setConfirmLeaveSpace(false);
      setLeavingSpace(false);
    }
  }, [mode, isOpen, space]);

  useEffect(() => {
    if (mode === 'account' && isOpen) {
      setAccountEditing(true);
      setAccountName(currentUser?.name || currentUser?.username || currentUser?.email || '');
      setAccountUsername(currentUser?.username || '');
      setAccountError('');
      setPwSection(false);
      setPwCurrent('');
      setPwNew('');
      setPwError('');
      setPwSuccess('');
      setEmailSection(false);
      setNewEmail('');
      setEmailError('');
      setEmailSuccess('');
      setUsernameStatus(null);
      setConfirmLeaveSpace(false);
      setLeavingSpace(false);
    }
    // Intentionally only re-runs when modal opens or user identity changes,
    // so that in-progress edits to name/username are not clobbered by parent re-renders.
  }, [mode, isOpen, currentUser?.id]);

  useEffect(() => () => {
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
  }, []);

  useEffect(() => {
    if (mode !== 'settings' || !isOpen || !space?.id) return;

    let active = true;

    const loadShareInfo = async () => {
      setShareLoading(true);
      setShareError('');

      try {
        const nextShareInfo = await getSpaceShareInfo(space.id);
        if (active) setShareInfo(nextShareInfo);
      } catch (err) {
        if (active) setShareError(err?.message || 'Failed to load share details');
      } finally {
        if (active) setShareLoading(false);
      }
    };

    loadShareInfo();
    return () => { active = false; };
  }, [mode, isOpen, space?.id]);

  if (!isOpen) return null;

  // ---------- PROFILES MODE ----------
  if (mode === 'profiles') {
    const updateUser = (id, field, value) =>
      setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));

    const addUser = () => {
      const newId = `user-${Date.now()}`;
      const usedColors = users.map(u => u.color).filter(Boolean);
      const color = AVATAR_COLORS.find(c => !usedColors.includes(c)) || AVATAR_COLORS[users.length % AVATAR_COLORS.length];
      setUsers(prev => [...prev, { id: newId, name: '', avatar: '', color }]);
    };

    const removeUser = (id) => {
      if (users.length <= 1) return;
      setUsers(prev => prev.filter(u => u.id !== id));
    };

    const handleSave = () => {
      const valid = users.filter(u => u.name.trim());
      if (valid.length === 0) return;
      onSave({ users: valid });
      onClose();
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
          <div className="sticky top-0 z-10 border-b border-[#E1D8D4] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#410001]">
                  <UserIcon size={20} className="text-[#E63B2E]" />
                  Profiles
                </h2>
                <p className="mt-0.5 text-xs text-[#534340]">Manage who uses this shared space.</p>
              </div>
              <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close profiles">
                <Close size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-3 p-5">
            {users.map((user, index) => (
              <div key={user.id} className="rounded-2xl border border-[#E1D8D4] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <UserAvatar user={user} size={48} />
                    <button
                      onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                      className="absolute -bottom-3 -right-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#E63B2E] text-white shadow transition hover:bg-[#A9372C]"
                      title="Customize"
                    >
                      <Camera size={10} />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <label className={labelCls}>Person {index + 1}</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => updateUser(user.id, 'name', e.target.value)}
                      placeholder="Enter name…"
                      className={inputCls}
                    />
                  </div>

                  {users.length > 1 && (
                    <button
                      onClick={() => removeUser(user.id)}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
                      title="Remove"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                </div>

                {expandedId === user.id && (
                  <div className="mt-3 space-y-3 border-t border-[#E1D8D4] pt-3">
                    <div>
                      <label className={labelCls}>Avatar URL (optional)</label>
                      <input
                        type="url"
                        value={user.avatar || ''}
                        onChange={(e) => updateUser(user.id, 'avatar', e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Color</label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateUser(user.id, 'color', color)}
                            style={{ background: color }}
                            className={`h-11 w-11 rounded-full transition ${user.color === color ? 'ring-2 ring-[#E63B2E] ring-offset-2 ring-offset-white scale-110' : 'hover:scale-105'}`}
                            aria-label={`Choose color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addUser}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E1D8D4] py-3 text-sm font-bold text-[#534340] transition hover:border-[#E63B2E] hover:text-[#E63B2E]"
            >
              <Plus size={16} />
              Add another person
            </button>
          </div>

          <div className="flex gap-3 border-t border-[#E1D8D4] bg-white p-5">
            <button onClick={onClose} className="min-h-[44px] flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
              Save profiles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- SETTINGS MODE (space name & share) ----------
  if (mode === 'settings') {
    const handleSave = () => {
      onSaveSpace({ name: name.trim() || space?.name || 'Our Space', enabledSections: selectedSections });
      onClose();
    };

    const toggleSection = (sectionId) => {
      setSelectedSections(prev => {
        if (prev.includes(sectionId)) {
          const next = prev.filter(id => id !== sectionId);
          return next.length ? next : prev;
        }
        return [...prev, sectionId];
      });
    };

    const copyValue = async (label, value) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        setCopiedField(label);
        window.setTimeout(() => setCopiedField(''), 1500);
      } catch {
        setCopiedField('');
      }
    };

    const handleRegenerate = async () => {
      if (!space?.id) return;
      setRegeneratingShare(true);
      setShareError('');
      try {
        const nextShareInfo = await regenerateSpaceJoinCode(space.id);
        setShareInfo(nextShareInfo);
      } catch (err) {
        setShareError(err?.message || 'Failed to generate a new code');
      } finally {
        setRegeneratingShare(false);
      }
    };

    const spaceId = shareInfo?.spaceId || space?.id || '';
    const joinCode = shareInfo?.joinCode || '';

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#410001]">
              <SettingsIcon size={20} className="text-[#E63B2E]" />
              Space settings
            </h2>
            <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close settings">
              <Close size={20} />
            </button>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <label className={labelCls} htmlFor="space-name">Space name</label>
              <input
                id="space-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Our space name"
                className={inputCls}
              />
            </div>

            <div>
              <p className={labelCls}>Shared items</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sectionOptions.map(section => (
                  <label key={section.id} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]">
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

            <div className="rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4">
              <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#410001]">Share space</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Share this space ID and one-time code so someone else can join.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRegenerateShare(true)}
                  disabled={regeneratingShare || shareLoading}
                  className="min-h-[44px] rounded-lg bg-[#E63B2E] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                >
                  {regeneratingShare ? 'Generating...' : 'New code'}
                </button>
              </div>

              {shareLoading ? (
                <p className="py-6 text-center text-sm font-medium text-[#534340]">Loading share details...</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Space ID</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="flex-1 break-all text-sm font-bold text-[#241A18]">{spaceId}</code>
                      <button
                        type="button"
                        onClick={() => copyValue('spaceId', spaceId)}
                        className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                      >
                        {copiedField === 'spaceId' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Join code</p>
                    <p className="mt-1 text-xs text-[#534340]">This code works once, then expires.</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="flex-1 break-all text-lg font-extrabold tracking-[0.25em] text-[#241A18]">{joinCode || '--------'}</code>
                      <button
                        type="button"
                        onClick={() => copyValue('joinCode', joinCode)}
                        disabled={!joinCode}
                        className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5] disabled:opacity-50"
                      >
                        {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {shareError && <p className="mt-3 text-sm font-semibold text-[#C1121F]">{shareError}</p>}
            </div>

            {onLeaveSpace && (
              <div className="rounded-2xl border border-[#E1D8D4] bg-white p-4">
                <h3 className="text-base font-extrabold text-[#410001]">Shared space access</h3>
                <p className="mt-1 text-sm text-[#534340]">
                  Leave this shared space and return to your space selection.
                </p>
                {confirmLeaveSpace ? (
                  <div className="mt-4 rounded-xl border border-[#FFDAD4] bg-[#FFF8F5] p-3">
                    <p className="text-sm font-bold text-[#410001]">Leave shared space?</p>
                    <p className="mt-1 text-xs leading-5 text-[#534340]">
                      You will be removed from this space. If no other members remain, the space and its data are deleted.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmLeaveSpace(false)}
                        disabled={leavingSpace}
                        className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5] disabled:opacity-60"
                      >
                        Stay
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!onLeaveSpace) return;
                          setLeavingSpace(true);
                          try {
                            await onLeaveSpace();
                            onClose();
                          } finally {
                            setLeavingSpace(false);
                          }
                        }}
                        disabled={leavingSpace}
                        className="min-h-[44px] rounded-lg bg-[#C1121F] px-3 text-sm font-bold text-white transition hover:bg-[#A80F1A] disabled:opacity-60"
                      >
                        {leavingSpace ? 'Leaving...' : 'Leave space'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmLeaveSpace(true)}
                    disabled={leavingSpace}
                    className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-3 py-2.5 text-sm font-bold text-[#534340] transition hover:bg-[#FFDAD4] hover:text-[#C1121F] disabled:opacity-60"
                  >
                    {leavingSpace ? 'Leaving...' : 'Leave shared space'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3 border-t border-[#E1D8D4] bg-white p-5">
            <button onClick={onClose} className="min-h-[44px] flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">
              Cancel
            </button>
            <button onClick={handleSave} className="min-h-[44px] flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
              Save changes
            </button>
          </div>
          <ConfirmationDialog
            isOpen={confirmRegenerateShare}
            title="Generate new join code?"
            message="The current join code will stop working. Anyone you invite will need the new code."
            confirmLabel="Generate code"
            cancelLabel="Keep current code"
            tone="primary"
            onConfirm={() => {
              setConfirmRegenerateShare(false);
              handleRegenerate();
            }}
            onCancel={() => setConfirmRegenerateShare(false)}
          />
        </div>
      </div>
    );
  }

  // ---------- ACCOUNT MODE ----------
  if (mode === 'account') {
    const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
    const username = currentUser?.username || 'User';
    const initials = displayName.trim().charAt(0).toUpperCase();

    const validateProfileName = (v) => {
      const t = v.trim();
      if (!t) return 'Name is required';
      if (t.length > 20) return 'Name must be 20 characters or fewer';
      if (!/^[A-Za-z ]+$/.test(t)) return 'Name can only contain letters and spaces';
      return '';
    };

    const validateProfileUsername = (v) => {
      const t = v.trim();
      if (!t) return 'Username is required';
      if (t.length > 20) return 'Username must be 20 characters or fewer';
      if (!/^[A-Za-z0-9]+$/.test(t)) return 'Username can only contain letters and numbers';
      return '';
    };

    const validatePasswordValue = (v) => {
      const letters = (v.match(/[A-Za-z]/g) || []).length;
      if (letters < 5) return 'Password must include at least 5 letters';
      if (!/\d/.test(v)) return 'Password must include at least 1 number';
      return '';
    };

    const handleUsernameChange = (value) => {
      setAccountUsername(value);
      const trimmed = value.trim();
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
      if (!trimmed || !/^[A-Za-z0-9]+$/.test(trimmed) || trimmed.length > 20) {
        setUsernameStatus(null);
        return;
      }
      if (trimmed.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
        setUsernameStatus(null);
        return;
      }
      setUsernameStatus('checking');
      usernameCheckRef.current = setTimeout(async () => {
        try {
          const result = await checkUsernameAvailable(trimmed, currentUser?.id);
          if (!result || result.available == null) { setUsernameStatus(null); return; }
          setUsernameStatus(result.available ? 'available' : 'taken');
        } catch {
          setUsernameStatus(null);
        }
      }, 450);
    };

    const handleAccountSave = async (event) => {
      event?.preventDefault?.();
      const nextName = accountName.trim();
      const nextUsername = accountUsername.trim();

      const nameErr = validateProfileName(nextName);
      if (nameErr) { setAccountError(nameErr); return; }
      const usernameErr = validateProfileUsername(nextUsername);
      if (usernameErr) { setAccountError(usernameErr); return; }
      if (usernameStatus === 'taken') { setAccountError('Username already taken'); return; }

      setAccountSaving(true);
      setAccountError('');

      try {
        const updatedUser = await updateAccount({ name: nextName, username: nextUsername });
        onSaveAccount?.(updatedUser);
        setAccountEditing(false);
        setPwSection(false);
        setEmailSection(false);
        setUsernameStatus(null);
        onClose?.();
      } catch (err) {
        setAccountError(err.message || 'Failed to update profile');
      } finally {
        setAccountSaving(false);
      }
    };

    const handleChangePassword = async (event) => {
      event.preventDefault();
      setPwError('');
      setPwSuccess('');

      if (!pwCurrent) { setPwError('Current password is required'); return; }
      const pwErr = validatePasswordValue(pwNew);
      if (pwErr) { setPwError(pwErr); return; }

      setPwSaving(true);
      try {
        const result = await changePassword(pwCurrent, pwNew);
        setPwSuccess(result.message || 'Password updated successfully');
        setPwCurrent('');
        setPwNew('');
      } catch (err) {
        setPwError(err.message || 'Failed to change password');
      } finally {
        setPwSaving(false);
      }
    };

    const handleChangeEmail = async (event) => {
      event.preventDefault();
      setEmailError('');
      setEmailSuccess('');

      const trimmedEmail = newEmail.trim();
      if (!trimmedEmail) { setEmailError('Email is required'); return; }
      if (!trimmedEmail.includes('@')) { setEmailError('Email must include @'); return; }

      setEmailSaving(true);
      try {
        const result = await changeEmail(trimmedEmail);
        setEmailSuccess(result.message || `Confirmation sent to ${trimmedEmail}`);
        setNewEmail('');
      } catch (err) {
        setEmailError(err.message || 'Failed to initiate email change');
      } finally {
        setEmailSaving(false);
      }
    };

    const resetAccountEdit = () => {
      setAccountEditing(false);
      setAccountName(displayName);
      setAccountUsername(username);
      setAccountError('');
      setUsernameStatus(null);
      setPwSection(false);
      setPwCurrent('');
      setPwNew('');
      setPwError('');
      setPwSuccess('');
      setEmailSection(false);
      setNewEmail('');
      setEmailError('');
      setEmailSuccess('');
      onClose?.();
    };

    const accountShell = (content) => (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
          <div className="sticky top-0 z-10 border-b border-[#E1D8D4] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#410001]">
                <UserIcon size={20} className="text-[#E63B2E]" />
                Profile
              </h2>
              <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close profile">
                <Close size={20} />
              </button>
            </div>
          </div>
          {content}
        </div>
      </div>
    );

    if (accountEditing) {
      return accountShell(
        <div className="space-y-4 p-5">
          <div>
            <label className={labelCls} htmlFor="account-name">Name</label>
            <input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              className={inputCls}
              autoComplete="name"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="account-username">Username</label>
            <input
              id="account-username"
              type="text"
              value={accountUsername}
              onChange={(event) => handleUsernameChange(event.target.value)}
              className={inputCls}
              autoComplete="username"
              spellCheck={false}
            />
            {usernameStatus === 'checking'
              ? <p className="mt-1 text-xs text-[#857370]">Checking availability...</p>
              : usernameStatus === 'available'
                ? <p className="mt-1 text-xs font-semibold text-[#2F855A]">Username is available</p>
                : usernameStatus === 'taken'
                  ? <p className="mt-1 text-xs font-semibold text-[#C1121F]">Username already taken</p>
                  : null}
          </div>
          <div>
            <label className={labelCls} htmlFor="account-email">Email</label>
            <input
              id="account-email"
              type="email"
              value={currentUser?.email || ''}
              className={`${inputCls} text-[#534340]`}
              autoComplete="email"
              readOnly
            />
          </div>

          <div className="rounded-xl border border-[#E1D8D4]">
            <button
              type="button"
              onClick={() => { setPwSection(prev => !prev); setPwError(''); setPwSuccess(''); setPwCurrent(''); setPwNew(''); setEmailSection(false); }}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
            >
              <span>Change password</span>
              <span className="text-[#857370]" aria-hidden="true">{pwSection ? '▲' : '▼'}</span>
            </button>
            {pwSection && (
              <form className="space-y-3 border-t border-[#E1D8D4] px-3 pb-3 pt-3" onSubmit={handleChangePassword}>
                <div>
                  <label className={labelCls} htmlFor="pw-current">Current password</label>
                  <input
                    id="pw-current"
                    type="password"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    className={inputCls}
                    autoComplete="current-password"
                    placeholder="Current password"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="pw-new">New password</label>
                  <input
                    id="pw-new"
                    type="password"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    className={inputCls}
                    autoComplete="new-password"
                    placeholder="New password"
                  />
                  <p className="mt-1 text-xs text-[#857370]">At least 5 letters and 1 number</p>
                </div>
                {pwError && <p className="text-sm font-semibold text-[#C1121F]" role="alert">{pwError}</p>}
                {pwSuccess && <p className="text-sm font-semibold text-[#2F855A]" role="status">{pwSuccess}</p>}
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-60"
                >
                  {pwSaving ? 'Updating...' : 'Update password'}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-xl border border-[#E1D8D4]">
            <button
              type="button"
              onClick={() => { setEmailSection(prev => !prev); setEmailError(''); setEmailSuccess(''); setNewEmail(''); setPwSection(false); }}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
            >
              <span>Change email</span>
              <span className="text-[#857370]" aria-hidden="true">{emailSection ? '^' : 'v'}</span>
            </button>
            {emailSection && (
              <form className="space-y-3 border-t border-[#E1D8D4] px-3 pb-3 pt-3" onSubmit={handleChangeEmail}>
                <div>
                  <label className={labelCls} htmlFor="new-email">New email address</label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputCls}
                    autoComplete="email"
                    placeholder="you@example.com"
                    spellCheck={false}
                  />
                  <p className="mt-1 text-xs text-[#857370]">A confirmation link will be sent to the new address.</p>
                </div>
                {emailError && <p className="text-sm font-semibold text-[#C1121F]" role="alert">{emailError}</p>}
                {emailSuccess && <p className="text-sm font-semibold text-[#2F855A]" role="status">{emailSuccess}</p>}
                {!emailSuccess && (
                  <button
                    type="submit"
                    disabled={emailSaving}
                    className="min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-60"
                  >
                    {emailSaving ? 'Sending...' : 'Send confirmation'}
                  </button>
                )}
              </form>
            )}
          </div>

          {accountError && <p className="text-sm font-semibold text-[#C1121F]" role="alert">{accountError}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={resetAccountEdit}
              className="min-h-[44px] flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
              disabled={accountSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAccountSave}
              className="min-h-[44px] flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-60"
              disabled={accountSaving || usernameStatus === 'taken' || usernameStatus === 'checking'}
            >
              {accountSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      );
    }

    return accountShell(
      <div>
        <div className="border-b border-[#E1D8D4] bg-[#FFF8F5] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#E63B2E]">Signed in as</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-sm font-extrabold text-white shadow-sm">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#410001]" title={displayName}>{displayName}</p>
              <p className="truncate text-xs font-semibold text-[#534340]" title={username}>{username}</p>
              {currentUser?.email && <p className="truncate text-xs text-[#534340]" title={currentUser.email}>{currentUser.email}</p>}
            </div>
          </div>
        </div>
        <div className="p-2">
          <button
            type="button"
            onClick={() => {
              setAccountEditing(true);
              setAccountName(displayName);
              setAccountUsername(username);
              setAccountError('');
              setUsernameStatus(null);
              setPwSection(false);
              setEmailSection(false);
            }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
          >
            <UserIcon size={18} />
            Edit profile
          </button>
          <button
            type="button"
            onClick={() => { onLogout?.(); onClose?.(); }}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#410001] transition hover:bg-[#FFF8F5]"
          >
            <LogoutIcon size={16} />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return null;
};

Object.assign(window, { AVATAR_COLORS, UserAvatar, ProfileModal });
