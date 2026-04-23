const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// PROFILE MODAL COMPONENT
// ============================================================================

const AVATAR_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f97316', '#84cc16'];

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
        style={{ width: size, height: size, minWidth: size }}
        className="rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, minWidth: size, background: color }}
      className="rounded-full flex items-center justify-center text-white font-bold border-2 border-slate-600 flex-shrink-0"
    >
      <span style={{ fontSize: Math.max(10, size * 0.35) }}>{initials}</span>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose, profile, onSave }) => {
  const [users, setUsers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setUsers((profile?.users || []).map(u => ({ ...u })));
      setExpandedId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors text-sm shadow-lg shadow-purple-900/30"
          >
            Save Profiles
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { AVATAR_COLORS, UserAvatar, ProfileModal });
