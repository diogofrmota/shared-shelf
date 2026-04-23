const React = window.React;

// ============================================================================
// HEADER COMPONENT
// ============================================================================

const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto">
    {tabs.map(tab => {
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base rounded-t-xl transition-all duration-300 whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-slate-900/50 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Icon size={16} />
          {tab.label}
        </button>
      );
    })}
  </div>
);

const formatLastSynced = (ts) => {
  if (!ts) return null;
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const Header = ({
  activeTab,
  onTabChange,
  onGlobalAddClick,
  onProfileClick,
  onLogout,
  tabs,
  profile,
  lastSynced,
  isOnline,
  showMediaActions = true
}) => {
  const users = profile?.users || [];
  const syncLabel = isOnline
    ? (lastSynced ? `Synced ${formatLastSynced(lastSynced)}` : 'Online')
    : 'Offline';

  return (
    <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Shared Shelf</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
              <span className="text-xs text-slate-500">{syncLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onProfileClick}
              className="flex-none px-2.5 py-2 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition-all duration-200 border border-slate-700 hover:border-purple-500/50 flex items-center gap-2"
              title="Edit profiles"
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
              <span className="hidden sm:inline text-slate-300 text-sm font-medium">Profile</span>
            </button>

            {showMediaActions && (
              <button
                onClick={onGlobalAddClick}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 text-sm shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105"
                title="Add new item"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex-none px-2.5 sm:px-4 py-2.5 bg-slate-700/30 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 text-sm border border-slate-700 hover:border-red-500"
                title="Logout"
              >
                <LogoutIcon size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </div>
  );
};

const getDefaultTabs = () => [
  { id: TAB_CONFIG.TASKS.id,    label: TAB_CONFIG.TASKS.label,    icon: CheckSquare },
  { id: TAB_CONFIG.CALENDAR.id, label: TAB_CONFIG.CALENDAR.label, icon: CalendarIcon },
  { id: TAB_CONFIG.DATES.id,    label: TAB_CONFIG.DATES.label,    icon: Utensils },
  { id: TAB_CONFIG.TRIPS.id,    label: TAB_CONFIG.TRIPS.label,    icon: MapPin },
  { id: TAB_CONFIG.RECIPES.id,  label: TAB_CONFIG.RECIPES.label,  icon: ChefHat },
  { id: TAB_CONFIG.TV_SHOWS.id, label: TAB_CONFIG.TV_SHOWS.label, icon: Tv },
  { id: TAB_CONFIG.MOVIES.id,   label: TAB_CONFIG.MOVIES.label,   icon: Film },
  { id: TAB_CONFIG.BOOKS.id,    label: TAB_CONFIG.BOOKS.label,    icon: Book }
];

Object.assign(window, { Header, getDefaultTabs });
