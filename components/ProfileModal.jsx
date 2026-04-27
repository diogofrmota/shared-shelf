const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// PROFILE / SETTINGS / ACCOUNT MODAL
// ============================================================================

const AVATAR_COLORS = ['#E63B2E', '#A9372C', '#8C4F45', '#FFB4A9', '#FBD08A', '#A7C957'];

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

  if (user.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
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

const inputCls = "w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";
const labelCls = "mb-1 block text-xs font-bold uppercase tracking-wide text-[#534340]";

const ProfileModal = ({ mode = 'profiles', isOpen, onClose, profile, onSave, shelf, onSaveShelf, currentUser, onSaveAccount, onLogout, onBackToShelves }) => {
  const sectionOptions = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'locations', label: 'Locations' },
    { id: 'trips', label: 'Trips' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'watchlist', label: 'Watchlist' }
  ];
  const [users, setUsers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [name, setName] = useState(shelf?.name || '');
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

  useEffect(() => {
    if (mode === 'profiles' && isOpen) {
      setUsers((profile?.users || []).map(u => ({ ...u })));
      setExpandedId(null);
    }
  }, [mode, isOpen, profile?.users]);

  useEffect(() => {
    if (mode === 'settings' && isOpen) {
      setName(shelf?.name || '');
      setSelectedSections(Array.isArray(shelf?.enabledSections) && shelf.enabledSections.length ? shelf.enabledSections : sectionOptions.map(section => section.id));
      setShareInfo(null);
      setShareError('');
      setCopiedField('');
    }
  }, [mode, isOpen, shelf]);

  useEffect(() => {
    if (mode === 'account' && isOpen) {
      setAccountEditing(false);
      setAccountName(currentUser?.name || currentUser?.username || currentUser?.email || '');
      setAccountUsername(currentUser?.username || '');
      setAccountError('');
    }
  }, [mode, isOpen, currentUser?.id, currentUser?.name, currentUser?.username, currentUser?.email]);

  useEffect(() => {
    if (mode !== 'settings' || !isOpen || !shelf?.id) return;

    let active = true;

    const loadShareInfo = async () => {
      setShareLoading(true);
      setShareError('');

      try {
        const nextShareInfo = await getShelfShareInfo(shelf.id);
        if (active) setShareInfo(nextShareInfo);
      } catch (err) {
        if (active) setShareError(err?.message || 'Failed to load share details');
      } finally {
        if (active) setShareLoading(false);
      }
    };

    loadShareInfo();
    return () => { active = false; };
  }, [mode, isOpen, shelf?.id]);

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
                <p className="mt-0.5 text-xs text-[#534340]">Manage who uses this shared shelf.</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
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
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E63B2E] text-white shadow transition hover:bg-[#A9372C]"
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
                      className="flex-shrink-0 rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
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
                            className={`h-7 w-7 rounded-full transition ${user.color === color ? 'ring-2 ring-[#E63B2E] ring-offset-2 ring-offset-white scale-110' : 'hover:scale-105'}`}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E1D8D4] py-3 text-sm font-bold text-[#534340] transition hover:border-[#E63B2E] hover:text-[#E63B2E]"
            >
              <Plus size={16} />
              Add another person
            </button>
          </div>

          <div className="flex gap-3 border-t border-[#E1D8D4] bg-white p-5">
            <button onClick={onClose} className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">
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

  // ---------- SETTINGS MODE (shelf name & share) ----------
  if (mode === 'settings') {
    const handleSave = () => {
      onSaveShelf({ name: name.trim() || shelf?.name || 'Shared Shelf', enabledSections: selectedSections });
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
      if (!shelf?.id) return;
      setRegeneratingShare(true);
      setShareError('');
      try {
        const nextShareInfo = await regenerateShelfJoinCode(shelf.id);
        setShareInfo(nextShareInfo);
      } catch (err) {
        setShareError(err?.message || 'Failed to generate a new code');
      } finally {
        setRegeneratingShare(false);
      }
    };

    const shelfId = shareInfo?.shelfId || shelf?.id || '';
    const joinCode = shareInfo?.joinCode || '';

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#410001]">
              <SettingsIcon size={20} className="text-[#E63B2E]" />
              Shelf settings
            </h2>
            <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
              <Close size={20} />
            </button>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <label className={labelCls} htmlFor="shelf-name">Shelf name</label>
              <input
                id="shelf-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Our shared shelf"
                className={inputCls}
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

            <div className="rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#410001]">Share shelf</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Share this shelf ID and one-time code so someone else can join.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regeneratingShare || shareLoading}
                  className="rounded-lg bg-[#E63B2E] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#A9372C] disabled:opacity-60"
                >
                  {regeneratingShare ? 'Generating...' : 'New code'}
                </button>
              </div>

              {shareLoading ? (
                <p className="py-6 text-center text-sm font-medium text-[#534340]">Loading share details...</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Shelf ID</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 break-all text-sm font-bold text-[#241A18]">{shelfId}</code>
                      <button
                        type="button"
                        onClick={() => copyValue('shelfId', shelfId)}
                        className="rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5]"
                      >
                        {copiedField === 'shelfId' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E1D8D4] bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Join code</p>
                    <p className="mt-1 text-xs text-[#534340]">This code works once, then expires.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 break-all text-lg font-extrabold tracking-[0.25em] text-[#241A18]">{joinCode || '--------'}</code>
                      <button
                        type="button"
                        onClick={() => copyValue('joinCode', joinCode)}
                        disabled={!joinCode}
                        className="rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#E63B2E] transition hover:bg-[#FFF8F5] disabled:opacity-50"
                      >
                        {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {shareError && <p className="mt-3 text-sm font-semibold text-[#C1121F]">{shareError}</p>}
            </div>
          </div>
          <div className="flex gap-3 border-t border-[#E1D8D4] bg-white p-5">
            <button onClick={onClose} className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
              Save changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ACCOUNT MODE ----------
  if (mode === 'account') {
    const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
    const username = currentUser?.username || 'User';
    const initials = displayName.trim().charAt(0).toUpperCase();

    const handleAccountSave = async (event) => {
      event.preventDefault();
      const nextName = accountName.trim();
      const nextUsername = accountUsername.trim();

      if (!nextName) { setAccountError('Name is required'); return; }
      if (nextName.length > 20) { setAccountError('Name must be 20 characters or fewer'); return; }
      if (!/^[A-Za-z ]+$/.test(nextName)) { setAccountError('Name can only contain letters and spaces'); return; }
      if (!nextUsername) { setAccountError('Username is required'); return; }
      if (nextUsername.length > 20) { setAccountError('Username must be 20 characters or fewer'); return; }
      if (!/^[A-Za-z0-9]+$/.test(nextUsername)) { setAccountError('Username can only contain letters and numbers'); return; }

      setAccountSaving(true);
      setAccountError('');

      try {
        const updatedUser = await updateAccount({ name: nextName, username: nextUsername });
        onSaveAccount?.(updatedUser);
        setAccountEditing(false);
      } catch (err) {
        setAccountError(err.message || 'Failed to update profile');
      } finally {
        setAccountSaving(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
          <div className="border-b border-[#E1D8D4] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#410001]">
                <UserIcon size={20} className="text-[#E63B2E]" />
                Profile
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
                <Close size={20} />
              </button>
            </div>
          </div>
          <div className="p-5">
            {accountEditing ? (
              <form className="space-y-4" onSubmit={handleAccountSave}>
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
                    onChange={(event) => setAccountUsername(event.target.value)}
                    className={inputCls}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <p className={labelCls}>Email</p>
                  <p className="break-words text-sm font-semibold text-[#241A18]">{currentUser?.email || 'No email available'}</p>
                </div>
                {accountError && <p className="text-sm font-semibold text-[#C1121F]">{accountError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountEditing(false);
                      setAccountName(displayName);
                      setAccountUsername(username);
                      setAccountError('');
                    }}
                    className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                    disabled={accountSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:opacity-60"
                    disabled={accountSaving}
                  >
                    {accountSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-4 rounded-2xl bg-[#FFF8F5] p-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E63B2E] text-xl font-extrabold text-white shadow-md">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-[#410001]">{displayName}</p>
                    <p className="truncate text-xs font-medium text-[#534340]">{username}</p>
                    {currentUser?.email && <p className="truncate text-xs text-[#857370]">{currentUser.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setAccountEditing(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E63B2E] px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
                  >
                    Edit profile
                  </button>
                  {onBackToShelves && (
                    <button
                      type="button"
                      onClick={() => { onBackToShelves(); onClose(); }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-3 py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]"
                    >
                      Back to shelves
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { onLogout(); onClose(); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-3 py-2.5 text-sm font-bold text-[#534340] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
                  >
                    <LogoutIcon size={16} />
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

Object.assign(window, { AVATAR_COLORS, UserAvatar, ProfileModal });
