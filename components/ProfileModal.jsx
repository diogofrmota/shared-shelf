const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// PROFILE / SETTINGS / ACCOUNT MODAL
// ============================================================================

const AVATAR_COLORS = ['#031A6B', '#033860', '#087CA7', '#004385', '#05B2DC'];

const getAvatarTextColor = (backgroundColor) => {
  if (!backgroundColor || !/^#([0-9a-f]{6})$/i.test(backgroundColor)) {
    return '#ffffff';
  }

  const hex = backgroundColor.slice(1);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 150 ? '#000000' : '#FFFFFF';
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
        className="rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
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
      className="rounded-full flex items-center justify-center font-bold border-2 border-slate-600 flex-shrink-0"
    >
      <span style={{ fontSize: Math.max(10, size * 0.35) }}>{initials}</span>
    </div>
  );
};

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

    return () => {
      active = false;
    };
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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserIcon size={20} className="text-purple-400" />
                  Profiles
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Manage who uses this shared shelf</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Close size={20} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {users.map((user, index) => (
              <div key={user.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <UserAvatar user={user} size={52} />
                    <button
                      onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
                      title="Change avatar"
                    >
                      <Camera size={10} className="text-white" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-slate-400 mb-1">User {index + 1}</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => updateUser(user.id, 'name', e.target.value)}
                      placeholder="Enter name…"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                    />
                  </div>

                  {users.length > 1 && (
                    <button
                      onClick={() => removeUser(user.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-slate-500 hover:text-red-400 flex-shrink-0"
                      title="Remove"
                    >
                      <Trash size={15} />
                    </button>
                  )}
                </div>

                {expandedId === user.id && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Avatar URL (optional)</label>
                      <input
                        type="url"
                        value={user.avatar || ''}
                        onChange={(e) => updateUser(user.id, 'avatar', e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
                      <div className="flex gap-2 flex-wrap">
                        {AVATAR_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateUser(user.id, 'color', color)}
                            style={{ background: color }}
                            className={`w-7 h-7 rounded-full transition-all ${user.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-105'}`}
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
              className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-purple-500 text-slate-400 hover:text-purple-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus size={16} />
              Add Another Person
            </button>
          </div>

          <div className="px-5 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors text-sm">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors text-sm shadow-lg shadow-purple-900/30">
              Save Profiles
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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/30">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#031A6B]">
                <SettingsIcon size={20} />
                Shelf Settings
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[#031A6B] transition-colors hover:bg-[#EAF8FC]">
                <Close size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <label className="mb-1 block text-sm font-bold text-[#031A6B]">Shelf Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Our Shared Shelf"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-black outline-none transition focus:border-[#031A6B]"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-[#031A6B]">Shared Items</p>
              <div className="grid grid-cols-2 gap-2">
                {sectionOptions.map(section => (
                  <label key={section.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-black">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={() => toggleSection(section.id)}
                      className="accent-[#031A6B]"
                    />
                    <span>{section.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#EAF8FC] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#031A6B]">Share Shelf</h3>
                  <p className="mt-1 text-sm text-black/70">
                    Share this shelf ID and one-time code so someone else can join.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regeneratingShare || shareLoading}
                  className="rounded-xl bg-[#031A6B] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#033860] disabled:opacity-60"
                >
                  {regeneratingShare ? 'Generating...' : 'Generate New'}
                </button>
              </div>

              {shareLoading ? (
                <p className="py-6 text-center text-sm font-medium text-[#031A6B]">Loading share details...</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#031A6B]">Shelf ID</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 break-all text-sm font-semibold text-black">{shelfId}</code>
                      <button
                        type="button"
                        onClick={() => copyValue('shelfId', shelfId)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-[#031A6B] transition hover:bg-[#EAF8FC]"
                      >
                        {copiedField === 'shelfId' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#031A6B]">Join Code</p>
                    <p className="mt-1 text-xs text-black/60">This code works once, then expires.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 break-all text-lg font-bold tracking-[0.25em] text-black">{joinCode || '--------'}</code>
                      <button
                        type="button"
                        onClick={() => copyValue('joinCode', joinCode)}
                        disabled={!joinCode}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-[#031A6B] transition hover:bg-[#EAF8FC] disabled:opacity-50"
                      >
                        {copiedField === 'joinCode' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {shareError && <p className="mt-3 text-sm font-semibold text-[#c1121f]">{shareError}</p>}
            </div>
          </div>
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onClose} className="flex-1 rounded-xl bg-[#ced4da] py-3 text-sm font-bold text-[#1f2937] transition hover:bg-[#adb5bd]">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 rounded-xl bg-[#031A6B] py-3 text-sm font-bold text-white transition hover:bg-[#033860]">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ACCOUNT MODE (user info & logout) ----------
  if (mode === 'account') {
    const displayName = currentUser?.name || currentUser?.username || currentUser?.email || 'User';
    const username = currentUser?.username || 'User';

    const handleAccountSave = async (event) => {
      event.preventDefault();
      const nextName = accountName.trim();
      const nextUsername = accountUsername.trim();

      if (!nextName) {
        setAccountError('Name is required');
        return;
      }
      if (nextName.length > 20) {
        setAccountError('Name must be 20 characters or fewer');
        return;
      }
      if (!/^[A-Za-z ]+$/.test(nextName)) {
        setAccountError('Name can only contain letters and spaces');
        return;
      }
      if (!nextUsername) {
        setAccountError('Username is required');
        return;
      }
      if (nextUsername.length > 20) {
        setAccountError('Username must be 20 characters or fewer');
        return;
      }
      if (!/^[A-Za-z0-9]+$/.test(nextUsername)) {
        setAccountError('Username can only contain letters and numbers');
        return;
      }

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
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/30">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#031A6B]">
                <UserIcon size={20} />
                Profile
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 text-[#031A6B] transition-colors hover:bg-[#EAF8FC]">
                <Close size={20} />
              </button>
            </div>
          </div>
          <div className="p-5">
            {accountEditing ? (
              <form className="space-y-4 text-left text-sm" onSubmit={handleAccountSave}>
                <div>
                  <label className="mb-1 block font-bold text-[#031A6B]" htmlFor="account-name">Name</label>
                  <input
                    id="account-name"
                    type="text"
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-black outline-none transition focus:border-[#031A6B]"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-[#031A6B]" htmlFor="account-username">Username</label>
                  <input
                    id="account-username"
                    type="text"
                    value={accountUsername}
                    onChange={(event) => setAccountUsername(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-black outline-none transition focus:border-[#031A6B]"
                    autoComplete="username"
                  />
                </div>
                <div>
                  <p className="font-bold text-[#031A6B]">Email:</p>
                  <p className="break-words font-medium text-black">{currentUser?.email || 'No email available'}</p>
                </div>
                {accountError && <p className="text-sm font-semibold text-[#c1121f]">{accountError}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountEditing(false);
                      setAccountName(displayName);
                      setAccountUsername(username);
                      setAccountError('');
                    }}
                    className="flex-1 rounded-xl bg-[#ced4da] px-3 py-3 text-sm font-bold text-[#1f2937] transition hover:bg-[#adb5bd]"
                    disabled={accountSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[#031A6B] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#033860] disabled:opacity-60"
                    disabled={accountSaving}
                  >
                    {accountSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-3 text-left text-sm">
                  <div>
                    <p className="font-bold text-[#031A6B]">Name:</p>
                    <p className="break-words font-medium text-black">{displayName}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#031A6B]">Username:</p>
                    <p className="break-words font-medium text-black">{username}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#031A6B]">Email:</p>
                    <p className="break-words font-medium text-black">{currentUser?.email || 'No email available'}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountEditing(true)}
                    className="w-full rounded-xl bg-[#031A6B] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#033860]"
                  >
                    Edit Information
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onBackToShelves?.();
                      onClose();
                    }}
                    className="w-full rounded-xl bg-[#EAF8FC] px-3 py-3 text-sm font-bold text-[#031A6B] transition hover:bg-[#d9f1f8]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="w-full rounded-xl bg-[#ced4da] px-3 py-3 text-sm font-bold text-[#1f2937] transition hover:bg-[#adb5bd]"
                  >
                    Logout
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
