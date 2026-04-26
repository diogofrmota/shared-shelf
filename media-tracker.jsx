const React = window.React;
const { useState, useEffect, useMemo, useRef } = React;

// API base is set globally in index.html
const API_BASE = window.API_BASE_URL ?? '';
const DEFAULT_SHELF_SECTIONS = ['calendar', 'tasks', 'locations', 'trips', 'recipes', 'watchlist'];
const LEGACY_PROFILE_COLOR_MAP = {
  '#c1071e': '#031A6B',
  '#dedede': '#087CA7',
  '#8b5cf6': '#004385',
  '#ec4899': '#05B2DC',
  '#ff6f61': '#087CA7',
  '#2fb7aa': '#05B2DC',
  '#f7b267': '#033860',
  '#7c83fd': '#004385',
  '#ff9f9f': '#05B2DC'
};

const normalizeProfileUsers = (users = []) => users.map((user, index) => ({
  ...user,
  color: LEGACY_PROFILE_COLOR_MAP[user.color] || user.color || (index % 2 === 0 ? '#031A6B' : '#087CA7')
}));

const getEnabledSections = (shelf) => (
  Array.isArray(shelf?.enabledSections) && shelf.enabledSections.length
    ? shelf.enabledSections
    : DEFAULT_SHELF_SECTIONS
);

const sectionToView = (section) => {
  if (section === 'watchlist') return { category: 'media', subTab: 'tvshows' };
  if (section === 'calendar' || section === 'tasks') return { category: 'plan', subTab: section };
  return { category: 'go', subTab: section };
};

const asArray = (value) => Array.isArray(value) ? value : [];

const normalizeMediaCategory = (item = {}, fallbackCategory = '') => {
  const category = String(item.category || fallbackCategory || '').toLowerCase();
  const type = String(item.type || '').toLowerCase();

  if (category === 'books' || type === 'book') return 'books';
  if (category === 'movies' || type === 'movie') return 'movies';
  return 'tvshows';
};

const normalizeWatchlistStatus = (item = {}, category) => {
  const status = item.status;
  if (category === 'books') {
    if (status === 'toRead' || status === 'plan-to-read') return 'plan-to-read';
    if (status === 'reading') return 'reading';
    if (status === 'read' || status === 'completed') return 'read';
    return 'plan-to-read';
  }

  if (status === 'toWatch' || status === 'plan-to-watch') return 'plan-to-watch';
  if (status === 'watching') return 'watching';
  if (status === 'watched' || status === 'completed' || status === 'read') return 'completed';
  return 'plan-to-watch';
};

const normalizeWatchlistItem = (item, fallbackCategory) => {
  const category = normalizeMediaCategory(item, fallbackCategory);
  const typeByCategory = {
    movies: 'Movie',
    tvshows: 'Tv Show',
    books: 'Book'
  };

  return {
    ...item,
    category,
    type: typeByCategory[category],
    status: normalizeWatchlistStatus(item, category)
  };
};

const normalizeShelfDataForClient = (shelfData = {}) => {
  const raw = shelfData && typeof shelfData === 'object' ? shelfData : {};
  const watchlistByKey = new Map();
  const addWatchlistItems = (items, fallbackCategory) => {
    asArray(items).forEach(item => {
      if (!item || typeof item !== 'object') return;
      const normalized = normalizeWatchlistItem(item, fallbackCategory);
      const key = `${normalized.category}:${normalized.id || normalized.title || watchlistByKey.size}`;
      watchlistByKey.set(key, normalized);
    });
  };

  addWatchlistItems(raw.watchlist, '');
  addWatchlistItems(raw.movies, 'movies');
  addWatchlistItems(raw.tvshows, 'tvshows');
  addWatchlistItems(raw.anime, 'tvshows');
  addWatchlistItems(raw.books, 'books');

  const migrated = {
    calendarEvents: asArray(raw.calendarEvents),
    tasks: asArray(raw.tasks),
    locations: asArray(raw.locations).length ? asArray(raw.locations) : asArray(raw.dates),
    trips: asArray(raw.trips),
    recipes: asArray(raw.recipes),
    watchlist: Array.from(watchlistByKey.values()),
    profile: raw.profile || defaultShelfData().profile
  };

  if (migrated.profile?.users) {
    migrated.profile.users = normalizeProfileUsers(migrated.profile.users);
  }

  return migrated;
};

function MediaTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentShelf, setCurrentShelf] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Replace single activeTab with category + sub-tab
  const [activeCategory, setActiveCategory] = useState('plan');
  const [activeSubTab, setActiveSubTab] = useState('calendar');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState(null);
  const [globalAddOpen, setGlobalAddOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editRecipeModalOpen, setEditRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editTripModalOpen, setEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const skipNextSaveRef = useRef(false);
  const dataEditedAfterLoadRef = useRef(false);

  // Online/offline listener
  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  // On mount, try to restore session
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchUser(token)
        .then(user => {
          if (user) {
            setCurrentUser(user);
          } else {
            clearAuthToken();
          }
        })
        .catch(() => clearAuthToken())
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      document.title = 'Shared Shelf - Homepage';
    } else if (!currentShelf) {
      document.title = 'Shared Shelf - Join your Shelf';
    } else {
      document.title = `Shared Shelf - ${currentShelf.name}`;
    }
  }, [currentUser, currentShelf]);

  useEffect(() => {
    if (!currentShelf) return;

    const enabledSections = getEnabledSections(currentShelf);
    const activeSection = activeCategory === 'media' ? 'watchlist' : activeSubTab;
    if (enabledSections.includes(activeSection)) return;

    const nextView = sectionToView(enabledSections[0] || 'calendar');
    setActiveCategory(nextView.category);
    setActiveSubTab(nextView.subTab);
  }, [currentShelf, activeCategory, activeSubTab]);

  // Load data when shelf changes
  useEffect(() => {
    if (!currentShelf) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      dataEditedAfterLoadRef.current = false;
      const cachedShelfData = window.getCachedShelfData?.(currentShelf.id);
      if (cachedShelfData && !cancelled) {
        skipNextSaveRef.current = true;
        setData(normalizeShelfDataForClient(cachedShelfData));
        setLoading(false);
      }

      const shelfData = await getShelfData(currentShelf.id);
      if (cancelled) return;
      if (dataEditedAfterLoadRef.current) return;

      skipNextSaveRef.current = true;
      if (shelfData) {
        setData(normalizeShelfDataForClient(shelfData));
      } else {
        setData(defaultShelfData());
      }
      setLoading(false);
    };
    loadData();

    return () => {
      cancelled = true;
    };
  }, [currentShelf]);

  // Persist data
  useEffect(() => {
    if (!currentShelf || !data) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    dataEditedAfterLoadRef.current = true;
    saveShelfData(currentShelf.id, data).then((saved) => {
      if (saved) setLastSynced(Date.now());
    });
  }, [data, currentShelf?.id]);

  const handleLogin = (user) => setCurrentUser(user);
  const handleAccountUpdate = (user) => setCurrentUser(user);
  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentShelf(null);
    setData(null);
    setSettingsModalOpen(false);
    setAccountModalOpen(false);
  };
  const handleShelfSelect = (shelf) => setCurrentShelf(shelf);
  const handleBackToShelves = () => {
    setCurrentShelf(null);
    setData(null);
    setSettingsModalOpen(false);
    setAccountModalOpen(false);
  };

  const handleCategoryChange = (category, subTab) => {
    setActiveCategory(category);
    setActiveSubTab(subTab);
  };

  // Data mutation handlers (unchanged)
  const handleAddMedia = (item) => {
    const defaultStatus = getDefaultStatus(item.category);
    const newItem = normalizeWatchlistItem({ ...item, status: defaultStatus }, item.category);
    setData(prev => ({ ...prev, watchlist: [...(prev.watchlist || []), newItem] }));
  };
  const handleStatusChange = (mediaType, id, newStatus) => {
    if (newStatus === 'remove') {
      setData(prev => ({ ...prev, watchlist: (prev.watchlist || []).filter(i => !(i.category === mediaType && i.id === id)) }));
    } else {
      setData(prev => ({
        ...prev,
        watchlist: (prev.watchlist || []).map(i => i.category === mediaType && i.id === id ? normalizeWatchlistItem({ ...i, status: newStatus }, mediaType) : i)
      }));
    }
  };
  const handleProgressChange = (mediaType, id, progress) => {
    setData(prev => ({
      ...prev,
      watchlist: (prev.watchlist || []).map(i => i.category === mediaType && i.id === id ? { ...i, progress } : i)
    }));
  };
  const handleAddEvent = (event) => {
    setData(prev => ({ ...prev, calendarEvents: [...(prev.calendarEvents || []), event] }));
  };
  const handleDeleteEvent = (id) => {
    setData(prev => ({ ...prev, calendarEvents: prev.calendarEvents.filter(e => e.id !== id) }));
  };
  const handleEditEvent = (event) => { setEditingEvent(event); setEditEventModalOpen(true); };
  const handleSaveEvent = (updatedEvent) => {
    setData(prev => ({ ...prev, calendarEvents: prev.calendarEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e) }));
  };
  const handleAddTrip = (trip) => setData(prev => ({ ...prev, trips: [...(prev.trips || []), trip] }));
  const handleDeleteTrip = (id) => setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== id) }));
  const handleEditTrip = (trip) => { setEditingTrip(trip); setEditTripModalOpen(true); };
  const handleSaveTrip = (updatedTrip) => {
    setData(prev => ({ ...prev, trips: prev.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t) }));
  };
  const handleAddRecipe = (recipe) => setData(prev => ({ ...prev, recipes: [...(prev.recipes || []), recipe] }));
  const handleDeleteRecipe = (id) => setData(prev => ({ ...prev, recipes: prev.recipes.filter(r => r.id !== id) }));
  const handleEditRecipe = (recipe) => { setEditingRecipe(recipe); setEditRecipeModalOpen(true); };
  const handleSaveRecipe = (updatedRecipe) => {
    setData(prev => ({ ...prev, recipes: prev.recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r) }));
  };
  const handleAddDate = (place) => setData(prev => ({ ...prev, locations: [...(prev.locations || []), place] }));
  const handleDeleteDate = (id) => setData(prev => ({ ...prev, locations: prev.locations.filter(p => p.id !== id) }));
  const handleToggleFavouriteDate = (id) => {
    setData(prev => ({ ...prev, locations: prev.locations.map(p => p.id === id ? { ...p, isFavourite: !p.isFavourite } : p) }));
  };
  const handleUpdateDate = (id, updates) => {
    setData(prev => ({ ...prev, locations: prev.locations.map(p => p.id === id ? { ...p, ...updates } : p) }));
  };
  const handleAddTask = (task) => setData(prev => ({ ...prev, tasks: [...(prev.tasks || []), task] }));
  const handleToggleTask = (id) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  };
  const handleDeleteTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const handleUpdateTask = (taskId, newTitle, newDescription) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, title: newTitle, description: newDescription } : t) }));
  };
  const handleReorderTasks = (reorderedTasks) => setData(prev => ({ ...prev, tasks: reorderedTasks }));
  const handleSaveProfile = (profileData) => setData(prev => ({ ...prev, profile: profileData }));

  const handleGlobalAddSelect = (category) => {
    setAddCategory(category);
    setGlobalAddOpen(false);
    setAddModalOpen(true);
  };

  // Update shelf settings (name)
  const handleSaveShelfSettings = (newSettings) => {
    const previousShelf = currentShelf;
    setCurrentShelf(prev => ({ ...prev, ...newSettings }));

    updateShelf(currentShelf.id, newSettings)
      .then((updatedShelf) => {
        if (updatedShelf) {
          setCurrentShelf(updatedShelf);
        }
      })
      .catch((error) => {
        console.error('Failed to persist shelf settings:', error);
        setCurrentShelf(previousShelf);
      });
  };

  const activeMediaItems = useMemo(
    () => (data?.watchlist || []).filter(item => item.category === activeSubTab),
    [data?.watchlist, activeSubTab]
  );

  if (authLoading) return <LoadingScreen label="Logging in..." />;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  if (!currentShelf) {
    return (
      <ShelfSelector
        userId={currentUser.id}
        currentUser={currentUser}
        token={getAuthToken()}
        onSelectShelf={handleShelfSelect}
        onUpdateUser={handleAccountUpdate}
        onBackToLogin={() => {
          clearAuthToken();
          setCurrentUser(null);
        }}
      />
    );
  }
  if (loading || !data) return <LoadingScreen />;

  // Determine what to render based on category + subTab
  const renderContent = () => {
    if (activeCategory === 'plan') {
      if (activeSubTab === 'tasks') {
        return (
          <TasksView
            tasks={data.tasks || []}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            onReorderTasks={handleReorderTasks}
            onAddClick={() => { setAddCategory('tasks'); setAddModalOpen(true); }}
            profile={data?.profile}
          />
        );
      }
      if (activeSubTab === 'calendar') {
        return (
          <CalendarView
            events={data.calendarEvents || []}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
            onAddClick={() => { setAddCategory('calendar'); setAddModalOpen(true); }}
          />
        );
      }
    }
    if (activeCategory === 'go') {
      if (activeSubTab === 'locations') {
        return (
          <DatesView
            places={data.locations || []}
            onDeletePlace={handleDeleteDate}
            onToggleFavourite={handleToggleFavouriteDate}
            onUpdateDate={handleUpdateDate}
            onAddClick={() => { setAddCategory('locations'); setAddModalOpen(true); }}
          />
        );
      }
      if (activeSubTab === 'trips') {
        return (
          <TripsView
            trips={data.trips || []}
            onDeleteTrip={handleDeleteTrip}
            onEditTrip={handleEditTrip}
            onAddClick={() => { setAddCategory('trips'); setAddModalOpen(true); }}
          />
        );
      }
      if (activeSubTab === 'recipes') {
        return (
          <RecipesView
            recipes={data.recipes || []}
            onDeleteRecipe={handleDeleteRecipe}
            onEditRecipe={handleEditRecipe}
            onAddClick={() => { setAddCategory('recipes'); setAddModalOpen(true); }}
          />
        );
      }
    }
    if (activeCategory === 'media') {
      // MediaSectionsView can handle the three sub-tabs via a prop
      return (
        <MediaSectionsView
          activeTab={activeSubTab} // tvshows, movies, books
          items={activeMediaItems}
          onStatusChange={(id, status) => handleStatusChange(activeSubTab, id, status)}
          onAddClick={() => { setAddCategory(activeSubTab); setAddModalOpen(true); }}
          onProgressChange={(id, progress) => handleProgressChange(activeSubTab, id, progress)}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fbfaff]">
      <a href="#main-content" className="skip-link">Skip To Content</a>
      <style>{`
        * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.18); }
        ::-webkit-scrollbar-thumb { background: rgba(5, 178, 220, 0.55); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.82); }
        input[type="time"], input[type="date"] { color-scheme: light; }
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.7; }
        .shelf-content [class~="text-white"] { color: #0f172a !important; }
        .shelf-content :is([class~="bg-purple-600"], [class~="bg-purple-700"], [class~="bg-red-600"], [class~="bg-red-700"], [class~="bg-black/60"], [class~="bg-black/80"])[class~="text-white"],
        .shelf-content :is([class~="bg-purple-600"], [class~="bg-purple-700"], [class~="bg-red-600"], [class~="bg-red-700"], [class~="bg-black/60"], [class~="bg-black/80"]) [class~="text-white"],
        .shelf-content [style*="background-color"] [class~="text-white"] { color: #ffffff !important; }
      `}</style>

      <Header
        shelfName={currentShelf.name}
        onEditShelf={() => setSettingsModalOpen(true)}
        activeCategory={activeCategory}
        activeSubTab={activeSubTab}
        onCategoryChange={handleCategoryChange}
        onSubTabChange={(sub) => setActiveSubTab(sub)}
        onGlobalAddClick={() => setGlobalAddOpen(true)}
        onSettingsClick={() => setSettingsModalOpen(true)}
        onAccountClick={() => setAccountModalOpen(true)}
        enabledSections={getEnabledSections(currentShelf)}
        profile={data?.profile}
        isOnline={isOnline}
        lastSynced={lastSynced}
        onBackToShelves={handleBackToShelves}
        onLogout={handleLogout}
      />

      <main id="main-content" className="shelf-content flex-1 max-w-8xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-8" tabIndex="-1">
        {renderContent()}
      </main>

      {/* Modals */}
      <GlobalSearchModal isOpen={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} data={data} setActiveTab={(tab) => { /* map old tab to new category/sub */ }} />
      <AddModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAddCategory(null); }}
        activeTab={addCategory || activeSubTab}
        onAddMedia={handleAddMedia}
        onAddEvent={handleAddEvent}
        onAddTrip={handleAddTrip}
        onAddRecipe={handleAddRecipe}
        onAddDate={handleAddDate}
        onAddTask={handleAddTask}
        profile={data?.profile}
      />
      <EditEventModal isOpen={editEventModalOpen} onClose={() => setEditEventModalOpen(false)} event={editingEvent} onSave={handleSaveEvent} />
      <GlobalAddModal isOpen={globalAddOpen} onClose={() => setGlobalAddOpen(false)} onSelect={handleGlobalAddSelect} enabledSections={getEnabledSections(currentShelf)} />
      {/* Use ProfileModal for different modes */}
      <ProfileModal
        mode="profiles"
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={data?.profile}
        onSave={handleSaveProfile}
      />
      <ProfileModal
        mode="settings"
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        shelf={currentShelf}
        onSaveShelf={handleSaveShelfSettings}
      />
      <ProfileModal
        mode="account"
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        currentUser={currentUser}
        onSaveAccount={handleAccountUpdate}
        onLogout={handleLogout}
      />
      <EditRecipeModal isOpen={editRecipeModalOpen} onClose={() => setEditRecipeModalOpen(false)} recipe={editingRecipe} onSave={handleSaveRecipe} />
      <EditTripModal isOpen={editTripModalOpen} onClose={() => setEditTripModalOpen(false)} trip={editingTrip} onSave={handleSaveTrip} />
    </div>
  );
}

function defaultShelfData() {
  return {
    calendarEvents: [],
    tasks: [],
    locations: [],
    trips: [],
    recipes: [],
    watchlist: [],
    profile: {
      users: [
        { id: 'user-1', name: 'Diogo', avatar: '', color: '#031A6B' },
        { id: 'user-2', name: 'MÃ³nica', avatar: '', color: '#087CA7' }
      ]
    }
  };
}

async function fetchUser(token) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) return await res.json().then(d => d.user);
  } catch {}
  return null;
}

window.MediaTracker = MediaTracker;

