const React = window.React;
const { useState, useEffect, useMemo, useRef } = React;
const getTrackerComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

// API base is set globally in index.html
const API_BASE = window.API_BASE_URL ?? '';
const {
  PUBLIC_ROUTE_TYPES,
  STATIC_PUBLIC_ROUTE_TYPES,
  defaultDashboardData,
  getEnabledSections,
  normalizeDashboardDataForClient,
  normalizeTask,
  normalizeWatchlistItem,
  readAppRoute,
  sectionToView
} = window;

function MediaTracker() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appRoute, setAppRoute] = useState(() => readAppRoute());
  const [routeLoading, setRouteLoading] = useState(false);
  const [accessIssue, setAccessIssue] = useState(null);

  // Replace single activeTab with category + sub-tab
  const [activeCategory, setActiveCategory] = useState('plan');
  const [activeSubTab, setActiveSubTab] = useState('calendar');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editRecipeModalOpen, setEditRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editTripModalOpen, setEditTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const skipNextSaveRef = useRef(false);
  const dataEditedAfterLoadRef = useRef(false);
  const initialRouteRef = useRef(readAppRoute());
  const directDashboardHistorySeededRef = useRef(false);
  const currentUrlRef = useRef(`${window.location.pathname}${window.location.search}`);
  const appRouteRef = useRef(appRoute);
  const hasOpenDashboardDraftRef = useRef(false);

  const requestConfirmation = (options, onConfirm) => {
    setConfirmation({
      ...options,
      onConfirm: () => {
        setConfirmation(null);
        onConfirm();
      }
    });
  };

  const getItemLabel = (item, fallback) => {
    const rawLabel = item?.title || item?.name || item?.destination || fallback;
    return rawLabel ? `"${rawLabel}"` : fallback;
  };

  const closeDashboardOverlays = () => {
    setAddModalOpen(false);
    setAddCategory(null);
    setSettingsModalOpen(false);
    setAccountModalOpen(false);
    setShareModalOpen(false);
    setEditRecipeModalOpen(false);
    setEditingRecipe(null);
    setEditTripModalOpen(false);
    setEditingTrip(null);
    setEditEventModalOpen(false);
    setEditingEvent(null);
    setConfirmation(null);
  };

  const shouldWarnBeforeRouteChange = (nextRoute) => (
    hasOpenDashboardDraftRef.current
    && appRouteRef.current.type === 'dashboard'
    && (nextRoute.type !== 'dashboard' || nextRoute.dashboardId !== appRouteRef.current.dashboardId)
  );

  const confirmRouteChange = (nextRoute) => {
    if (!shouldWarnBeforeRouteChange(nextRoute)) return true;
    return window.confirm('You have an open form or dialog in this dashboard. Leave this page and discard anything not saved yet?');
  };

  const navigateTo = (target, { replace = false, skipPrompt = false } = {}) => {
    let nextPath = '/';
    let nextSearch = '';
    try {
      const parsed = new URL(target, window.location.origin);
      nextPath = parsed.pathname;
      nextSearch = parsed.search || '';
    } catch {
      nextPath = typeof target === 'string' ? target : '/';
    }

    const nextRoute = readAppRoute(nextPath);
    const nextUrl = `${nextRoute.path}${nextSearch}`;

    if (!skipPrompt && !confirmRouteChange(nextRoute)) {
      return false;
    }

    if (window.location.pathname !== nextRoute.path || window.location.search !== nextSearch) {
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({ appRoutePath: nextRoute.path }, '', nextUrl);
    }

    if (nextRoute.type !== 'dashboard' || nextRoute.dashboardId !== appRoute.dashboardId) {
      closeDashboardOverlays();
    }
    setAppRoute(nextRoute);
    currentUrlRef.current = nextUrl;
    return true;
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
    const handlePopState = () => {
      const nextRoute = readAppRoute();
      const nextUrl = `${window.location.pathname}${window.location.search}`;
      if (!confirmRouteChange(nextRoute)) {
        window.history.pushState({ appRoutePath: appRouteRef.current.path }, '', currentUrlRef.current);
        return;
      }
      if (nextRoute.type !== 'dashboard' || nextRoute.dashboardId !== appRouteRef.current.dashboardId) {
        closeDashboardOverlays();
      }
      setAppRoute(nextRoute);
      currentUrlRef.current = nextUrl;
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (window.location.pathname !== appRoute.path && !window.location.search) {
      window.history.replaceState({}, '', appRoute.path);
    }
    setAccessIssue(null);
  }, [appRoute.path]);

  useEffect(() => {
    appRouteRef.current = appRoute;
    currentUrlRef.current = `${window.location.pathname}${window.location.search}`;
  }, [appRoute]);

  useEffect(() => {
    hasOpenDashboardDraftRef.current = Boolean(
      currentDashboard && (
        addModalOpen
        || editRecipeModalOpen
        || editTripModalOpen
        || editEventModalOpen
        || settingsModalOpen
        || accountModalOpen
        || confirmation
      )
    );
  }, [
    currentDashboard,
    addModalOpen,
    editRecipeModalOpen,
    editTripModalOpen,
    editEventModalOpen,
    settingsModalOpen,
    accountModalOpen,
    confirmation
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      flushPendingDashboardSavesViaBeacon();
      if (!hasOpenDashboardDraftRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
    if (authLoading) return;

    if (!currentUser) {
      setRouteLoading(false);
      if (currentDashboard) {
        setCurrentDashboard(null);
        setData(null);
      }
      if (!PUBLIC_ROUTE_TYPES.has(appRoute.type)) {
        setAccessIssue({
          type: 'unauthorized',
          title: 'Sign in to keep going',
          message: 'This part of Couple Planner is private. Sign in first, then you can open your dashboards safely.'
        });
      }
      return;
    }

    if (appRoute.type === 'login') {
      if (currentDashboard) {
        setCurrentDashboard(null);
        setData(null);
      }
      const params = new URLSearchParams(window.location.search);
      const inviteDashboard = params.get('inviteDashboard');
      const inviteCode = params.get('inviteCode');
      const inviteQuery = inviteDashboard && inviteCode
        ? `?inviteDashboard=${encodeURIComponent(inviteDashboard)}&inviteCode=${encodeURIComponent(inviteCode)}`
        : '';
      if (!inviteQuery) {
        let cancelled = false;
        setRouteLoading(true);
        getUserDashboards()
          .then((dashboards) => {
            if (cancelled) return;
            if (dashboards.length > 0) {
              navigateTo(`/dashboard/${encodeURIComponent(dashboards[0].id)}/`, { replace: true, skipPrompt: true });
            } else {
              navigateTo('/dashboard-selection/', { replace: true, skipPrompt: true });
            }
          })
          .catch(() => {
            if (!cancelled) navigateTo('/dashboard-selection/', { replace: true, skipPrompt: true });
          })
          .finally(() => {
            if (!cancelled) setRouteLoading(false);
          });
        return () => {
          cancelled = true;
        };
      }
      navigateTo(`/dashboard-selection/${inviteQuery}`, { replace: true });
      return;
    }

    if (appRoute.type === 'home') {
      if (currentDashboard) {
        setCurrentDashboard(null);
        setData(null);
      }
      setRouteLoading(false);
      return;
    }

    if (
      appRoute.type === 'dashboard'
      && initialRouteRef.current.type === 'dashboard'
      && !directDashboardHistorySeededRef.current
    ) {
      directDashboardHistorySeededRef.current = true;
      const currentUrl = `${appRoute.path}${window.location.search || ''}`;
      window.history.replaceState({ appRoutePath: '/dashboard-selection/' }, '', '/dashboard-selection/');
      window.history.pushState({ appRoutePath: appRoute.path }, '', currentUrl);
      currentUrlRef.current = currentUrl;
    }

    if (STATIC_PUBLIC_ROUTE_TYPES.has(appRoute.type)) {
      setRouteLoading(false);
      return;
    }

    if (appRoute.type === 'selection') {
      let cancelled = false;
      setRouteLoading(true);
      getUserDashboards()
        .then((dashboards) => {
          if (cancelled) return;
          if (dashboards.length > 0) {
            const target = dashboards[0];
            setCurrentDashboard(null);
            setData(null);
            navigateTo(`/dashboard/${encodeURIComponent(target.id)}/`, { replace: true, skipPrompt: true });
            return;
          }
          if (currentDashboard) {
            setCurrentDashboard(null);
            setData(null);
          }
          closeDashboardOverlays();
          setRouteLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          if (currentDashboard) {
            setCurrentDashboard(null);
            setData(null);
          }
          closeDashboardOverlays();
          setRouteLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    if (appRoute.type === 'dashboard') {
      if (currentDashboard?.id === appRoute.dashboardId) {
        setRouteLoading(false);
        return;
      }

      let cancelled = false;
      setRouteLoading(true);
      getUserDashboards()
        .then((dashboards) => {
          if (cancelled) return;
          const matchingDashboard = dashboards.find((dashboard) => dashboard.id === appRoute.dashboardId);
          if (matchingDashboard) {
            setCurrentDashboard(matchingDashboard);
          } else {
            setCurrentDashboard(null);
            setData(null);
            setAccessIssue({
              type: 'forbidden',
              title: 'You do not have access to this dashboard',
              message: 'The dashboard may have been removed, or your account is not a member of it anymore.'
            });
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCurrentDashboard(null);
            setData(null);
            setAccessIssue({
              type: 'unrecoverable',
              title: 'We could not check that dashboard',
              message: 'Couple Planner could not confirm your access right now. Try again from dashboard selection.'
            });
          }
        })
        .finally(() => {
          if (!cancelled) setRouteLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [authLoading, currentUser?.id, appRoute.type, appRoute.dashboardId, currentDashboard?.id]);

  useEffect(() => {
    if (appRoute.type === 'not-found') {
      document.title = 'Couple Planner - Page not found';
      return;
    }
    if (appRoute.type === 'privacy') {
      document.title = 'Couple Planner - Privacy Policy';
      return;
    }
    if (appRoute.type === 'terms') {
      document.title = 'Couple Planner - Terms of Service';
      return;
    }
    if (appRoute.type === 'bug-report') {
      document.title = 'Couple Planner - Report a Bug';
      return;
    }
    if (appRoute.type === 'login') {
      document.title = 'Couple Planner - Sign in';
      return;
    }
    if (!currentUser) {
      document.title = 'Couple Planner - Homepage';
    } else if (!currentDashboard) {
      document.title = 'Couple Planner - Create/ Join a dashboard';
    } else {
      document.title = `Couple Planner - ${currentDashboard.name}`;
    }
  }, [appRoute.type, currentUser, currentDashboard]);

  useEffect(() => {
    if (!currentDashboard) return;

    const enabledSections = getEnabledSections(currentDashboard);
    const activeSection = activeCategory === 'media' ? 'watchlist' : activeSubTab;
    if (enabledSections.includes(activeSection)) return;

    const nextView = sectionToView(enabledSections[0] || 'calendar');
    setActiveCategory(nextView.category);
    setActiveSubTab(nextView.subTab);
  }, [currentDashboard, activeCategory, activeSubTab]);

  // Load data when dashboard changes
  useEffect(() => {
    if (!currentDashboard) return;
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      dataEditedAfterLoadRef.current = false;
      const cachedDashboardData = window.getCachedDashboardData?.(currentDashboard.id);
      if (cachedDashboardData && !cancelled) {
        skipNextSaveRef.current = true;
        setData(normalizeDashboardDataForClient(cachedDashboardData));
        setLoading(false);
      }

      const DashboardData = await getDashboardData(currentDashboard.id);
      if (cancelled) return;
      if (dataEditedAfterLoadRef.current) return;

      skipNextSaveRef.current = true;
      if (DashboardData) {
        setData(normalizeDashboardDataForClient(DashboardData));
      } else {
        setData(defaultDashboardData());
      }
      setLoading(false);
    };
    loadData();

    return () => {
      cancelled = true;
    };
  }, [currentDashboard]);

  // Persist data
  useEffect(() => {
    if (!currentDashboard || !data) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    dataEditedAfterLoadRef.current = true;
    saveDashboardData(currentDashboard.id, data).then((saved) => {
      if (saved) setLastSynced(Date.now());
    });
  }, [data, currentDashboard?.id]);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    const params = new URLSearchParams(window.location.search);
    const inviteDashboard = params.get('inviteDashboard');
    const inviteCode = params.get('inviteCode');
    const inviteQuery = inviteDashboard && inviteCode
      ? `?inviteDashboard=${encodeURIComponent(inviteDashboard)}&inviteCode=${encodeURIComponent(inviteCode)}`
      : '';
    if (inviteQuery) {
      navigateTo(`/dashboard-selection/${inviteQuery}`);
      return;
    }

    setRouteLoading(true);
    try {
      const dashboards = await getUserDashboards();
      if (dashboards.length > 0) {
        navigateTo(`/dashboard/${encodeURIComponent(dashboards[0].id)}/`, { replace: true, skipPrompt: true });
      } else {
        navigateTo('/dashboard-selection/', { replace: true, skipPrompt: true });
      }
    } finally {
      setRouteLoading(false);
    }
  };
  const handleAccountUpdate = (user) => setCurrentUser(user);
  const handleLogout = () => {
    flushPendingDashboardSavesViaBeacon();
    clearAuthToken();
    setCurrentUser(null);
    setCurrentDashboard(null);
    setData(null);
    closeDashboardOverlays();
    navigateTo('/', { replace: true, skipPrompt: true });
  };
  const handleDashboardSelect = (dashboard) => {
    setCurrentDashboard(dashboard);
    setData(null);
    navigateTo(`/dashboard/${encodeURIComponent(dashboard.id)}/`);
  };
  const handleBackToDashboards = async () => {
    if (!confirmRouteChange(readAppRoute('/dashboard-selection/'))) return;
    await flushPendingDashboardSaves();
    setCurrentDashboard(null);
    setData(null);
    closeDashboardOverlays();
    navigateTo('/dashboard-selection/', { skipPrompt: true });
  };
  const handleLeaveDashboard = async () => {
    if (!currentDashboard) return;
    try {
      await leaveDashboard(currentDashboard.id);
    } catch (error) {
      console.error('Failed to leave dashboard:', error);
      window.alert(error?.message || 'Failed to leave dashboard. Please try again.');
      return;
    }
    setCurrentDashboard(null);
    setData(null);
    closeDashboardOverlays();
    navigateTo('/dashboard-selection/', { replace: true, skipPrompt: true });
  };

  const handleCategoryChange = (category, subTab) => {
    setActiveCategory(category);
    setActiveSubTab(category === 'media' && !subTab ? 'tvshows' : subTab);
  };

  // Data mutation handlers (unchanged)
  const handleAddMedia = (item) => {
    const defaultStatus = getDefaultStatus(item.category);
    const newItem = normalizeWatchlistItem({ ...item, status: defaultStatus }, item.category);
    setData(prev => ({ ...prev, watchlist: [...(prev.watchlist || []), newItem] }));
  };
  const handleStatusChange = (mediaType, id, newStatus) => {
    if (newStatus === 'remove') {
      const item = (data?.watchlist || []).find(i => i.category === mediaType && i.id === id);
      const labelByType = { tvshows: 'TV show', movies: 'movie', books: 'book' };
      requestConfirmation({
        title: `Remove ${labelByType[mediaType] || 'item'}?`,
        message: `${getItemLabel(item, `this ${labelByType[mediaType] || 'item'}`)} will be removed from the shared watchlist.`,
        confirmLabel: 'Remove'
      }, () => {
        setData(prev => ({ ...prev, watchlist: (prev.watchlist || []).filter(i => !(i.category === mediaType && i.id === id)) }));
      });
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
  const handleDeleteEvent = (id, event = null) => {
    const sourceEvent = event || (data?.calendarEvents || []).find(e => e.id === id);
    const isRecurring = Boolean(sourceEvent?.recurrence);
    requestConfirmation({
      title: isRecurring ? 'Delete recurring activity?' : 'Delete activity?',
      message: isRecurring
        ? `${getItemLabel(sourceEvent, 'This activity')} and all of its occurrences will be deleted from this dashboard.`
        : `${getItemLabel(sourceEvent, 'This activity')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => {
      setData(prev => ({ ...prev, calendarEvents: prev.calendarEvents.filter(e => e.id !== id) }));
    });
  };
  const handleEditEvent = (event) => { setEditingEvent(event); setEditEventModalOpen(true); };
  const handleSaveEvent = (updatedEvent) => {
    setData(prev => ({ ...prev, calendarEvents: prev.calendarEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e) }));
  };
  const handleAddTrip = (trip) => setData(prev => ({ ...prev, trips: [...(prev.trips || []), trip] }));
  const handleDeleteTrip = (id) => {
    const trip = (data?.trips || []).find(t => t.id === id);
    requestConfirmation({
      title: 'Delete trip?',
      message: `${getItemLabel(trip, 'This trip')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => setData(prev => ({ ...prev, trips: prev.trips.filter(t => t.id !== id) })));
  };
  const handleEditTrip = (trip) => { setEditingTrip(trip); setEditTripModalOpen(true); };
  const handleSaveTrip = (updatedTrip) => {
    setData(prev => ({ ...prev, trips: prev.trips.map(t => t.id === updatedTrip.id ? updatedTrip : t) }));
  };
  const handleAddRecipe = (recipe) => setData(prev => ({ ...prev, recipes: [...(prev.recipes || []), recipe] }));
  const handleDeleteRecipe = (id) => {
    const recipe = (data?.recipes || []).find(r => r.id === id);
    requestConfirmation({
      title: 'Delete recipe?',
      message: `${getItemLabel(recipe, 'This recipe')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => setData(prev => ({ ...prev, recipes: prev.recipes.filter(r => r.id !== id) })));
  };
  const handleEditRecipe = (recipe) => { setEditingRecipe(recipe); setEditRecipeModalOpen(true); };
  const handleSaveRecipe = (updatedRecipe) => {
    setData(prev => ({ ...prev, recipes: prev.recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r) }));
  };
  const withGeocodedAddress = async (place) => {
    const address = String(place?.address || '').trim();
    const hasCoordinates = Number.isFinite(Number(place?.lat)) && Number.isFinite(Number(place?.lng));
    if (!address || hasCoordinates || ['resolved', 'unresolved', 'failed', 'empty'].includes(place?.geocodingStatus)) return place;

    const geocoded = window.geocodeAddress
      ? await window.geocodeAddress(address)
      : { lat: null, lng: null, status: 'failed', error: 'Address lookup unavailable' };

    return {
      ...place,
      address,
      lat: geocoded.lat,
      lng: geocoded.lng,
      geocodingStatus: geocoded.status,
      geocodingError: geocoded.error || '',
      geocodedAddress: geocoded.displayName || '',
      geocodedAt: geocoded.status === 'resolved' ? new Date().toISOString() : null
    };
  };

  const handleAddDate = async (place) => {
    const nextPlace = await withGeocodedAddress(place);
    setData(prev => ({ ...prev, locations: [...(prev.locations || []), nextPlace] }));
  };
  const handleDeleteDate = (id) => {
    const place = (data?.locations || []).find(p => p.id === id);
    requestConfirmation({
      title: 'Delete location?',
      message: `${getItemLabel(place, 'This location')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => setData(prev => ({ ...prev, locations: prev.locations.filter(p => p.id !== id) })));
  };
  const handleToggleFavouriteDate = (id) => {
    setData(prev => ({ ...prev, locations: prev.locations.map(p => p.id === id ? { ...p, isFavourite: !p.isFavourite } : p) }));
  };
  const handleUpdateDate = async (id, updates) => {
    if (Object.prototype.hasOwnProperty.call(updates || {}, 'address')) {
      const current = (data?.locations || []).find(p => p.id === id);
      const nextAddress = String(updates?.address || '').trim();
      const currentAddress = String(current?.address || '').trim();
      if (nextAddress === currentAddress) {
        setData(prev => ({ ...prev, locations: prev.locations.map(p => p.id === id ? { ...p, ...updates, address: nextAddress } : p) }));
        return;
      }
      const nextPlace = await withGeocodedAddress({
        ...current,
        ...updates,
        address: nextAddress,
        lat: null,
        lng: null,
        geocodingStatus: '',
        geocodingError: '',
        geocodedAddress: '',
        geocodedAt: null
      });
      setData(prev => ({ ...prev, locations: prev.locations.map(p => p.id === id ? { ...p, ...nextPlace } : p) }));
      return;
    }
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
  const handleDeleteTask = (id) => {
    const task = (data?.tasks || []).find(t => t.id === id);
    requestConfirmation({
      title: 'Delete task?',
      message: `${getItemLabel(task, 'This task')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) })));
  };
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

  const addActionByTab = {
    calendar: { label: 'Activity', icon: 'CalendarIcon' },
    tasks: { label: 'Task', icon: 'CheckSquare' },
    locations: { label: 'Location', icon: 'MapPin' },
    trips: { label: 'Trip', icon: 'Film' },
    recipes: { label: 'Recipe', icon: 'ChefHat' },
    tvshows: { label: 'TV Show', icon: 'Tv' },
    movies: { label: 'Movie', icon: 'Film' },
    books: { label: 'Book', icon: 'Book' }
  };

  const renderPageAddButton = () => {
    if (activeCategory === 'media') return null;

    const action = addActionByTab[activeSubTab];
    if (!action) return null;

    const Icon = getTrackerComponent(action.icon);
    const Plus = getTrackerComponent('Plus');

    return (
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setAddCategory(activeSubTab);
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
        >
          <Plus size={16} />
          <Icon size={16} />
          Add {action.label}
        </button>
      </div>
    );
  };

  // Update dashboard settings (name)
  const handleSaveDashboardSettings = (newSettings) => {
    const previousDashboard = currentDashboard;
    setCurrentDashboard(prev => ({ ...prev, ...newSettings }));

    return updateDashboard(currentDashboard.id, newSettings)
      .then((updatedDashboard) => {
        if (updatedDashboard) {
          setCurrentDashboard(prev => ({
            ...prev,
            ...updatedDashboard,
            role: updatedDashboard.role || prev?.role,
            members: Array.isArray(updatedDashboard.members) ? updatedDashboard.members : prev?.members
          }));
        }
        return updatedDashboard;
      })
      .catch((error) => {
        console.error('Failed to persist dashboard settings:', error);
        setCurrentDashboard(previousDashboard);
        throw error;
      });
  };

  const activeMediaItems = useMemo(
    () => activeSubTab
      ? (data?.watchlist || []).filter(item => item.category === activeSubTab)
      : (data?.watchlist || []),
    [data?.watchlist, activeSubTab]
  );
  const LoadingScreen = window.getWindowComponent?.('LoadingScreen', window.MissingComponent) || window.MissingComponent;
  const FailureScreen = window.getWindowComponent?.('FailureScreen', window.MissingComponent) || window.MissingComponent;
  const PrivacyPolicyPage = window.getWindowComponent?.('PrivacyPolicyPage', window.MissingComponent) || window.MissingComponent;
  const TermsOfServicePage = window.getWindowComponent?.('TermsOfServicePage', window.MissingComponent) || window.MissingComponent;
  const BugReportPage = window.getWindowComponent?.('BugReportPage', window.MissingComponent) || window.MissingComponent;
  const LoginScreen = window.getWindowComponent?.('LoginScreen', window.MissingComponent) || window.MissingComponent;
  const HomePage = window.getWindowComponent?.('HomePage', window.MissingComponent) || window.MissingComponent;
  const DashboardSelector = window.getWindowComponent?.('DashboardSelector', window.MissingComponent) || window.MissingComponent;
  const TasksView = window.getWindowComponent?.('TasksView', window.MissingComponent) || window.MissingComponent;
  const CalendarView = window.getWindowComponent?.('CalendarView', window.MissingComponent) || window.MissingComponent;
  const DatesView = window.getWindowComponent?.('DatesView', window.MissingComponent) || window.MissingComponent;
  const TripsView = window.getWindowComponent?.('TripsView', window.MissingComponent) || window.MissingComponent;
  const RecipesView = window.getWindowComponent?.('RecipesView', window.MissingComponent) || window.MissingComponent;
  const MediaSectionsView = window.getWindowComponent?.('MediaSectionsView', window.MissingComponent) || window.MissingComponent;
  const Header = window.getWindowComponent?.('Header', window.MissingComponent) || window.MissingComponent;
  const AddModal = window.getWindowComponent?.('AddModal', window.MissingComponent) || window.MissingComponent;
  const EditEventModal = window.getWindowComponent?.('EditEventModal', window.MissingComponent) || window.MissingComponent;
  const ProfileModal = window.getWindowComponent?.('ProfileModal', window.MissingComponent) || window.MissingComponent;
  const ShareDashboardModal = window.getWindowComponent?.('ShareDashboardModal', window.MissingComponent) || window.MissingComponent;
  const EditRecipeModal = window.getWindowComponent?.('EditRecipeModal', window.MissingComponent) || window.MissingComponent;
  const EditTripModal = window.getWindowComponent?.('EditTripModal', window.MissingComponent) || window.MissingComponent;
  const ConfirmationDialog = window.getWindowComponent?.('ConfirmationDialog', window.MissingComponent) || window.MissingComponent;
  const SiteFooter = window.getWindowComponent?.('SiteFooter', null);

  if (authLoading) return <LoadingScreen label="Loading..." />;

  if (appRoute.type === 'not-found') {
    return (
      <FailureScreen
        eyebrow="404"
        title="This page is not in the app"
        message="The link may be mistyped, moved, or no longer available. Head back to a known place and keep planning from there."
        primaryLabel={currentUser ? 'Go to dashboards' : 'Go home'}
        primaryPath={currentUser ? '/dashboard-selection/' : '/'}
        secondaryLabel="Report a bug"
        secondaryPath="/report-a-bug"
        onNavigate={navigateTo}
      />
    );
  }

  if (appRoute.type === 'privacy') {
    return <PrivacyPolicyPage onNavigate={navigateTo} currentUser={currentUser} onUpdateUser={handleAccountUpdate} onLogout={handleLogout} />;
  }
  if (appRoute.type === 'terms') {
    return <TermsOfServicePage onNavigate={navigateTo} currentUser={currentUser} onUpdateUser={handleAccountUpdate} onLogout={handleLogout} />;
  }
  if (appRoute.type === 'bug-report') {
    return <BugReportPage onNavigate={navigateTo} currentUser={currentUser} />;
  }

  if (!currentUser) {
    if (accessIssue?.type === 'unauthorized') {
      const loginTarget = `${window.location.pathname}${window.location.search || ''}`.startsWith('/dashboard-selection/')
        ? `/login${window.location.search || ''}`
        : '/login';
      return (
        <FailureScreen
          eyebrow="Private page"
          title={accessIssue.title}
          message={accessIssue.message}
          primaryLabel="Sign in"
          primaryPath={loginTarget}
          secondaryLabel="Go home"
          secondaryPath="/"
          onNavigate={navigateTo}
        />
      );
    }
    if (appRoute.type === 'login') {
      return <LoginScreen onLogin={handleLogin} onNavigate={navigateTo} />;
    }
    return <HomePage onNavigate={navigateTo} />;
  }

  if (appRoute.type === 'home') {
    return <HomePage onNavigate={navigateTo} currentUser={currentUser} onUpdateUser={handleAccountUpdate} onLogout={handleLogout} />;
  }

  // Signed-in users on the login route are on their way to /dashboard-selection/.
  if (appRoute.type === 'login') {
    return <LoadingScreen label="Loading..." />;
  }

  if (routeLoading) return <LoadingScreen label="Loading..." />;
  if (accessIssue) {
    return (
      <FailureScreen
        eyebrow={accessIssue.type === 'forbidden' ? 'Access denied' : 'App error'}
        title={accessIssue.title || 'We could not open this dashboard'}
        message={accessIssue.message || 'Couple Planner could not finish this request. Try again from a safe place.'}
        primaryLabel="Go to dashboards"
        primaryPath="/dashboard-selection/"
        secondaryLabel="Report a bug"
        secondaryPath="/report-a-bug"
        onNavigate={navigateTo}
      />
    );
  }
  if (!currentDashboard) {
    return (
      <DashboardSelector
        userId={currentUser.id}
        currentUser={currentUser}
        onSelectDashboard={handleDashboardSelect}
        onUpdateUser={handleAccountUpdate}
        onNavigate={navigateTo}
        onBackToLogin={handleLogout}
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
        dashboardName={currentDashboard.name}
        dashboard={currentDashboard}
        onEditDashboard={() => setSettingsModalOpen(true)}
        activeCategory={activeCategory}
        activeSubTab={activeSubTab}
        onCategoryChange={handleCategoryChange}
        onSettingsClick={() => setSettingsModalOpen(true)}
        onAccountClick={() => setAccountModalOpen(true)}
        onShareClick={() => setShareModalOpen(true)}
        onBackToDashboards={handleBackToDashboards}
        currentUser={currentUser}
        onUpdateUser={handleAccountUpdate}
        onLogout={handleLogout}
        onLeaveDashboard={handleLeaveDashboard}
        onSaveDashboard={handleSaveDashboardSettings}
        enabledSections={getEnabledSections(currentDashboard)}
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
      {SiteFooter ? <SiteFooter onNavigate={navigateTo} /> : null}

      {/* Modals */}
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
      <ProfileModal
        mode="settings"
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        dashboard={currentDashboard}
        onSaveDashboard={handleSaveDashboardSettings}
      />
      <ProfileModal
        mode="account"
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        currentUser={currentUser}
        onSaveAccount={handleAccountUpdate}
        onLogout={handleLogout}
        onLeaveDashboard={handleLeaveDashboard}
      />
      <ShareDashboardModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} dashboard={currentDashboard} />
      <EditRecipeModal isOpen={editRecipeModalOpen} onClose={() => setEditRecipeModalOpen(false)} recipe={editingRecipe} onSave={handleSaveRecipe} />
      <EditTripModal isOpen={editTripModalOpen} onClose={() => setEditTripModalOpen(false)} trip={editingTrip} onSave={handleSaveTrip} />
      <ConfirmationDialog
        isOpen={Boolean(confirmation)}
        title={confirmation?.title || 'Are you sure?'}
        message={confirmation?.message || 'This action cannot be undone.'}
        confirmLabel={confirmation?.confirmLabel || 'Confirm'}
        cancelLabel={confirmation?.cancelLabel || 'Cancel'}
        tone={confirmation?.tone || 'danger'}
        onConfirm={confirmation?.onConfirm}
        onCancel={() => setConfirmation(null)}
      />
    </div>
  );
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
