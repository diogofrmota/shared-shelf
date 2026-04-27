const React = window.React;
const { useState, useEffect, useMemo, useRef } = React;
const { Plus, CheckSquare, CalendarIcon, MapPin, ChefHat, Tv, Film, Book } = window;

// API base is set globally in index.html
const API_BASE = window.API_BASE_URL ?? '';
const DEFAULT_SHELF_SECTIONS = ['calendar', 'tasks', 'locations', 'trips', 'recipes', 'watchlist'];
const LEGACY_PROFILE_COLOR_MAP = {
  '#c1071e': '#E63B2E',
  '#dedede': '#8C4F45',
  '#8b5cf6': '#A9372C',
  '#ec4899': '#FFB4A9',
  '#ff6f61': '#E63B2E',
  '#2fb7aa': '#8C4F45',
  '#f7b267': '#A9372C',
  '#7c83fd': '#8C4F45',
  '#ff9f9f': '#FFB4A9'
};

const normalizeProfileUsers = (users = []) => users.map((user, index) => ({
  ...user,
  name: user.name || '',
  avatar: window.safeImageUrl?.(user.avatar) || '',
  color: LEGACY_PROFILE_COLOR_MAP[user.color] || user.color || (index % 2 === 0 ? '#E63B2E' : '#8C4F45')
}));

const getEnabledSections = (shelf) => (
  Array.isArray(shelf?.enabledSections) && shelf.enabledSections.length
    ? shelf.enabledSections
    : DEFAULT_SHELF_SECTIONS
);

const sectionToView = (section) => {
  if (section === 'watchlist') return { category: 'media', subTab: null };
  if (section === 'calendar' || section === 'tasks') return { category: 'plan', subTab: section };
  return { category: 'go', subTab: section };
};

const readAppRoute = (pathname = window.location.pathname) => {
  const path = pathname || '/';
  const shelfMatch = path.match(/^\/shelf\/([^/]+)\/?$/);

  if (shelfMatch) {
    return {
      type: 'shelf',
      shelfId: decodeURIComponent(shelfMatch[1]),
      path: `/shelf/${shelfMatch[1]}/`
    };
  }

  if (/^\/shelf-selection\/?$/.test(path)) {
    return { type: 'selection', path: '/shelf-selection/' };
  }

  return { type: 'home', path: '/' };
};

const asArray = (value) => Array.isArray(value) ? value : [];

const normalizeCalendarEvent = (event = {}) => {
  const startDate = event.startDate || event.date || '';
  const endDate = event.endDate || startDate;
  const frequency = event.recurrence?.frequency || event.recurrence || event.repeat || 'none';
  const recurrence = ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)
    ? {
      frequency,
      until: event.recurrence?.until || event.recurrenceUntil || ''
    }
    : null;

  return {
    ...event,
    date: startDate,
    startDate,
    endDate,
    recurrence
  };
};

const normalizeTaskRecurrence = (task = {}) => {
  const frequency = task.recurrence?.frequency || task.recurrence || task.repeat || task.recurrenceFrequency || 'none';
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) return null;
  return { frequency };
};

const normalizeTask = (task = {}) => {
  const recurrence = normalizeTaskRecurrence(task);

  return {
    ...task,
    description: task.description || '',
    assignedTo: task.assignedTo || null,
    dueDate: task.dueDate || null,
    completed: recurrence ? false : Boolean(task.completed),
    recurrence,
    lastCompletedAt: task.lastCompletedAt || null,
    completionCount: Number(task.completionCount || 0)
  };
};

const normalizeTripListItems = (items, mapItem) => asArray(items)
  .filter(item => item !== null && item !== undefined && item !== '')
  .map((item, index) => mapItem(item, index));

const normalizeTrip = (trip = {}) => {
  const startDate = trip.startDate || trip.date || '';
  const endDate = trip.endDate || startDate || '';

  return {
    ...trip,
    startDate,
    endDate,
    itinerary: normalizeTripListItems(trip.itinerary, (item, index) => ({
      id: item.id || `itinerary-${index}`,
      date: item.date || '',
      time: item.time || '',
      title: item.title || item.name || '',
      notes: item.notes || item.description || ''
    })),
    bookings: normalizeTripListItems(trip.bookings, (item, index) => ({
      id: item.id || `booking-${index}`,
      type: item.type || 'reservation',
      title: item.title || item.name || '',
      link: window.safeExternalUrl?.(item.link || item.url) || '',
      notes: item.notes || item.description || ''
    })),
    notes: trip.notes || '',
    photo: window.safeImageUrl?.(trip.photo) || '',
    accommodation: window.safeExternalUrl?.(trip.accommodation) || '',
    packingList: normalizeTripListItems(trip.packingList || trip.packing, (item, index) => {
      if (typeof item === 'string') {
        return { id: `packing-${index}`, text: item, packed: false };
      }
      return {
        id: item.id || `packing-${index}`,
        text: item.text || item.name || '',
        packed: Boolean(item.packed)
      };
    }).filter(item => item.text)
  };
};

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

const normalizeBookProgress = (item = {}) => {
  const rawProgress = item.progress && typeof item.progress === 'object' ? item.progress : {};
  const totalPages = Math.max(0, Math.floor(Number(
    rawProgress.totalPages ?? item.totalPages ?? item.pages ?? item.pageCount ?? 0
  ) || 0));
  const currentPage = Math.max(0, Math.floor(Number(
    rawProgress.currentPage ?? item.currentPage ?? 0
  ) || 0));
  const clampedCurrentPage = totalPages ? Math.min(currentPage, totalPages) : currentPage;

  if (!totalPages && !clampedCurrentPage) return null;
  return {
    currentPage: clampedCurrentPage,
    totalPages: totalPages || null
  };
};

const normalizeWatchlistItem = (item, fallbackCategory) => {
  const category = normalizeMediaCategory(item, fallbackCategory);
  const typeByCategory = {
    movies: 'Movie',
    tvshows: 'Tv Show',
    books: 'Book'
  };
  const bookProgress = category === 'books' ? normalizeBookProgress(item) : null;

  return {
    ...item,
    category,
    title: item.title || item.name || '',
    thumbnail: window.safeImageUrl?.(item.thumbnail || item.image || item.photo) || '',
    type: typeByCategory[category],
    totalPages: category === 'books'
      ? bookProgress?.totalPages || Number(item.totalPages || item.pages || item.pageCount || 0) || null
      : item.totalPages,
    progress: category === 'books'
      ? bookProgress
      : item.progress,
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
    calendarEvents: asArray(raw.calendarEvents).map(normalizeCalendarEvent),
    tasks: asArray(raw.tasks).map(normalizeTask),
    locations: (asArray(raw.locations).length ? asArray(raw.locations) : asArray(raw.dates)).map(location => ({
      ...location,
      name: location?.name || '',
      address: location?.address || '',
      notes: location?.notes || '',
      link: window.safeExternalUrl?.(location?.link || location?.url) || '',
      photo: window.safeImageUrl?.(location?.photo) || '',
      lat: Number.isFinite(Number(location?.lat)) ? Number(location.lat) : null,
      lng: Number.isFinite(Number(location?.lng)) ? Number(location.lng) : null
    })),
    trips: asArray(raw.trips).map(normalizeTrip),
    recipes: asArray(raw.recipes).map(recipe => ({
      ...recipe,
      name: recipe?.name || '',
      photo: window.safeImageUrl?.(recipe?.photo) || '',
      link: window.safeExternalUrl?.(recipe?.link || recipe?.url) || '',
      ingredients: recipe?.ingredients || '',
      instructions: recipe?.instructions || ''
    })),
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
  const [appRoute, setAppRoute] = useState(() => readAppRoute());
  const [routeLoading, setRouteLoading] = useState(false);

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

  const navigateTo = (path, { replace = false } = {}) => {
    const nextRoute = readAppRoute(path);
    const nextUrl = nextRoute.path;

    if (window.location.pathname !== nextUrl || window.location.search) {
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({}, '', nextUrl);
    }

    setAppRoute(nextRoute);
  };

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

  useEffect(() => {
    const handlePopState = () => setAppRoute(readAppRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!window.location.search && window.location.pathname !== appRoute.path) {
      window.history.replaceState({}, '', appRoute.path);
    }
  }, [appRoute.path]);

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
    if (authLoading) return;

    if (!currentUser) {
      setRouteLoading(false);
      if (currentShelf) {
        setCurrentShelf(null);
        setData(null);
      }
      if (appRoute.type !== 'home') {
        navigateTo('/', { replace: true });
      }
      return;
    }

    if (appRoute.type === 'home') {
      if (currentShelf) {
        setCurrentShelf(null);
        setData(null);
      }
      navigateTo('/shelf-selection/', { replace: true });
      return;
    }

    if (appRoute.type === 'selection') {
      setRouteLoading(false);
      if (currentShelf) {
        setCurrentShelf(null);
        setData(null);
      }
      return;
    }

    if (appRoute.type === 'shelf') {
      if (currentShelf?.id === appRoute.shelfId) {
        setRouteLoading(false);
        return;
      }

      let cancelled = false;
      setRouteLoading(true);
      getUserShelves()
        .then((shelves) => {
          if (cancelled) return;
          const matchingShelf = shelves.find((shelf) => shelf.id === appRoute.shelfId);
          if (matchingShelf) {
            setCurrentShelf(matchingShelf);
          } else {
            setCurrentShelf(null);
            setData(null);
            navigateTo('/shelf-selection/', { replace: true });
          }
        })
        .catch(() => {
          if (!cancelled) navigateTo('/shelf-selection/', { replace: true });
        })
        .finally(() => {
          if (!cancelled) setRouteLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [authLoading, currentUser?.id, appRoute.type, appRoute.shelfId, currentShelf?.id]);

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

  const handleLogin = (user) => {
    setCurrentUser(user);
    navigateTo('/shelf-selection/');
  };
  const handleAccountUpdate = (user) => setCurrentUser(user);
  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentShelf(null);
    setData(null);
    setSettingsModalOpen(false);
    setAccountModalOpen(false);
    navigateTo('/', { replace: true });
  };
  const handleShelfSelect = (shelf) => {
    setCurrentShelf(shelf);
    setData(null);
    navigateTo(`/shelf/${encodeURIComponent(shelf.id)}/`);
  };
  const handleBackToShelves = () => {
    setCurrentShelf(null);
    setData(null);
    setSettingsModalOpen(false);
    setAccountModalOpen(false);
    navigateTo('/shelf-selection/');
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
      watchlist: (prev.watchlist || []).map(i => (
        i.category === mediaType && i.id === id
          ? normalizeWatchlistItem({
            ...i,
            totalPages: mediaType === 'books' ? progress?.totalPages : i.totalPages,
            progress
          }, mediaType)
          : i
      ))
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
  const handleAddTask = (task) => setData(prev => ({ ...prev, tasks: [...(prev.tasks || []), normalizeTask(task)] }));
  const handleToggleTask = (id, checked) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== id) return t;
        if (t.recurrence) {
          if (checked === false) {
            return {
              ...t,
              completed: false,
              lastCompletedAt: null,
              completionCount: Math.max(0, Number(t.completionCount || 0) - 1)
            };
          }
          return {
            ...t,
            completed: false,
            lastCompletedAt: new Date().toISOString(),
            completionCount: Number(t.completionCount || 0) + 1
          };
        }
        const completed = typeof checked === 'boolean' ? checked : !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : null
        };
      })
    }));
  };
  const handleDeleteTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const handleUpdateTask = (taskId, updatesOrTitle, newDescription) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const updates = typeof updatesOrTitle === 'object'
          ? updatesOrTitle
          : { title: updatesOrTitle, description: newDescription };
        return normalizeTask({ ...t, ...updates });
      })
    }));
  };
  const handleReorderTasks = (reorderedTasks) => setData(prev => ({ ...prev, tasks: reorderedTasks }));
  const handleSaveProfile = (profileData) => setData(prev => ({ ...prev, profile: profileData }));

  const handleGlobalAddSelect = (category) => {
    setAddCategory(category);
    setGlobalAddOpen(false);
    setAddModalOpen(true);
  };

  const addActionByTab = {
    calendar: { label: 'Activity', icon: CalendarIcon },
    tasks: { label: 'Task', icon: CheckSquare },
    locations: { label: 'Location', icon: MapPin },
    trips: { label: 'Trip', icon: Film },
    recipes: { label: 'Recipe', icon: ChefHat },
    tvshows: { label: 'TV Show', icon: Tv },
    movies: { label: 'Movie', icon: Film },
    books: { label: 'Book', icon: Book }
  };

  const renderPageAddButton = () => {
    if (activeCategory === 'media') return null;

    const action = addActionByTab[activeSubTab];
    if (!action) return null;

    const Icon = action.icon;

    return (
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setAddCategory(activeSubTab);
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
        >
          <Plus size={16} />
          <Icon size={16} />
          Add {action.label}
        </button>
      </div>
    );
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

  if (authLoading || routeLoading) return <LoadingScreen label="Logging in..." />;
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
          onMediaTypeSelect={(subTab) => setActiveSubTab(subTab)}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <Header
        shelfName={currentShelf.name}
        onEditShelf={() => setSettingsModalOpen(true)}
        activeCategory={activeCategory}
        activeSubTab={activeSubTab}
        onCategoryChange={handleCategoryChange}
        onSubTabChange={(sub) => setActiveSubTab(sub)}
        onSettingsClick={() => setSettingsModalOpen(true)}
        onAccountClick={() => setAccountModalOpen(true)}
        onBackToShelves={handleBackToShelves}
        enabledSections={getEnabledSections(currentShelf)}
        profile={data?.profile}
      />

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        tabIndex="-1"
      >
        {renderPageAddButton()}
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
        onBackToShelves={handleBackToShelves}
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
        { id: 'user-1', name: 'Diogo', avatar: '', color: '#E63B2E' },
        { id: 'user-2', name: 'MÃ³nica', avatar: '', color: '#8C4F45' }
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
