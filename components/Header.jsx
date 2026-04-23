const React = window.React;
const { useState } = React;

// We'll reuse icons that are already defined (Icons.jsx)
// Make sure these are available on window or import them.
// They should already be global from your Icons.jsx file.

const Header = ({
  shelfLogo,
  shelfName,
  onEditShelf,
  activeCategory,
  activeSubTab,
  onCategoryChange,
  onSubTabChange,
  onGlobalAddClick,
  onShareClick,
  onSettingsClick,
  onAccountClick,
  profile,
  isOnline,
  lastSynced,
  onBackToShelves,
  onLogout // still pass through for Account modal
}) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (cat) => {
    setOpenDropdown(prev => (prev === cat ? null : cat));
  };

  const handleSubTabClick = (category, subTab) => {
    onCategoryChange(category, subTab);
    setOpenDropdown(null);
  };

  const formatLastSynced = (ts) => {
    if (!ts) return null;
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const syncLabel = isOnline
    ? (lastSynced ? `Synced ${formatLastSynced(lastSynced)}` : 'Online')
    : 'Offline';

  const users = profile?.users || [];

  return (
    <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
          {/* Left section: logo, name, and the three category buttons */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Shelf Logo – click to edit in settings */}
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 hover:ring-2 hover:ring-purple-500 rounded-full transition"
              title="Edit shelf logo"
            >
              <img
                src={shelfLogo || '/default-shelf-logo.png'}
                alt="Shelf logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-slate-700"
                onError={(e) => { e.target.src = '/default-shelf-logo.png'; }}
              />
            </button>

            {/* Shelf Name – click to edit in shelf settings */}
            <button
              onClick={onSettingsClick}
              className="text-lg sm:text-xl font-bold text-white truncate hover:text-purple-400 transition"
              title="Edit shelf name"
            >
              {shelfName || 'Shared Shelf'}
            </button>

            {shelfName && (
              <button
                onClick={onBackToShelves}
                className="text-slate-400 hover:text-white text-sm ml-1"
                title="Back to shelves"
              >
                ← Shelves
              </button>
            )}

            {/* Category buttons */}
            <div className="flex items-center gap-1 ml-4">
              {/* Plan */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('plan')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    activeCategory === 'plan'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Plan
                </button>
                {openDropdown === 'plan' && (
                  <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 min-w-[140px]">
                    <button
                      onClick={() => handleSubTabClick('plan', 'tasks')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-t-xl ${
                        activeCategory === 'plan' && activeSubTab === 'tasks' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Tasks
                    </button>
                    <button
                      onClick={() => handleSubTabClick('plan', 'calendar')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-b-xl ${
                        activeCategory === 'plan' && activeSubTab === 'calendar' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Calendar
                    </button>
                  </div>
                )}
              </div>

              {/* Go */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('go')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    activeCategory === 'go'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Go
                </button>
                {openDropdown === 'go' && (
                  <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 min-w-[140px]">
                    <button
                      onClick={() => handleSubTabClick('go', 'dates')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-t-xl ${
                        activeCategory === 'go' && activeSubTab === 'dates' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Dates
                    </button>
                    <button
                      onClick={() => handleSubTabClick('go', 'trips')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                        activeCategory === 'go' && activeSubTab === 'trips' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Trips
                    </button>
                    <button
                      onClick={() => handleSubTabClick('go', 'recipes')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-b-xl ${
                        activeCategory === 'go' && activeSubTab === 'recipes' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Recipes
                    </button>
                  </div>
                )}
              </div>

              {/* Media Track */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('media')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    activeCategory === 'media'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Media Track
                </button>
                {openDropdown === 'media' && (
                  <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 min-w-[140px]">
                    <button
                      onClick={() => handleSubTabClick('media', 'tvshows')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-t-xl ${
                        activeCategory === 'media' && activeSubTab === 'tvshows' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      TV Shows
                    </button>
                    <button
                      onClick={() => handleSubTabClick('media', 'movies')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 ${
                        activeCategory === 'media' && activeSubTab === 'movies' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Movies
                    </button>
                    <button
                      onClick={() => handleSubTabClick('media', 'books')}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 rounded-b-xl ${
                        activeCategory === 'media' && activeSubTab === 'books' ? 'text-purple-400' : 'text-slate-300'
                      }`}
                    >
                      Books
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right section: action buttons + user avatar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onGlobalAddClick}
              className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 text-sm shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              onClick={onShareClick}
              className="px-3 py-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition text-slate-300 text-sm font-medium flex items-center gap-1"
              title="Share shelf"
            >
              <ShareIcon size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={onSettingsClick}
              className="px-3 py-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition text-slate-300 text-sm font-medium flex items-center gap-1"
              title="Shelf settings"
            >
              <SettingsIcon size={16} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={onAccountClick}
              className="flex-none px-2.5 py-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition-all duration-200 border border-slate-700 hover:border-purple-500/50 flex items-center gap-2"
              title="Account"
            >
              {users.length > 0 ? (
                <div className="flex -space-x-2 items-center">
                  {users.slice(0, 3).map(u => (
                    <UserAvatar key={u.id} user={u} size={26} />
                  ))}
                </div>
              ) : (
                <UserIcon size={18} className="text-slate-300" />
              )}
              <span className="hidden sm:inline text-slate-300 text-sm font-medium">Account</span>
            </button>
          </div>
        </div>

        {/* Sub‑tab indicator – optional thin strip showing current sub‑tab */}
        <div className="pb-2 flex items-center gap-2 text-xs text-slate-500">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
          <span>{syncLabel}</span>
          {activeCategory && (
            <>
              <span className="text-slate-600">|</span>
              <span className="capitalize">{activeCategory} → {activeSubTab}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Header });