const DEFAULT_DASHBOARD_SECTIONS = ['calendar', 'tasks', 'locations', 'expenses', 'recipes', 'watchlist'];
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
    locations: [],
    expenses: [],
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

const getEnabledSections = (dashboard) => (
  Array.isArray(dashboard?.enabledSections) && dashboard.enabledSections.length
    ? dashboard.enabledSections
    : DEFAULT_DASHBOARD_SECTIONS
);

const sectionToView = (section) => {
  if (section === 'watchlist') return { category: 'media', subTab: null };
  if (section === 'calendar' || section === 'tasks') return { category: 'plan', subTab: section };
  return { category: 'go', subTab: section };
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
    completionCount: Number(task.completionCount || 0),
    completedAt: task.completedAt || null,
    listType: task.listType === 'shared-checklist' ? 'shared-checklist' : 'task',
    subtasks: Array.isArray(task.subtasks) ? task.subtasks.map((item, idx) => ({ id: item?.id || `subtask-${idx}`, title: String(item?.title || ''), completed: Boolean(item?.completed) })).filter(i => i.title) : []
  };
};

const VALID_EXPENSE_CATEGORIES = new Set(['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'health', 'other']);

const normalizeExpense = (expense = {}) => {
  const rawAmount = expense.amount;
  const amount = (rawAmount === null || rawAmount === undefined || rawAmount === '') ? null : (Number.isFinite(Number(rawAmount)) ? Number(rawAmount) : null);
  const category = VALID_EXPENSE_CATEGORIES.has(String(expense.category || '')) ? String(expense.category) : 'other';
  const splitBy = Array.isArray(expense.splitBy) ? expense.splitBy.map((item, idx) => ({
    id: item?.id || `split-${idx}`,
    name: String(item?.name || '').trim(),
    percent: Number.isFinite(Number(item?.percent)) ? Number(item.percent) : 0
  })).filter(item => item.name) : [];
  const billSplits = Array.isArray(expense.billSplits) ? expense.billSplits.map((item, idx) => ({
    id: item?.id || `bill-${idx}`,
    category: VALID_EXPENSE_CATEGORIES.has(String(item?.category || '')) ? String(item.category) : 'other',
    amount: Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0,
    note: String(item?.note || '')
  })) : [];

  return {
    ...expense,
    description: expense.description || '',
    amount,
    category,
    date: expense.date || '',
    paidBy: expense.paidBy || '',
    notes: expense.notes || '',
    recurrence: expense?.recurrence?.frequency ? {
      frequency: expense.recurrence.frequency,
      until: expense.recurrence.until || ''
    } : null,
    splitBy,
    billSplits
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
    progress: category === 'books' ? bookProgress : item.progress,
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
    expenses: asArray(raw.expenses).map(normalizeExpense),
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
  normalizeWatchlistItem,
  readAppRoute,
  sectionToView
});
