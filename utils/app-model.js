const DEFAULT_DASHBOARD_SECTIONS = ['calendar', 'tasks', 'dates', 'trips', 'recipes', 'watchlist'];
const LEGACY_SECTION_MAP = { locations: 'dates', expenses: 'trips' };
const PUBLIC_ROUTE_TYPES = new Set(['home', 'login', 'privacy', 'terms', 'bug-report', 'not-found']);
const STATIC_PUBLIC_ROUTE_TYPES = new Set(['privacy', 'terms', 'bug-report', 'not-found']);
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

const asArray = (value) => Array.isArray(value) ? value : [];

function defaultDashboardData() {
  return {
    calendarEvents: [],
    tasks: [],
    dates: [],
    trips: [],
    recipes: [],
    watchlist: [],
    profile: {
      users: [
        { id: 'user-1', name: 'Diogo', avatar: '', color: '#E63B2E' },
        { id: 'user-2', name: 'Mónica', avatar: '', color: '#8C4F45' }
      ]
    }
  };
}

const normalizeProfileUsers = (users = []) => users.map((user, index) => ({
  ...user,
  name: user.name || '',
  avatar: window.safeImageUrl?.(user.avatar) || '',
  color: LEGACY_PROFILE_COLOR_MAP[user.color] || user.color || (index % 2 === 0 ? '#E63B2E' : '#8C4F45')
}));

const remapLegacySection = (section) => LEGACY_SECTION_MAP[section] || section;

const getEnabledSections = (dashboard) => {
  const raw = Array.isArray(dashboard?.enabledSections) && dashboard.enabledSections.length
    ? dashboard.enabledSections
    : DEFAULT_DASHBOARD_SECTIONS;
  const mapped = raw.map(remapLegacySection);
  return Array.from(new Set(mapped));
};

const sectionToView = (section) => {
  const id = remapLegacySection(section);
  if (id === 'watchlist') return { category: 'media', subTab: null };
  if (id === 'calendar' || id === 'tasks') return { category: 'plan', subTab: id };
  return { category: 'go', subTab: id };
};

const readAppRoute = (pathname = window.location.pathname) => {
  const path = pathname || '/';
  const dashboardMatch = path.match(/^\/dashboard\/([^/]+)\/?$/);

  if (dashboardMatch) {
    return {
      type: 'dashboard',
      dashboardId: decodeURIComponent(dashboardMatch[1]),
      path: `/dashboard/${dashboardMatch[1]}/`
    };
  }

  if (/^\/dashboard-selection\/?$/.test(path)) return { type: 'selection', path: '/dashboard-selection/' };
  if (/^\/login\/?$/.test(path)) return { type: 'login', path: '/login' };
  if (/^\/privacy-policy\/?$/.test(path)) return { type: 'privacy', path: '/privacy-policy' };
  if (/^\/terms-of-service\/?$/.test(path)) return { type: 'terms', path: '/terms-of-service' };
  if (/^\/report-a-bug\/?$/.test(path)) return { type: 'bug-report', path: '/report-a-bug' };
  if (path === '/' || path === '/index.html') return { type: 'home', path: '/' };

  return { type: 'not-found', path };
};

const normalizeCalendarEvent = (event = {}) => {
  const startDate = event.startDate || event.date || '';
  const endDate = event.endDate || startDate;
  const frequency = event.recurrence?.frequency || event.recurrence || event.repeat || 'none';
  const recurrence = ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)
    ? { frequency, until: event.recurrence?.until || event.recurrenceUntil || '' }
    : null;

  return { ...event, date: startDate, startDate, endDate, recurrence };
};

const normalizeTaskRecurrence = (task = {}) => {
  const frequency = task.recurrence?.frequency || task.recurrence || task.repeat || task.recurrenceFrequency || 'none';
  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) return null;
  return { frequency };
};

const VALID_TASK_PRIORITIES = new Set(['low', 'medium', 'high']);

const normalizeTaskPriority = (value) => {
  const raw = String(value || '').toLowerCase();
  return VALID_TASK_PRIORITIES.has(raw) ? raw : null;
};

const normalizeCompletionHistory = (history = []) => (
  Array.isArray(history)
    ? history
      .map(entry => ({
        completedAt: typeof entry?.completedAt === 'string' ? entry.completedAt : '',
        completedBy: entry?.completedBy || null,
        completedByName: entry?.completedByName || ''
      }))
      .filter(entry => entry.completedAt)
    : []
);

const normalizeTask = (task = {}) => {
  const recurrence = normalizeTaskRecurrence(task);
  return {
    ...task,
    description: task.description || '',
    assignedTo: task.assignedTo || null,
    dueDate: task.dueDate || null,
    priority: normalizeTaskPriority(task.priority),
    completed: recurrence ? false : Boolean(task.completed),
    recurrence,
    lastCompletedAt: task.lastCompletedAt || null,
    completionCount: Number(task.completionCount || 0),
    completedAt: task.completedAt || null,
    completionHistory: normalizeCompletionHistory(task.completionHistory),
    listType: task.listType === 'shared-checklist' ? 'shared-checklist' : 'task',
    subtasks: Array.isArray(task.subtasks) ? task.subtasks.map((item, idx) => ({ id: item?.id || `subtask-${idx}`, title: String(item?.title || ''), completed: Boolean(item?.completed) })).filter(i => i.title) : []
  };
};

const VALID_DATE_STATUSES = new Set(['want-to-go', 'visited']);

const normalizeDateStatus = (place = {}) => {
  const raw = String(place?.status || place?.dateStatus || '').toLowerCase();
  if (VALID_DATE_STATUSES.has(raw)) return raw;
  if (place?.beenThere === true) return 'visited';
  return 'want-to-go';
};

const normalizeDatePlace = (place = {}) => {
  const status = normalizeDateStatus(place);
  return {
    ...place,
    name: place?.name || '',
    address: place?.address || '',
    notes: place?.notes || '',
    category: place?.category || 'restaurant',
    link: window.safeExternalUrl?.(place?.link || place?.url) || '',
    photo: window.safeImageUrl?.(place?.photo) || '',
    lat: Number.isFinite(Number(place?.lat)) ? Number(place.lat) : null,
    lng: Number.isFinite(Number(place?.lng)) ? Number(place.lng) : null,
    status,
    beenThere: status === 'visited',
    isFavourite: Boolean(place?.isFavourite),
    starRating: Number.isFinite(Number(place?.starRating)) ? Number(place.starRating) : 0
  };
};

const normalizeChecklistEntries = (items = []) => (
  Array.isArray(items)
    ? items
      .map((item, idx) => ({
        id: item?.id || `entry-${idx}`,
        title: String(item?.title || item?.name || '').trim(),
        notes: String(item?.notes || ''),
        completed: Boolean(item?.completed)
      }))
      .filter(item => item.title)
    : []
);

const normalizeItineraryEntries = (items = []) => (
  Array.isArray(items)
    ? items.map((item, idx) => ({
      id: item?.id || `day-${idx}`,
      day: Number.isFinite(Number(item?.day)) ? Number(item.day) : idx + 1,
      date: item?.date || '',
      title: String(item?.title || '').trim(),
      notes: String(item?.notes || '')
    }))
    : []
);

const normalizeTrip = (trip = {}) => ({
  ...trip,
  destination: String(trip?.destination || trip?.title || '').trim(),
  startDate: trip?.startDate || trip?.dateStart || '',
  endDate: trip?.endDate || trip?.dateEnd || '',
  flights: String(trip?.flights || ''),
  hotel: String(trip?.hotel || ''),
  budget: trip?.budget === null || trip?.budget === undefined || trip?.budget === '' ? null : (Number.isFinite(Number(trip.budget)) ? Number(trip.budget) : null),
  itinerary: normalizeItineraryEntries(trip?.itinerary),
  packingList: normalizeChecklistEntries(trip?.packingList),
  placesToVisit: normalizeChecklistEntries(trip?.placesToVisit),
  restaurants: normalizeChecklistEntries(trip?.restaurants),
  documents: String(trip?.documents || ''),
  notes: String(trip?.notes || '')
});

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
  return { currentPage: clampedCurrentPage, totalPages: totalPages || null };
};

const normalizeWatchlistItem = (item, fallbackCategory) => {
  const category = normalizeMediaCategory(item, fallbackCategory);
  const typeByCategory = { movies: 'Movie', tvshows: 'Tv Show', books: 'Book' };
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
      : (item?.progress && typeof item.progress === 'object'
        ? {
          currentSeason: Number.isFinite(Number(item.progress.currentSeason)) ? Math.max(1, Math.floor(Number(item.progress.currentSeason))) : null,
          currentEpisode: Number.isFinite(Number(item.progress.currentEpisode)) ? Math.max(1, Math.floor(Number(item.progress.currentEpisode))) : null
        }
        : null),
    watchingMode: item.watchingMode === 'alone' ? 'alone' : 'together',
    status: normalizeWatchlistStatus(item, category)
  };
};

const normalizeDashboardDataForClient = (DashboardData = {}) => {
  const raw = DashboardData && typeof DashboardData === 'object' ? DashboardData : {};
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

  const datesSource = asArray(raw.dates).length ? asArray(raw.dates) : asArray(raw.locations);
  const migrated = {
    calendarEvents: asArray(raw.calendarEvents).map(normalizeCalendarEvent),
    tasks: asArray(raw.tasks).map(normalizeTask),
    dates: datesSource.map(normalizeDatePlace),
    trips: asArray(raw.trips).map(normalizeTrip),
    recipes: asArray(raw.recipes).map(recipe => ({
      ...recipe,
      name: recipe?.name || '',
      photo: window.safeImageUrl?.(recipe?.photo) || '',
      link: window.safeExternalUrl?.(recipe?.link || recipe?.url) || '',
      ingredients: recipe?.ingredients || '',
      instructions: recipe?.instructions || '',
      isFavourite: Boolean(recipe?.isFavourite)
    })),
    watchlist: Array.from(watchlistByKey.values()),
    profile: raw.profile || defaultDashboardData().profile
  };

  if (migrated.profile?.users) migrated.profile.users = normalizeProfileUsers(migrated.profile.users);
  return migrated;
};

Object.assign(window, {
  DEFAULT_DASHBOARD_SECTIONS,
  PUBLIC_ROUTE_TYPES,
  STATIC_PUBLIC_ROUTE_TYPES,
  defaultDashboardData,
  getEnabledSections,
  normalizeDashboardDataForClient,
  normalizeTask,
  normalizeTrip,
  normalizeDatePlace,
  normalizeWatchlistItem,
  readAppRoute,
  sectionToView,
  remapLegacySection
});
