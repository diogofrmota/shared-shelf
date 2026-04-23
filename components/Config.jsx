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
    tasks: [],
    movies: [],
    tvshows: [],
    books: [],
    calendarEvents: [],
    trips: [],
    recipes: [],
    dates: []
  }
};

const API_BASE_URL = '';

const FEATURES = {
  USE_REMOTE_STORAGE: true,
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
  'plan-to-watch': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'watching': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'completed': 'bg-green-500/20 text-green-300 border-green-500/30',
  'plan-to-read': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'reading': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'read': 'bg-green-500/20 text-green-300 border-green-500/30'
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
  DATES: { id: 'dates', label: 'Dates' },
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
  restaurant: 'bg-red-500/20 text-red-300 border-red-500/30',
  bar: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  coffee: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  brunch: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
};

const MEDIA_TABS = ['movies', 'tvshows', 'books'];

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/500x750/1a1a2e/8b5cf6?text=No+Image';

const API_REQUEST_CONFIG = {
  DEBOUNCE_DELAY: 300,
  TIMEOUT: 10000
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

const USER_ID = 'diogo-monica-shared';
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
  type: item.media_type === 'movie' ? 'Movie' : 'TV Show'
});

const transformAnimeData = (item) => ({
  id: `mal-${item.mal_id}`,
  title: item.title,
  thumbnail: item.images.jpg.image_url || PLACEHOLDER_IMAGE,
  rating: item.score?.toFixed(1) || 'N/A',
  year: item.year || 'N/A',
  type: item.type || 'Anime'
});

const transformBookData = (doc) => ({
  id: `book-${doc.key?.replace('/works/', '') || Math.random().toString(36).slice(2)}`,
  title: doc.title || 'Unknown Title',
  thumbnail: doc.cover_i
    ? `${API_CONFIG.OPEN_LIBRARY.COVERS_URL}/${doc.cover_i}-M.jpg`
    : PLACEHOLDER_IMAGE,
  rating: doc.ratings_average ? parseFloat(doc.ratings_average).toFixed(1) : 'N/A',
  year: doc.first_publish_year?.toString() || 'N/A',
  author: doc.author_name?.[0] || 'Unknown Author'
});

const searchMovies = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
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
      fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
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
    url.searchParams.append('fields', 'key,title,author_name,first_publish_year,cover_i,ratings_average');
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
  if (FEATURES.USE_REMOTE_STORAGE) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/data`, {
        headers: { 'x-user-id': USER_ID }
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('media-tracker-data-cache', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch from cloud, falling back to cache:', error);
    }
    const cached = localStorage.getItem('media-tracker-data-cache');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { console.error('Failed to parse cached data:', e); }
    }
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
  if (FEATURES.USE_REMOTE_STORAGE) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
        body: JSON.stringify({ data })
      });
      if (!response.ok) console.warn('Failed to sync with cloud, data saved locally only');
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
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

const getCategoryName = (category) => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

Object.assign(window, {
  API_CONFIG, STORAGE_CONFIG, API_BASE_URL, FEATURES,
  STATUS_CONFIG, STATUS_STYLES, STATUS_LABELS, FILTER_CONFIG,
  TAB_CONFIG, DATE_CATEGORIES, DATE_CATEGORY_STYLES,
  MEDIA_TABS, PLACEHOLDER_IMAGE, API_REQUEST_CONFIG,
  USER_ID, AUTH_STORAGE_KEY,
  isAuthenticated, authenticate, logout,
  transformMovieData, transformAnimeData, transformBookData,
  searchMovies, searchTvShows, searchAnime, searchBooks,
  getStoredData, saveData,
  formatStatusLabel, getStatusOptions, getFilterOptions, getDefaultStatus,
  debounce, filterByQuery, getCategoryName
});
