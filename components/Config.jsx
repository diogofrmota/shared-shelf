const React = window.React;
const { useState, useEffect, useRef } = React;

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  JIKAN: {
    BASE_URL: 'https://api.jikan.moe/v4',
    ENDPOINTS: {
      SEARCH_ANIME: '/anime'
    }
  },
  OPEN_LIBRARY: {
    BASE_URL: 'https://openlibrary.org',
    ENDPOINTS: {
      SEARCH: '/search.json'
    },
    COVERS_URL: 'https://covers.openlibrary.org/b/id'
  }
};

const STORAGE_CONFIG = {
  KEY: 'media-tracker-data',
  SCHEMA: {
    calendarEvents: [],
    tasks: [],
    locations: [],
    trips: [],
    recipes: [],
    watchlist: [],
    profile: { users: [] }
  }
};

const API_BASE_URL = '';

const FEATURES = {
  USE_REMOTE_STORAGE: false,
  SYNC_ENABLED: true
};

const STATUS_CONFIG = {
  MOVIES_TV: {
    PLAN_TO_WATCH: 'plan-to-watch',
    WATCHING: 'watching',
    COMPLETED: 'completed'
  },
  BOOKS: {
    PLAN_TO_READ: 'plan-to-read',
    READING: 'reading',
    READ: 'read'
  }
};

const STATUS_STYLES = {
  'plan-to-watch': 'bg-white text-slate-950 border-white/10',
  'watching': 'bg-white text-slate-950 border-white/10',
  'completed': 'bg-white text-slate-950 border-white/10',
  'plan-to-read': 'bg-white text-slate-950 border-white/10',
  'reading': 'bg-white text-slate-950 border-white/10',
  'read': 'bg-white text-slate-950 border-white/10'
};

const STATUS_LABELS = {
  'plan-to-watch': 'To Watch',
  'watching': 'Watching',
  'completed': 'Completed',
  'plan-to-read': 'To be Read',
  'reading': 'Reading',
  'read': 'Read'
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
  { value: 'other', label: 'Other' }
];

const DATE_CATEGORY_STYLES = {
  restaurant: 'bg-white text-slate-950 border-white/10',
  bar: 'bg-white text-slate-950 border-white/10',
  coffee: 'bg-white text-slate-950 border-white/10',
  brunch: 'bg-white text-slate-950 border-white/10',
  other: 'bg-white text-slate-950 border-white/10'
};

const MEDIA_TABS = ['movies', 'tvshows', 'books'];

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/500x750/131834/dedede?text=No+Image';

const API_REQUEST_CONFIG = {
  DEBOUNCE_DELAY: 300,
  TIMEOUT: 10000
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

const AUTH_STORAGE_KEY = 'media-tracker-auth';

const isAuthenticated = () => {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
};

const authenticate = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.authenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};

const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const transformMovieData = (item) => ({
  id: `tmdb-${item.id}`,
  title: item.title || item.name,
  thumbnail: item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : PLACEHOLDER_IMAGE,
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
  thumbnail: doc.cover_i
    ? `${API_CONFIG.OPEN_LIBRARY.COVERS_URL}/${doc.cover_i}-M.jpg`
    : PLACEHOLDER_IMAGE,
  rating: doc.ratings_average ? parseFloat(doc.ratings_average).toFixed(1) : 'N/A',
  year: doc.first_publish_year?.toString() || 'N/A',
  author: doc.author_name?.[0] || 'Unknown Author',
  totalPages: Number.isFinite(Number(doc.number_of_pages_median)) ? Number(doc.number_of_pages_median) : null,
  type: 'Book'
});

const searchMovies = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
      headers: window.getAuthToken?.() ? { Authorization: `Bearer ${window.getAuthToken()}` } : {}
    });
    if (!response.ok) throw new Error('Failed to fetch movies');
    const data = await response.json();
    return (data.results || [])
      .filter(item => item.media_type === 'movie')
      .map(item => transformMovieData(item));
  } catch (error) {
    console.error('Movie search error:', error);
    return [];
  }
};

const searchTvShows = async (query) => {
  try {
    const [tmdbResponse, animeData] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
        headers: window.getAuthToken?.() ? { Authorization: `Bearer ${window.getAuthToken()}` } : {}
      }).then(r => {
        if (!r.ok) throw new Error('Failed to fetch TV shows');
        return r.json();
      }),
      fetch(`${API_CONFIG.JIKAN.BASE_URL}${API_CONFIG.JIKAN.ENDPOINTS.SEARCH_ANIME}?q=${encodeURIComponent(query)}&limit=10`).then(r => r.json())
    ]);
    const tvResults = tmdbResponse.status === 'fulfilled'
      ? (tmdbResponse.value.results || []).filter(i => i.media_type === 'tv').map(transformMovieData)
      : [];
    const animeResults = animeData.status === 'fulfilled'
      ? (animeData.value.data || []).map(transformAnimeData)
      : [];
    return [...tvResults, ...animeResults];
  } catch (error) {
    console.error('TV show search error:', error);
    return [];
  }
};

const fetchTvDetails = async (tmdbId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tvdetails?id=${tmdbId}`, {
      headers: window.getAuthToken?.() ? { Authorization: `Bearer ${window.getAuthToken()}` } : {}
    });
    if (!response.ok) throw new Error('Failed to fetch TV details');
    return await response.json();
  } catch (error) {
    console.error('TV details fetch error:', error);
    return null;
  }
};

const fetchAnimeDetails = async (malId) => {
  try {
    const response = await fetch(`${API_CONFIG.JIKAN.BASE_URL}/anime/${malId}`);
    if (!response.ok) throw new Error('Failed to fetch anime details');
    const data = await response.json();
    return {
      episodes: data.data?.episodes || null,
      seasons: null
    };
  } catch (error) {
    console.error('Anime details fetch error:', error);
    return null;
  }
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
    return data.data.map(item => transformAnimeData(item));
  } catch (error) {
    console.error('Anime search error:', error);
    return [];
  }
};

const searchBooks = async (query) => {
  try {
    const { OPEN_LIBRARY } = API_CONFIG;
    const url = new URL(`${OPEN_LIBRARY.BASE_URL}${OPEN_LIBRARY.ENDPOINTS.SEARCH}`);
    url.searchParams.append('q', query);
    url.searchParams.append('limit', 20);
    url.searchParams.append('fields', 'key,title,author_name,first_publish_year,cover_i,ratings_average,number_of_pages_median');
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch books');
    const data = await response.json();
    return (data.docs || []).map(doc => transformBookData(doc));
  } catch (error) {
    console.error('Book search error:', error);
    return [];
  }
};

const getStoredData = async () => {
  const cached = localStorage.getItem('media-tracker-data-cache');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) { console.error('Failed to parse cached data:', e); }
  }

  try {
    const stored = localStorage.getItem(STORAGE_CONFIG.KEY);
    return stored ? JSON.parse(stored) : { ...STORAGE_CONFIG.SCHEMA };
  } catch (error) {
    console.error('Error retrieving stored data:', error);
    return { ...STORAGE_CONFIG.SCHEMA };
  }
};

const saveData = async (data) => {
  try {
    localStorage.setItem(STORAGE_CONFIG.KEY, JSON.stringify(data));
    localStorage.setItem('media-tracker-data-cache', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const formatStatusLabel = (status) => STATUS_LABELS[status] || status;

const getStatusOptions = (category) => {
  if (category === 'books') {
    return [STATUS_CONFIG.BOOKS.PLAN_TO_READ, STATUS_CONFIG.BOOKS.READING, STATUS_CONFIG.BOOKS.READ];
  }
  return [STATUS_CONFIG.MOVIES_TV.PLAN_TO_WATCH, STATUS_CONFIG.MOVIES_TV.WATCHING, STATUS_CONFIG.MOVIES_TV.COMPLETED];
};

const getFilterOptions = (category) => {
  return category === 'books' ? FILTER_CONFIG.BOOKS : FILTER_CONFIG.MOVIES_TV;
};

const getDefaultStatus = (category) => {
  return category === 'books'
    ? STATUS_CONFIG.BOOKS.PLAN_TO_READ
    : STATUS_CONFIG.MOVIES_TV.PLAN_TO_WATCH;
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

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
  AUTH_STORAGE_KEY,
  isAuthenticated, authenticate, logout,
  transformMovieData, transformAnimeData, transformBookData,
  searchMovies, searchTvShows, searchAnime, searchBooks,
  getStoredData, saveData,
  formatStatusLabel, getStatusOptions, getFilterOptions, getDefaultStatus,
  debounce, filterByQuery, getCategoryName,
  fetchTvDetails, fetchAnimeDetails
});
