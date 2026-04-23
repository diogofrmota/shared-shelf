const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

function MediaTracker() {
  // State Management
  const [isAuth, setIsAuth] = useState(() => isAuthenticated());
  const [activeTab, setActiveTab] = useState('calendar');
  const [data, setData] = useState(null); // Start with null for loading state
  const [loading, setLoading] = useState(true);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState(null); // category override for GlobalAddModal
  const [globalAddOpen, setGlobalAddOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [editRecipeModalOpen, setEditRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editTripModalOpen, setEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  // Online / offline listener
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

  // Load data once the user is signed in
  useEffect(() => {
    if (!isAuth) return;
    const loadData = async () => {
      const stored = await getStoredData();
      // Migrate old anime data into tvshows and ensure all keys exist
      const migrated = {
        tasks: stored.tasks || [],
        movies: stored.movies || [],
        tvshows: [...(stored.tvshows || []), ...(stored.anime || [])],
        books: stored.books || [],
        calendarEvents: stored.calendarEvents || [],
        trips: stored.trips || [],
        recipes: stored.recipes || [],
        dates: stored.dates || [],
        profile: stored.profile || {
          users: [
            { id: 'user-1', name: 'Diogo',  avatar: '', color: '#8b5cf6' },
            { id: 'user-2', name: 'Mónica', avatar: '', color: '#ec4899' }
          ]
        }
      };
      setData(migrated);
      setLoading(false);
    };
    loadData();
  }, [isAuth]);

  // Persist data whenever it changes
  useEffect(() => {
    if (!isAuth) return;
    if (data) {
      saveData(data).then(() => setLastSynced(Date.now()));
    }
  }, [data, isAuth]);

  // Event Handlers
  const handleLogin = () => {
    setIsAuth(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    setData(null);
    setLoading(true);
  };

  const handleAddMedia = (item) => {
    const defaultStatus = getDefaultStatus(item.category);
    const newItem = { ...item, status: defaultStatus };

    setData(prev => ({
      ...prev,
      [item.category]: [...prev[item.category], newItem]
    }));
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === 'remove') {
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item.id !== id)
      }));
    } else {
      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      }));
    }
  };

  const handleProgressChange = (id, progress) => {
    setData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item =>
        item.id === id ? { ...item, progress } : item
      )
    }));
  };

  const handleAddEvent = (event) => {
    setData(prev => ({
      ...prev,
      calendarEvents: [...(prev.calendarEvents || []), event]
    }));
  };

  const handleDeleteEvent = (id) => {
    setData(prev => ({
      ...prev,
      calendarEvents: (prev.calendarEvents || []).filter(e => e.id !== id)
    }));
  };

  const handleAddTrip = (trip) => {
    setData(prev => ({
      ...prev,
      trips: [...(prev.trips || []), trip]
    }));
  };

  const handleDeleteTrip = (id) => {
    setData(prev => ({
      ...prev,
      trips: (prev.trips || []).filter(t => t.id !== id)
    }));
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setEditTripModalOpen(true);
  };

  const handleSaveTrip = (updatedTrip) => {
    setData(prev => ({
      ...prev,
      trips: (prev.trips || []).map(t => t.id === updatedTrip.id ? updatedTrip : t)
    }));
  };

  const handleAddRecipe = (recipe) => {
    setData(prev => ({
      ...prev,
      recipes: [...(prev.recipes || []), recipe]
    }));
  };

  const handleDeleteRecipe = (id) => {
    setData(prev => ({
      ...prev,
      recipes: (prev.recipes || []).filter(r => r.id !== id)
    }));
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setEditRecipeModalOpen(true);
  };

  const handleSaveRecipe = (updatedRecipe) => {
    setData(prev => ({
      ...prev,
      recipes: (prev.recipes || []).map(r =>
        r.id === updatedRecipe.id ? updatedRecipe : r
      )
    }));
  };

  const handleAddDate = (place) => {
    setData(prev => ({
      ...prev,
      dates: [...(prev.dates || []), place]
    }));
  };

  const handleDeleteDate = (id) => {
    setData(prev => ({
      ...prev,
      dates: (prev.dates || []).filter(p => p.id !== id)
    }));
  };

  const handleToggleFavouriteDate = (id) => {
    setData(prev => ({
      ...prev,
      dates: (prev.dates || []).map(p =>
        p.id === id ? { ...p, isFavourite: !p.isFavourite } : p
      )
    }));
  };

  const handleUpdateDate = (id, updates) => {
    setData(prev => ({
      ...prev,
      dates: (prev.dates || []).map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  };

  const handleAddTask = (task) => {
    setData(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), task]
    }));
  };

  const handleToggleTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  };

  const handleDeleteTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: (prev.tasks || []).filter(t => t.id !== id)
    }));
  };

  const handleUpdateTask = (taskId, newTitle, newDescription) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, title: newTitle, description: newDescription }
          : task
      )
    }));
  };

  const handleReorderTasks = (reorderedTasks) => {
    setData(prev => ({
      ...prev,
      tasks: reorderedTasks
    }));
  };

  const handleSaveProfile = (profileData) => {
    setData(prev => ({ ...prev, profile: profileData }));
  };

  const handleGlobalAddSelect = (category) => {
    setAddCategory(category);
    setGlobalAddOpen(false);
    setAddModalOpen(true);
  };

  // Gate the entire UI behind the login screen
  if (!isAuth) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show loading screen while data is being fetched
  if (loading || !data) {
    return <LoadingScreen />;
  }

  const isMediaTab = MEDIA_TABS.includes(activeTab);
  const tabs = getDefaultTabs();

  // Render
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }

        input[type="time"],
        input[type="date"] {
          color-scheme: dark;
        }

        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.7;
        }
      `}</style>

      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onGlobalAddClick={() => setGlobalAddOpen(true)}
        onProfileClick={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
        tabs={tabs}
        profile={data?.profile}
        lastSynced={lastSynced}
        isOnline={isOnline}
        showMediaActions={true}
      />

      {/* Main Content */}
      <div className="flex-1 max-w-8xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {activeTab === 'tasks' && (
          <TasksView
            tasks={data.tasks || []}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            onReorderTasks={handleReorderTasks}
            onAddClick={() => setAddModalOpen(true)}
            profile={data?.profile}
          />
        )}

        {isMediaTab && (
          <MediaSectionsView
            activeTab={activeTab}
            items={data[activeTab] || []}
            onStatusChange={handleStatusChange}
            onAddClick={() => setAddModalOpen(true)}
            onProgressChange={handleProgressChange}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={data.calendarEvents || []}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {activeTab === 'trips' && (
          <TripsView
            trips={data.trips || []}
            onDeleteTrip={handleDeleteTrip}
            onEditTrip={handleEditTrip}
          />
        )}

        {activeTab === 'dates' && (
          <DatesView
            places={data.dates || []}
            onDeletePlace={handleDeleteDate}
            onToggleFavourite={handleToggleFavouriteDate}
            onUpdateDate={handleUpdateDate}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={data.recipes || []}
            onDeleteRecipe={handleDeleteRecipe}
            onEditRecipe={handleEditRecipe}
          />
        )}
      </div>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        data={data}
        setActiveTab={setActiveTab}
      />

      <AddModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAddCategory(null); }}
        activeTab={addCategory || activeTab}
        onAddMedia={handleAddMedia}
        onAddEvent={handleAddEvent}
        onAddTrip={handleAddTrip}
        onAddRecipe={handleAddRecipe}
        onAddDate={handleAddDate}
        onAddTask={handleAddTask}
        profile={data?.profile}
      />

      <GlobalAddModal
        isOpen={globalAddOpen}
        onClose={() => setGlobalAddOpen(false)}
        onSelect={handleGlobalAddSelect}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={data?.profile}
        onSave={handleSaveProfile}
      />

      <EditRecipeModal
        isOpen={editRecipeModalOpen}
        onClose={() => setEditRecipeModalOpen(false)}
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
      />

      <EditTripModal
        isOpen={editTripModalOpen}
        onClose={() => setEditTripModalOpen(false)}
        trip={editingTrip}
        onSave={handleSaveTrip}
      />
    </div>
  );
}

// Make component globally available
window.MediaTracker = MediaTracker;
