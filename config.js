// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  JIKAN: { BASE_URL: 'https://api.jikan.moe/v4', ENDPOINTS: { SEARCH_ANIME: '/anime' } },
  OPEN_LIBRARY: {
    BASE_URL: 'https://openlibrary.org',
    ENDPOINTS: { SEARCH: '/search.json' },
    COVERS_URL: 'https://covers.openlibrary.org/b/id'
  }
};

const STORAGE_CONFIG = {
  KEY: 'media-tracker-data',
  SCHEMA: { calendarEvents: [], tasks: [], locations: [], trips: [], recipes: [], watchlist: [], profile: { users: [] } }
};

const API_BASE_URL = '';

const FEATURES = { USE_REMOTE_STORAGE: true, SYNC_ENABLED: true };

const STATUS_CONFIG = {
  MOVIES_TV: { PLAN_TO_WATCH: 'plan-to-watch', WATCHING: 'watching', COMPLETED: 'completed' },
  BOOKS: { PLAN_TO_READ: 'plan-to-read', READING: 'reading', READ: 'read' }
};

const STATUS_STYLES = {
  'plan-to-watch': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'watching': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'completed': 'bg-green-500/20 text-green-300 border-green-500/30',
  'plan-to-read': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'reading': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'read': 'bg-green-500/20 text-green-300 border-green-500/30'
};

const STATUS_LABELS = {
  'plan-to-watch': 'To Watch', 'watching': 'Watching', 'completed': 'Completed',
  'plan-to-read': 'To be Read', 'reading': 'Reading', 'read': 'Read'
};

const FILTER_CONFIG = {
  MOVIES_TV: [
    { value: 'plan-to-watch', label: 'To Watch' },
    { value: 'watching', label: 'Watching' },
    { value: 'completed', label: 'Completed' }
  ],
  BOOKS: [
    { value: 'plan-to-read', label: 'To be Read' },
    { value: 'reading', label: 'Reading' },
    { value: 'read', label: 'Read' }
  ]
};

const TAB_CONFIG = {
  TASKS: { id: 'tasks', label: 'Tasks' },
  CALENDAR: { id: 'calendar', label: 'Calendar' },
  LOCATIONS: { id: 'locations', label: 'Locations' },
  TRIPS: { id: 'trips', label: 'Trips' },
  RECIPES: { id: 'recipes', label: 'Recipes' },
  TV_SHOWS: { id: 'tvshows', label: 'TV Shows' },
  MOVIES: { id: 'movies', label: 'Movies' },
  BOOKS: { id: 'books', label: 'Books' }
};

const DATE_CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'viewpoint', label: 'Viewpoint' },
  { value: 'other', label: 'Other' }
];

const DATE_CATEGORY_STYLES = {
  restaurant: 'bg-red-500/20 text-red-300 border-red-500/30',
  bar: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  coffee: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  brunch: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  viewpoint: 'bg-red-500/20 text-red-300 border-red-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
};

const MEDIA_TABS = ['movies', 'tvshows', 'books'];

const createSvgPlaceholder = (label, width = 800, height = 500, background = '#FFDAD4', foreground = '#E63B2E') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${foreground}" font-family="Arial, sans-serif" font-size="${Math.max(24, Math.round(width / 14))}" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const PLACEHOLDER_IMAGE = createSvgPlaceholder('No Image', 500, 750, '#FFFFFF', '#031A6B');

const API_REQUEST_CONFIG = { DEBOUNCE_DELAY: 300, TIMEOUT: 10000 };

// ============================================================================
// AUTHENTICATION (CLIENT-SIDE)
// ============================================================================

const AUTH_TOKEN_KEY = 'couple-planner-token';
const REMEMBER_KEY = 'couple-planner-remember';

const setAuthToken = (token, persist = false) => {
  if (persist) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  localStorage.setItem(REMEMBER_KEY, persist ? 'true' : 'false');
};

const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
};

const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
};

const loginUser = async (email, password, rememberMe) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: email, password, rememberMe })
    });
    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token, rememberMe);
      return data.user;
    }
    return null;
  } catch { return null; }
};

const registerUser = async (email, password, name, username) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, username })
    });
    const data = await res.json();
    return data;
  } catch { return null; }
};

const authenticateWithGoogle = async (idToken, rememberMe) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, rememberMe })
    });
    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token, rememberMe);
      return data.user;
    }
    return null;
  } catch { return null; }
};

const authenticateWithApple = async (identityToken, rememberMe) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityToken, rememberMe })
    });
    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token, rememberMe);
      return data.user;
    }
    return null;
  } catch { return null; }
};

const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  // Optionally verify expiration on client side; keep for now
  return true;
};

const logout = () => {
  clearAuthToken();
};

// ============================================================================
// SPACE DATA API
// ============================================================================

const getSpaceData = async (spaceId) => {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/space/${spaceId}/data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  } catch {}
  // Fallback to local cache if available
  const cached = localStorage.getItem(`space-data-${spaceId}`);
  if (cached) {
    try { return JSON.parse(cached); } catch {}
  }
  return null;
};

const saveSpaceData = async (spaceId, data) => {
  // Local cache
  try {
    localStorage.setItem(`space-data-${spaceId}`, JSON.stringify(data));
  } catch {}
  const token = getAuthToken();
  try {
    await fetch(`${API_BASE_URL}/api/space/${spaceId}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ data })
    });
    return true;
  } catch { return false; }
};

const getUserSpaces = async () => {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/space`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.spaces || [];
    }
  } catch {}
  return [];
};

const createSpace = async (name, enabledSections) => {
  const token = getAuthToken();
  try {
    const res = await fetch(`${API_BASE_URL}/api/space`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name, enabledSections })
    });
    if (res.ok) {
      const data = await res.json();
      return data.space;
    }
  } catch {}
  return null;
};

// ============================================================================
// UTILITY FUNCTIONS (unchanged from original)
// ============================================================================

const transformMovieData = (item) => ({
  id: `tmdb-${item.id}`,
  title: item.title || item.name,
  thumbnail: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : PLACEHOLDER_IMAGE,
  rating: item.vote_average?.toFixed(1) || 'N/A',
  year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A',
  type: item.media_type === 'movie' ? 'Movie' : 'Tv Show'
});

const transformAnimeData = (item) => ({
  id: `mal-${item.mal_id}`,
  title: item.title,
  thumbnail: item.images.jpg.image_url || PLACEHOLDER_IMAGE,
  rating: item.score?.toFixed(1) || 'N/A',
  year: item.year || 'N/A',
  type: 'Tv Show'
});

const transformBookData = (doc) => ({
  id: `book-${doc.key?.replace('/works/', '') || Math.random().toString(36).slice(2)}`,
  title: doc.title || 'Unknown Title',
  thumbnail: doc.cover_i ? `${API_CONFIG.OPEN_LIBRARY.COVERS_URL}/${doc.cover_i}-M.jpg` : PLACEHOLDER_IMAGE,
  rating: doc.ratings_average ? parseFloat(doc.ratings_average).toFixed(1) : 'N/A',
  year: doc.first_publish_year?.toString() || 'N/A',
  author: doc.author_name?.[0] || 'Unknown Author',
  type: 'Book'
});

const searchMovies = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch movies');
    const data = await response.json();
    return (data.results || []).filter(item => item.media_type === 'movie').map(transformMovieData);
  } catch (error) { console.error('Movie search error:', error); return []; }
};

const searchTvShows = async (query) => {
  try {
    const [tmdbResponse, animeData] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
      fetch(`${API_CONFIG.JIKAN.BASE_URL}${API_CONFIG.JIKAN.ENDPOINTS.SEARCH_ANIME}?q=${encodeURIComponent(query)}&limit=10`).then(r => r.json())
    ]);
    const tvResults = tmdbResponse.status === 'fulfilled' ? (tmdbResponse.value.results || []).filter(i => i.media_type === 'tv').map(transformMovieData) : [];
    const animeResults = animeData.status === 'fulfilled' ? (animeData.value.data || []).map(transformAnimeData) : [];
    return [...tvResults, ...animeResults];
  } catch (error) { console.error('TV show search error:', error); return []; }
};

const fetchTvDetails = async (tmdbId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tvdetails?id=${tmdbId}`);
    if (!response.ok) throw new Error('Failed to fetch TV details');
    return await response.json();
  } catch (error) { console.error('TV details fetch error:', error); return null; }
};

const fetchAnimeDetails = async (malId) => {
  try {
    const response = await fetch(`${API_CONFIG.JIKAN.BASE_URL}/anime/${malId}`);
    if (!response.ok) throw new Error('Failed to fetch anime details');
    const data = await response.json();
    return { episodes: data.data?.episodes || null, seasons: null };
  } catch (error) { console.error('Anime details fetch error:', error); return null; }
};

const searchAnime = async (query) => {
  try {
    const { JIKAN } = API_CONFIG;
    const url = new URL(`${JIKAN.BASE_URL}${JIKAN.ENDPOINTS.SEARCH_ANIME}`);
    url.searchParams.append('q', query);
    url.searchParams.append('limit', 10);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch anime');
    const data = await response.json();
    return data.data.map(transformAnimeData);
  } catch (error) { console.error('Anime search error:', error); return []; }
};

const searchBooks = async (query) => {
  try {
    const { OPEN_LIBRARY } = API_CONFIG;
    const url = new URL(`${OPEN_LIBRARY.BASE_URL}${OPEN_LIBRARY.ENDPOINTS.SEARCH}`);
    url.searchParams.append('q', query);
    url.searchParams.append('limit', 20);
    url.searchParams.append('fields', 'key,title,author_name,first_publish_year,cover_i,ratings_average');
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch books');
    const data = await response.json();
    return (data.docs || []).map(transformBookData);
  } catch (error) { console.error('Book search error:', error); return []; }
};

// Old storage functions kept for compatibility but no longer used for global auth
const getStoredData = async () => { /* Not used, but retained */ };
const saveData = async () => { /* Not used */ };

const formatStatusLabel = (status) => STATUS_LABELS[status] || status;
const getStatusOptions = (category) => {
  if (category === 'books') return [STATUS_CONFIG.BOOKS.PLAN_TO_READ, STATUS_CONFIG.BOOKS.READING, STATUS_CONFIG.BOOKS.READ];
  return [STATUS_CONFIG.MOVIES_TV.PLAN_TO_WATCH, STATUS_CONFIG.MOVIES_TV.WATCHING, STATUS_CONFIG.MOVIES_TV.COMPLETED];
};
const getFilterOptions = (category) => category === 'books' ? FILTER_CONFIG.BOOKS : FILTER_CONFIG.MOVIES_TV;
const getDefaultStatus = (category) => category === 'books' ? STATUS_CONFIG.BOOKS.PLAN_TO_READ : STATUS_CONFIG.MOVIES_TV.PLAN_TO_WATCH;
const filterByQuery = (items, query) => {
  const searchQuery = query.toLowerCase();
  return items.filter(item =>
    item.title?.toLowerCase().includes(searchQuery) ||
    item.author?.toLowerCase().includes(searchQuery) ||
    item.year?.toString().includes(searchQuery)
  );
};
const getCategoryName = (category) => ({
  movies: 'Movies',
  tvshows: 'TV Shows',
  books: 'Books',
  locations: 'Locations'
}[category] || category.charAt(0).toUpperCase() + category.slice(1));

Object.assign(window, {
  API_CONFIG, STORAGE_CONFIG, API_BASE_URL, FEATURES,
  STATUS_CONFIG, STATUS_STYLES, STATUS_LABELS, FILTER_CONFIG,
  TAB_CONFIG, DATE_CATEGORIES, DATE_CATEGORY_STYLES,
  MEDIA_TABS, PLACEHOLDER_IMAGE, API_REQUEST_CONFIG,
  AUTH_TOKEN_KEY, REMEMBER_KEY,
  setAuthToken, getAuthToken, clearAuthToken,
  loginUser, registerUser, authenticateWithGoogle, authenticateWithApple,
  isAuthenticated, logout,
  getSpaceData, saveSpaceData, getUserSpaces, createSpace,
  transformMovieData, transformAnimeData, transformBookData,
  searchMovies, searchTvShows, searchAnime, searchBooks,
  formatStatusLabel, getStatusOptions, getFilterOptions, getDefaultStatus,
  filterByQuery, getCategoryName,
  fetchTvDetails, fetchAnimeDetails
});
