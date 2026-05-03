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
  const [activeSubTab, setActiveSubTab] = useState(() => window.localStorage?.getItem('cp:last-media-type') || 'calendar');
  const [mediaWatchFilter, setMediaWatchFilter] = useState(() => window.localStorage?.getItem('cp:watch-filter') || 'together');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editRecipeModalOpen, setEditRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [addEventInitialData, setAddEventInitialData] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const skipNextSaveRef = useRef(false);
  const dataEditedAfterLoadRef = useRef(false);
  const initialRouteRef = useRef(readAppRoute());
  const directDashboardHistorySeededRef = useRef(false);
  const currentUrlRef = useRef(`${window.location.pathname}${window.location.search}`);
  const appRouteRef = useRef(appRoute);
  const hasOpenDashboardDraftRef = useRef(false);
  const pendingDeletionsRef = useRef({});
  const lastSaveStatusRef = useRef('idle');

  const requestConfirmation = (options, onConfirm) => {
    setConfirmation({
      ...options,
      onConfirm: () => {
        setConfirmation(null);
        onConfirm();
      }
    });
  };

  const trackDeletion = (section, id) => {
    if (!section || id == null) return;
    const key = String(id);
    const current = pendingDeletionsRef.current[section] || [];
    if (current.includes(key)) return;
    pendingDeletionsRef.current = {
      ...pendingDeletionsRef.current,
      [section]: [...current, key]
    };
  };

  const getItemLabel = (item, fallback) => {
    const rawLabel = item?.title || item?.name || item?.description || fallback;
    return rawLabel ? `"${rawLabel}"` : fallback;
  };

  const closeDashboardOverlays = () => {
    setAddModalOpen(false);
    setAddCategory(null);
    setEditRecipeModalOpen(false);
    setEditingRecipe(null);
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
        || editEventModalOpen
        || confirmation
      )
    );
  }, [
    currentDashboard,
    addModalOpen,
    editRecipeModalOpen,
    editEventModalOpen,
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
        const cachedDashboards = window.getCachedUserDashboards?.(currentUser.id) || [];
        if (cachedDashboards.length > 0) {
          window.perfLog?.('login route redirected from dashboard cache', { count: cachedDashboards.length });
          navigateTo(`/dashboard/${encodeURIComponent(cachedDashboards[0].id)}/`, { replace: true, skipPrompt: true });
          getUserDashboards().catch(() => {});
          return;
        }

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
        getUserDashboards()
          .then((dashboards) => {
            const matchingDashboard = dashboards.find((dashboard) => dashboard.id === appRoute.dashboardId);
            if (matchingDashboard) {
              setCurrentDashboard(matchingDashboard);
            }
          })
          .catch(() => {});
        return;
      }

      let cancelled = false;
      const cachedDashboards = window.getCachedUserDashboards?.(currentUser.id) || [];
      const cachedDashboard = cachedDashboards.find((dashboard) => dashboard.id === appRoute.dashboardId);
      if (cachedDashboard) {
        window.perfLog?.('dashboard shell rendered from cache', { dashboardId: appRoute.dashboardId });
        setCurrentDashboard(cachedDashboard);
        setRouteLoading(false);
      } else {
        setRouteLoading(true);
      }

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
      dataEditedAfterLoadRef.current = false;
      pendingDeletionsRef.current = {};
      const cachedDashboardData = window.getCachedDashboardData?.(currentDashboard.id);

      // Show cached data immediately if available
      if (cachedDashboardData && !cancelled) {
        skipNextSaveRef.current = true;
        setData(normalizeDashboardDataForClient(cachedDashboardData));
        setLoading(false);
      } else {
        // Only show loading if no cached data
        skipNextSaveRef.current = true;
        setData(defaultDashboardData());
        setLoading(false);
      }

      // Fetch fresh data in background
      window.perfLog?.('dashboard data fetch start', { dashboardId: currentDashboard.id });
      const DashboardData = await getDashboardData(currentDashboard.id);
      if (cancelled) return;
      if (dataEditedAfterLoadRef.current) return;

      skipNextSaveRef.current = true;
      if (DashboardData) {
        setData(normalizeDashboardDataForClient(DashboardData));
      } else if (!cachedDashboardData) {
        // Only set default if no cached data and fetch failed
        setData(defaultDashboardData());
      }
      window.perfLog?.('dashboard data ready', { dashboardId: currentDashboard.id, usedCachedData: Boolean(cachedDashboardData) });
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
    const deletionsToSend = pendingDeletionsRef.current;
    pendingDeletionsRef.current = {};

    saveDashboardData(currentDashboard.id, data, { deletions: deletionsToSend }).then((saved) => {
      if (saved) {
        setLastSynced(Date.now());
        if (lastSaveStatusRef.current === 'failed') {
          window.showToast?.({ type: 'success', message: 'Back online — your changes are saved.' });
        }
        lastSaveStatusRef.current = 'ok';
      } else if (lastSaveStatusRef.current !== 'failed') {
        // Restore deletions so next save retry includes them
        const restored = { ...pendingDeletionsRef.current };
        Object.entries(deletionsToSend || {}).forEach(([section, ids]) => {
          const set = new Set(restored[section] || []);
          (ids || []).forEach(id => set.add(id));
          restored[section] = Array.from(set);
        });
        pendingDeletionsRef.current = restored;
        lastSaveStatusRef.current = 'failed';
        window.showToast?.({
          type: 'error',
          message: 'Could not sync your latest changes. We will retry automatically.'
        });
      }
    });
  }, [data, currentDashboard?.id]);

  // Listen for server-side merge results — adopt the merged state and notify the user.
  useEffect(() => {
    if (!currentDashboard || !window.onDashboardSync) return undefined;
    const unsubscribe = window.onDashboardSync((event) => {
      if (event?.type !== 'merged' || event.dashboardId !== currentDashboard.id) return;
      skipNextSaveRef.current = true;
      setData(normalizeDashboardDataForClient(event.data));
      setLastSynced(Date.now());
      window.showToast?.({
        type: 'info',
        title: 'Synced with your partner',
        message: 'New changes from another device were merged into this dashboard.',
        duration: 6000
      });
    });
    return unsubscribe;
  }, [currentDashboard?.id]);

  const handleLogin = async (user) => {
    window.perfLog?.('login accepted');
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

    const cachedDashboards = window.getCachedUserDashboards?.(user.id) || [];
    if (cachedDashboards.length > 0) {
      const firstDashboard = cachedDashboards[0];
      window.perfLog?.('login navigating from dashboard cache', { dashboardId: firstDashboard.id });
      getUserDashboards().catch(() => {});
      getDashboardData(firstDashboard.id).catch(() => {});
      navigateTo(`/dashboard/${encodeURIComponent(firstDashboard.id)}/`, { replace: true, skipPrompt: true });
      return;
    }

    window.perfLog?.('login has no dashboard cache');
    navigateTo('/dashboard-selection/', { replace: true, skipPrompt: true });
    getUserDashboards()
      .then((dashboards) => {
        if (dashboards.length > 0) {
          const firstDashboard = dashboards[0];
          getDashboardData(firstDashboard.id).catch(() => {});
          navigateTo(`/dashboard/${encodeURIComponent(firstDashboard.id)}/`, { replace: true, skipPrompt: true });
        }
      })
      .catch(() => {});
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
      window.showToast?.({ type: 'error', message: error?.message || 'Failed to leave dashboard. Please try again.' });
      return;
    }
    setCurrentDashboard(null);
    setData(null);
    closeDashboardOverlays();
    window.showToast?.({ type: 'success', message: 'You exited the dashboard.' });
    navigateTo('/dashboard-selection/', { replace: true, skipPrompt: true });
  };

  const handleCategoryChange = (category, subTab) => {
    setActiveCategory(category);
    setActiveSubTab(category === 'media' && !subTab ? 'tvshows' : subTab);
  };
  useEffect(() => {
    if (['tvshows', 'movies', 'books'].includes(activeSubTab)) window.localStorage?.setItem('cp:last-media-type', activeSubTab);
  }, [activeSubTab]);
  useEffect(() => {
    window.localStorage?.setItem('cp:watch-filter', mediaWatchFilter);
  }, [mediaWatchFilter]);

  // Data mutation handlers (unchanged)
  const handleAddMedia = (item) => {
    const defaultStatus = getDefaultStatus(item.category);
    const newItem = normalizeWatchlistItem({ ...item, status: defaultStatus, watchingMode: item.watchingMode || mediaWatchFilter }, item.category);
    setData(prev => ({ ...prev, watchlist: [...(prev.watchlist || []), newItem] }));
  };
  const handleStatusChange = (mediaType, id, newStatus) => {
    if (newStatus === 'remove') {
      const item = (data?.watchlist || []).find(i => i.category === mediaType && i.id === id);
      const labelByType = { tvshows: 'TV show', movies: 'movie', books: 'book' };
      requestConfirmation({
        title: `Remove ${labelByType[mediaType] || 'item'}?`,
        message: `${getItemLabel(item, `this ${labelByType[mediaType] || 'item'}`)} will be removed from shared entertainment.`,
        confirmLabel: 'Remove'
      }, () => {
        trackDeletion('watchlist', id);
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
    const enriched = {
      ...event,
      createdByUserId: currentUser?.id ?? null,
      createdByName: currentUser?.name || currentUser?.username || null
    };
    setData(prev => ({ ...prev, calendarEvents: [...(prev.calendarEvents || []), enriched] }));
  };

  const handleRescheduleEvent = (eventId, newStartIso) => {
    setData(prev => ({
      ...prev,
      calendarEvents: (prev.calendarEvents || []).map(e => {
        if (e.id !== eventId) return e;
        const oldStart = e.startDate || e.date || newStartIso;
        const oldEnd = e.endDate || oldStart;
        const durationMs = Math.max(0, new Date(oldEnd + 'T00:00:00') - new Date(oldStart + 'T00:00:00'));
        const newStartDate = new Date(newStartIso + 'T00:00:00');
        const newEndDate = new Date(newStartDate.getTime() + durationMs);
        const pad = n => String(n).padStart(2, '0');
        const toIso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        return { ...e, date: newStartIso, startDate: newStartIso, endDate: toIso(newEndDate) };
      })
    }));
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
      trackDeletion('calendarEvents', id);
      setData(prev => ({ ...prev, calendarEvents: prev.calendarEvents.filter(e => e.id !== id) }));
    });
  };
  const handleEditEvent = (event) => { setEditingEvent(event); setEditEventModalOpen(true); };
  const handleSaveEvent = (updatedEvent) => {
    setData(prev => ({ ...prev, calendarEvents: prev.calendarEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e) }));
  };
  const handleAddTrip = (trip) => setData(prev => ({
    ...prev,
    trips: [...(prev.trips || []), window.normalizeTrip ? window.normalizeTrip(trip) : trip]
  }));
  const handleDeleteTrip = (id) => {
    const trip = (data?.trips || []).find(t => t.id === id);
    requestConfirmation({
      title: 'Delete trip?',
      message: `${getItemLabel(trip, 'This trip')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => {
      trackDeletion('trips', id);
      setData(prev => ({ ...prev, trips: (prev.trips || []).filter(t => t.id !== id) }));
    });
  };
  const handleUpdateTrip = (id, updates) => {
    setData(prev => ({
      ...prev,
      trips: (prev.trips || []).map(t => t.id === id ? (window.normalizeTrip ? window.normalizeTrip({ ...t, ...updates }) : { ...t, ...updates }) : t)
    }));
  };
  const handleAddRecipe = (recipe) => setData(prev => ({ ...prev, recipes: [...(prev.recipes || []), recipe] }));
  const handleDeleteRecipe = (id) => {
    const recipe = (data?.recipes || []).find(r => r.id === id);
    requestConfirmation({
      title: 'Delete recipe?',
      message: `${getItemLabel(recipe, 'This recipe')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => {
      trackDeletion('recipes', id);
      setData(prev => ({ ...prev, recipes: prev.recipes.filter(r => r.id !== id) }));
    });
  };
  const handleEditRecipe = (recipe) => { setEditingRecipe(recipe); setEditRecipeModalOpen(true); };
  const handleSaveRecipe = (updatedRecipe) => {
    setData(prev => ({ ...prev, recipes: prev.recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r) }));
  };
  const handleToggleFavouriteRecipe = (recipeOrId) => {
    const recipeId = typeof recipeOrId === 'object' ? recipeOrId?.id : recipeOrId;
    if (!recipeId) return;
    setData(prev => ({
      ...prev,
      recipes: (prev.recipes || []).map(r => r.id === recipeId ? { ...r, isFavourite: !r.isFavourite } : r)
    }));
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
    setData(prev => ({ ...prev, dates: [...(prev.dates || []), nextPlace] }));
  };
  const handleDeleteDate = (id) => {
    const place = (data?.dates || []).find(p => p.id === id);
    requestConfirmation({
      title: 'Delete date?',
      message: `${getItemLabel(place, 'This date')} will be deleted from this dashboard.`,
      confirmLabel: 'Delete'
    }, () => {
      trackDeletion('dates', id);
      setData(prev => ({ ...prev, dates: (prev.dates || []).filter(p => p.id !== id) }));
    });
  };
  const handleToggleFavouriteDate = (id) => {
    setData(prev => ({ ...prev, dates: (prev.dates || []).map(p => p.id === id ? { ...p, isFavourite: !p.isFavourite } : p) }));
  };
  const handleUpdateDate = async (id, updates) => {
    if (Object.prototype.hasOwnProperty.call(updates || {}, 'address')) {
      const current = (data?.dates || []).find(p => p.id === id);
      const nextAddress = String(updates?.address || '').trim();
      const currentAddress = String(current?.address || '').trim();
      if (nextAddress === currentAddress) {
        setData(prev => ({ ...prev, dates: (prev.dates || []).map(p => p.id === id ? { ...p, ...updates, address: nextAddress } : p) }));
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
      setData(prev => ({ ...prev, dates: (prev.dates || []).map(p => p.id === id ? { ...p, ...nextPlace } : p) }));
      return;
    }
    setData(prev => ({ ...prev, dates: (prev.dates || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
  };
  const handleAddTask = (task) => setData(prev => ({ ...prev, tasks: [...(prev.tasks || []), normalizeTask(task)] }));
  const handleToggleTask = (id, checked) => {
    const completedByName = currentUser?.name || currentUser?.username || null;
    const completedBy = currentUser?.id || null;
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== id) return t;
        const history = Array.isArray(t.completionHistory) ? t.completionHistory : [];
        if (t.recurrence) {
          if (checked === false) {
            return {
              ...t,
              completed: false,
              lastCompletedAt: null,
              completionCount: Math.max(0, Number(t.completionCount || 0) - 1),
              completionHistory: history.slice(0, -1)
            };
          }
          const completedAt = new Date().toISOString();
          return {
            ...t,
            completed: false,
            lastCompletedAt: completedAt,
            completionCount: Number(t.completionCount || 0) + 1,
            completionHistory: [...history, { completedAt, completedBy, completedByName }]
          };
        }
        const completed = typeof checked === 'boolean' ? checked : !t.completed;
        const completedAt = completed ? new Date().toISOString() : null;
        return {
          ...t,
          completed,
          completedAt,
          completionHistory: completed
            ? [...history, { completedAt, completedBy, completedByName }]
            : history.slice(0, -1)
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
    }, () => {
      trackDeletion('tasks', id);
      setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    });
  };
  const handleUpdateTask = (taskId, updatesOrTitle, newDescription) => {
    if (taskId === '__add__' && updatesOrTitle?.__quickChecklist) {
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      setData(prev => ({ ...prev, tasks: [...(prev.tasks || []), normalizeTask({ id: `task-${uid}`, title: updatesOrTitle.title, listType: 'shared-checklist', completed: false, createdAt: new Date().toISOString() })] }));
      return;
    }
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
    dates: { label: 'Date', icon: 'MapPin' },
    trips: { label: 'Trip', icon: 'Plane' },
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
            setAddEventInitialData(null);
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
      ? (data?.watchlist || []).filter(item => item.category === activeSubTab && (item.watchingMode || 'together') === mediaWatchFilter)
      : (data?.watchlist || []),
    [data?.watchlist, activeSubTab, mediaWatchFilter]
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
  const EditRecipeModal = window.getWindowComponent?.('EditRecipeModal', window.MissingComponent) || window.MissingComponent;
  const ConfirmationDialog = window.getWindowComponent?.('ConfirmationDialog', window.MissingComponent) || window.MissingComponent;
  const SiteFooter = window.getWindowComponent?.('SiteFooter', null);
  const MobileBottomNav = window.getWindowComponent?.('MobileBottomNav', null);

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
    return <BugReportPage onNavigate={navigateTo} currentUser={currentUser} onUpdateUser={handleAccountUpdate} onLogout={handleLogout} />;
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
  const visibleData = data || defaultDashboardData();

  // Determine what to render based on category + subTab
  const renderContent = () => {
    if (activeCategory === 'plan') {
      if (activeSubTab === 'tasks') {
        return (
          <TasksView
            tasks={visibleData.tasks || []}
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
            events={visibleData.calendarEvents || []}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
            onAddClick={() => { setAddCategory('calendar'); setAddEventInitialData(null); setAddModalOpen(true); }}
            onAddForDate={(iso) => { setAddCategory('calendar'); setAddEventInitialData({ date: iso }); setAddModalOpen(true); }}
            onRescheduleEvent={handleRescheduleEvent}
            currentUser={currentUser}
          />
        );
      }
    }
    if (activeCategory === 'go') {
      if (activeSubTab === 'dates') {
        return (
          <DatesView
            places={visibleData.dates || []}
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
            trips={visibleData.trips || []}
            onDeleteTrip={handleDeleteTrip}
            onUpdateTrip={handleUpdateTrip}
            onAddClick={() => { setAddCategory('trips'); setAddModalOpen(true); }}
          />
        );
      }
      if (activeSubTab === 'recipes') {
        return (
          <RecipesView
            recipes={visibleData.recipes || []}
            onDeleteRecipe={handleDeleteRecipe}
            onEditRecipe={handleEditRecipe}
            onToggleFavouriteRecipe={handleToggleFavouriteRecipe}
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
          watchFilter={mediaWatchFilter}
          onWatchFilterChange={setMediaWatchFilter}
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
        activeCategory={activeCategory}
        activeSubTab={activeSubTab}
        onCategoryChange={handleCategoryChange}
        onBackToDashboards={handleBackToDashboards}
        currentUser={currentUser}
        onUpdateUser={handleAccountUpdate}
        onLogout={handleLogout}
        onLeaveDashboard={handleLeaveDashboard}
        onSaveDashboard={handleSaveDashboardSettings}
        enabledSections={getEnabledSections(currentDashboard)}
        profile={visibleData?.profile}
      />

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:py-8 lg:px-8 lg:pb-8"
        tabIndex="-1"
      >
        {renderPageAddButton()}
        {renderContent()}
      </main>
      {SiteFooter ? (
        <div className="hidden lg:block">
          <SiteFooter onNavigate={navigateTo} />
        </div>
      ) : null}
      {MobileBottomNav ? (
        <MobileBottomNav
          activeCategory={activeCategory}
          activeSubTab={activeSubTab}
          onCategoryChange={handleCategoryChange}
          enabledSections={getEnabledSections(currentDashboard)}
        />
      ) : null}

      {/* Modals */}
      <AddModal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAddCategory(null); setAddEventInitialData(null); }}
        activeTab={addCategory || activeSubTab}
        onAddMedia={handleAddMedia}
        onAddEvent={handleAddEvent}
        onAddTrip={handleAddTrip}
        onAddRecipe={handleAddRecipe}
        onAddDate={handleAddDate}
        onAddTask={handleAddTask}
        profile={visibleData?.profile}
        initialData={addEventInitialData}
      />
      <EditEventModal isOpen={editEventModalOpen} onClose={() => setEditEventModalOpen(false)} event={editingEvent} onSave={handleSaveEvent} />
      <EditRecipeModal isOpen={editRecipeModalOpen} onClose={() => setEditRecipeModalOpen(false)} recipe={editingRecipe} onSave={handleSaveRecipe} />
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
