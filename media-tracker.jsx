const React = window.React;
const { useState, useEffect } = React;

// API base is set globally in index.html
const API_BASE = window.API_BASE_URL ?? '';
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

  // Load data when shelf changes
  useEffect(() => {
    if (!currentShelf) return;
    const loadData = async () => {
      setLoading(true);
      const shelfData = await getShelfData(currentShelf.id);
      if (shelfData) {
        const migrated = {
          tasks: shelfData.tasks || [],
          movies: shelfData.movies || [],
          tvshows: [...(shelfData.tvshows || []), ...(shelfData.anime || [])],
          books: shelfData.books || [],
          calendarEvents: shelfData.calendarEvents || [],
          trips: shelfData.trips || [],
          recipes: shelfData.recipes || [],
          dates: shelfData.dates || [],
          profile: shelfData.profile || {
            users: [
              { id: 'user-1', name: 'Diogo', avatar: '', color: '#031A6B' },
                { id: 'user-2', name: 'Mónica', avatar: '', color: '#087CA7' }
            ]
          }
        };
        if (migrated.profile?.users) {
          migrated.profile.users = normalizeProfileUsers(migrated.profile.users);
        }
        setData(migrated);
      } else {
        setData(defaultShelfData());
      }
      setLoading(false);
    };
    loadData();
  }, [currentShelf]);

  // Persist data
  useEffect(() => {
    if (!currentShelf || !data) return;
    saveShelfData(currentShelf.id, data).then(() => setLastSynced(Date.now()));
  }, [data, currentShelf]);

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
    const newItem = { ...item, status: defaultStatus };
    setData(prev => ({ ...prev, [item.category]: [...prev[item.category], newItem] }));
  };
  const handleStatusChange = (mediaType, id, newStatus) => {
    if (newStatus === 'remove') {
      setData(prev => ({ ...prev, [mediaType]: prev[mediaType].filter(i => i.id !== id) }));
    } else {
      setData(prev => ({
        ...prev,
        [mediaType]: prev[mediaType].map(i => i.id === id ? { ...i, status: newStatus } : i)
      }));
    }
  };
  const handleProgressChange = (mediaType, id, progress) => {
    setData(prev => ({
      ...prev,
      [mediaType]: prev[mediaType].map(i => i.id === id ? { ...i, progress } : i)
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
  const handleAddDate = (place) => setData(prev => ({ ...prev, dates: [...(prev.dates || []), place] }));
  const handleDeleteDate = (id) => setData(prev => ({ ...prev, dates: prev.dates.filter(p => p.id !== id) }));
  const handleToggleFavouriteDate = (id) => {
    setData(prev => ({ ...prev, dates: prev.dates.map(p => p.id === id ? { ...p, isFavourite: !p.isFavourite } : p) }));
  };
  const handleUpdateDate = (id, updates) => {
    setData(prev => ({ ...prev, dates: prev.dates.map(p => p.id === id ? { ...p, ...updates } : p) }));
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

  if (authLoading) return <LoadingScreen />;
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
      if (activeSubTab === 'dates') {
        return (
          <DatesView
            places={data.dates || []}
            onDeletePlace={handleDeleteDate}
            onToggleFavourite={handleToggleFavouriteDate}
            onUpdateDate={handleUpdateDate}
            onAddClick={() => { setAddCategory('dates'); setAddModalOpen(true); }}
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
          items={data[activeSubTab] || []}
          onStatusChange={(id, status) => handleStatusChange(activeSubTab, id, status)}
          onAddClick={() => { setAddCategory(activeSubTab); setAddModalOpen(true); }}
          onProgressChange={(id, progress) => handleProgressChange(activeSubTab, id, progress)}
        />
      );
    }
    return null;
  };

  const currentView = activeCategory + '/' + activeSubTab;
  const isMediaTab = ['tvshows', 'movies', 'books'].includes(activeSubTab);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
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
        profile={data?.profile}
        isOnline={isOnline}
        lastSynced={lastSynced}
        onBackToShelves={handleBackToShelves}
        onLogout={handleLogout}
      />

      <main className="shelf-content flex-1 max-w-8xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
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
      <GlobalAddModal isOpen={globalAddOpen} onClose={() => setGlobalAddOpen(false)} onSelect={handleGlobalAddSelect} />
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
    tasks: [],
    movies: [],
    tvshows: [],
    books: [],
    calendarEvents: [],
    trips: [],
    recipes: [],
    dates: [],
    profile: {
      users: [
        { id: 'user-1', name: 'Diogo', avatar: '', color: '#031A6B' },
        { id: 'user-2', name: 'Mónica', avatar: '', color: '#087CA7' }
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

