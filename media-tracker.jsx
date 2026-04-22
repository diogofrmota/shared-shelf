/**
 * Media Tracker - Complete Application
 *
 * Consolidated single-file architecture optimized for browser environment.
 * Deployed on Vercel (free tier) with Vercel Postgres for cloud persistence.
 *
 * Features:
 * - React Hooks for state management
 * - Component composition
 * - Responsive design
 * - Multiple media type support (Movies, TV, Anime, Books)
 * - Cloud persistence with Vercel Postgres (localStorage fallback for offline)
 */

const React = window.React;
const { useState, useEffect } = React;

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
  GOOGLE_BOOKS: {
    BASE_URL: 'https://www.googleapis.com/books/v1',
    ENDPOINTS: {
      SEARCH_VOLUMES: '/volumes'
    }
  }
};

const STORAGE_CONFIG = {
  KEY: 'media-tracker-data',
  SCHEMA: {
    movies: [],
    tvshows: [],
    books: [],
    calendarEvents: [],
    trips: [],
    recipes: [],
    dates: []
  }
};

const API_BASE_URL = ''; // Empty for relative paths in Vercel

const FEATURES = {
  USE_REMOTE_STORAGE: true, // Enable cloud storage
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
  CALENDAR: { id: 'calendar', label: 'Calendar' },
  TRIPS: { id: 'trips', label: 'Trips' },
  DATES: { id: 'dates', label: 'Dates' },
  RECIPES: { id: 'recipes', label: 'Recipes' },
  MOVIES: { id: 'movies', label: 'Movies' },
  TV_SHOWS: { id: 'tvshows', label: 'TV Shows' },
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
// UTILITY FUNCTIONS
// ============================================================================

// Shared library — every browser writes/reads the same bucket in Neon.
const USER_ID = 'diogo-monica-shared';

// Client-side login gate. Credentials are visible in the bundled source
// and the API routes themselves are unauthenticated, so this is a soft
// gate for household use, not real access control.
const AUTH_STORAGE_KEY = 'media-tracker-auth';
const AUTH_CREDENTIALS = { username: 'diogo', password: 'monica' };

// API Utilities
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
    const { GOOGLE_BOOKS } = API_CONFIG;
    const url = new URL(`${GOOGLE_BOOKS.BASE_URL}${GOOGLE_BOOKS.ENDPOINTS.SEARCH_VOLUMES}`);
    url.searchParams.append('q', query);
    url.searchParams.append('maxResults', 10);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch books');

    const data = await response.json();
    
    return (data.items || []).map(item => transformBookData(item));
  } catch (error) {
    console.error('Book search error:', error);
    return [];
  }
};

const transformMovieData = (item) => ({
  id: `tmdb-${item.id}`,
  title: item.title || item.name,
  thumbnail: item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
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

const transformBookData = (item) => ({
  id: `book-${item.id}`,
  title: item.volumeInfo.title,
  thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || PLACEHOLDER_IMAGE,
  rating: item.volumeInfo.averageRating?.toFixed(1) || 'N/A',
  year: item.volumeInfo.publishedDate?.split('-')[0] || 'N/A',
  author: item.volumeInfo.authors?.[0] || 'Unknown Author'
});

// Storage Utilities (Updated for cloud sync)
const getStoredData = async () => {
  // Try cloud storage first if enabled
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
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached data:', e);
      }
    }
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_CONFIG.KEY);
    return stored ? JSON.parse(stored) : { ...STORAGE_CONFIG.SCHEMA };
  } catch (error) {
    console.error('Error retrieving stored data:', error);
    return { ...STORAGE_CONFIG.SCHEMA };
  }
};

const saveData = async (data) => {
  // Always save to localStorage as backup
  try {
    localStorage.setItem(STORAGE_CONFIG.KEY, JSON.stringify(data));
    localStorage.setItem('media-tracker-data-cache', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  // Sync to cloud if enabled
  if (FEATURES.USE_REMOTE_STORAGE) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': USER_ID
        },
        body: JSON.stringify({ data })
      });
      
      if (!response.ok) {
        console.warn('Failed to sync with cloud, data saved locally only');
      }
    } catch (error) {
      console.error('Error syncing to cloud:', error);
    }
  }
};

// Google Maps Loader — fetches the API key from the serverless endpoint
// and injects the Maps JS script (with Places library) exactly once. Returns
// a shared promise so callers share a single load.
let googleMapsLoadPromise = null;

const loadGoogleMaps = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = (async () => {
    let apiKey = window.GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/maps-key`);
        if (res.ok) {
          const json = await res.json();
          apiKey = json.apiKey || '';
        }
      } catch (err) {
        console.warn('Could not fetch Google Maps API key:', err);
      }
    }
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps="true"]');
      if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'true';
      script.addEventListener('load', resolve);
      script.addEventListener('error', reject);
      document.head.appendChild(script);
    });

    if (!window.google?.maps) {
      throw new Error('Google Maps failed to load');
    }
    return window.google;
  })();

  googleMapsLoadPromise.catch(() => {
    googleMapsLoadPromise = null;
  });

  return googleMapsLoadPromise;
};

// Helper Utilities
const formatStatusLabel = (status) => STATUS_LABELS[status] || status;

const getStatusOptions = (category) => {
  if (category === 'books') {
    return [
      STATUS_CONFIG.BOOKS.PLAN_TO_READ,
      STATUS_CONFIG.BOOKS.READING,
      STATUS_CONFIG.BOOKS.READ
    ];
  }
  return [
    STATUS_CONFIG.MOVIES_TV.PLAN_TO_WATCH,
    STATUS_CONFIG.MOVIES_TV.WATCHING,
    STATUS_CONFIG.MOVIES_TV.COMPLETED
  ];
};

const getFilterOptions = (category) => {
  if (category === 'books') {
    return FILTER_CONFIG.BOOKS;
  }
  return FILTER_CONFIG.MOVIES_TV;
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

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const Search = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const Plus = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const Film = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <rect x="2" y="7" width="20" height="15" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
  </svg>
);

const Tv = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
    <polyline points="17 2 12 7 7 2"></polyline>
  </svg>
);

const Book = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
  </svg>
);

const CalendarIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const MapPin = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ChevronLeft = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const Trash = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6"></path>
    <path d="M14 11v6"></path>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const LinkIcon = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const ThreeDots = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 16 16"
    className={className}
  >
    <circle cx="8" cy="2" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="8" cy="14" r="1.5" />
  </svg>
);

const Close = ({ size = 24, className = '' }) => (
  <span className={className}>✕</span>
);

const ChefHat = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
    <line x1="6" y1="17" x2="18" y2="17"></line>
  </svg>
);

const Utensils = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
    <path d="M7 2v20"></path>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
  </svg>
);

const Star = ({ size = 16, className = '', filled = false }) => (
  <svg
    width={size}
    height={size}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

// ============================================================================
// UI COMPONENTS
// ============================================================================

const FilterButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
      isActive
        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700'
    }`}
  >
    {label}
  </button>
);

const FilterBar = ({ label, children }) => (
  <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
    {label && (
      <span className="text-slate-400 font-medium self-center text-sm sm:text-base">
        {label}
      </span>
    )}
    {children}
  </div>
);

const EmptyState = ({ onAddClick }) => (
  <div className="text-center py-12 sm:py-20">
    <div className="inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-800/50 mb-4 sm:mb-6">
      <Search size={24} />
    </div>
    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
      No items found
    </h3>
    <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
      Add some items to your list to get started
    </p>
    <button
      onClick={onAddClick}
      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
    >
      <Plus size={18} />
      Add Your First Item
    </button>
  </div>
);

const MediaGrid = ({ items, renderItem, emptyComponent }) => (
  <>
    {items.length === 0 ? (
      emptyComponent
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 animate-fade-in">
        {items.map(renderItem)}
      </div>
    )}
  </>
);

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
    <div className="text-center">
      <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
      <p className="text-white text-lg">Loading your library...</p>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      setError('');
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-900/60 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm"
      >
        <h1 className="text-2xl font-bold text-white text-center mb-1">Media Tracker</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Sign in to access your library</p>

        <label className="block text-slate-300 text-sm mb-2" htmlFor="login-username">Username</label>
        <input
          id="login-username"
          type="text"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 mb-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />

        <label className="block text-slate-300 text-sm mb-2" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 mb-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
        >
          Sign in
        </button>
      </form>
    </div>
  );
};

// ============================================================================
// MEDIA CARD COMPONENT
// ============================================================================

const MediaCard = ({ item, onStatusChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const statusOptions = getStatusOptions(item.category);

  return (
    <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20">
      <div className="aspect-2/3 overflow-hidden bg-slate-900 rounded-t-xl">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-2 sm:p-3 md:p-4 space-y-1 sm:space-y-2">
        <div>
          <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-tight mb-1">
            {item.title}
          </h3>
          {item.author && (
            <p className="text-xs sm:text-xs text-slate-400">{item.author}</p>
          )}

          <div className="flex items-center justify-between mt-1 sm:mt-2">
            <div className="flex items-center gap-1 sm:gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 whitespace-nowrap">
                ⭐ {item.rating}
              </span>
              <span>•</span>
              <span>{item.year}</span>
              {item.type && (
                <>
                  <span>•</span>
                  <span className="text-xs">{item.type}</span>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ThreeDots size={16} />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mb-2 bottom-full w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-20">
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(item.id, status);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        {formatStatusLabel(status)}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        onStatusChange(item.id, 'remove');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors border-t border-slate-700 mt-1"
                    >
                      Remove from list
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SEARCH MODAL COMPONENT
// ============================================================================

const ResultCard = ({ item, category, onAdd }) => (
  <div
    key={item.id}
    className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 cursor-pointer"
    onClick={() => onAdd({ ...item, category })}
  >
    <div className="aspect-2/3 overflow-hidden bg-slate-900">
      <img
        src={item.thumbnail}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-2 sm:p-3 space-y-1 sm:space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex flex-col justify-end">
      <div>
        <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-tight mb-1">
          {item.title}
        </h3>
        {item.author && (
          <p className="text-xs text-slate-400">{item.author}</p>
        )}
        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            ⭐ {item.rating}
          </span>
          <span>•</span>
          <span>{item.year}</span>
        </div>
      </div>
    </div>
  </div>
);

const SearchModal = ({ isOpen, onClose, category, onAdd }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError('');

      try {
        let searchResults = [];
        switch (category) {
          case 'movies':
            searchResults = await searchMovies(query);
            break;
          case 'tvshows':
            searchResults = await searchTvShows(query);
            break;
          case 'books':
            searchResults = await searchBooks(query);
            break;
          default:
            break;
        }
        setResults(searchResults);
      } catch (err) {
        setError('Failed to search. Please try again.');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debouncedSearch = debounce(performSearch, API_REQUEST_CONFIG.DEBOUNCE_DELAY);
    debouncedSearch();
  }, [query, category]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Search {getCategoryName(category)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Close size={24} />
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search for ${category}...`}
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {results.length === 0 && !loading && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              {query
                ? 'No results found. Try a different search.'
                : 'Enter a search term to get started.'}
            </div>
          )}

          {loading && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              Searching...
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
            {results.map(item => (
              <ResultCard
                key={item.id}
                item={item}
                category={category}
                onAdd={onAdd}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GLOBAL SEARCH MODAL COMPONENT
// ============================================================================

const LibraryResultCard = ({ item, onSelect }) => (
  <div
    key={`${item.category}-${item.id}`}
    className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 cursor-pointer"
    onClick={() => onSelect(item)}
  >
    <div className="aspect-2/3 overflow-hidden bg-slate-900">
      <img
        src={item.thumbnail}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="p-2 sm:p-3 space-y-1 sm:space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex flex-col justify-end">
      <div>
        <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-tight mb-1">
          {item.title}
        </h3>
        {item.author && (
          <p className="text-xs text-slate-400">{item.author}</p>
        )}
        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            ⭐ {item.rating}
          </span>
          <span>•</span>
          <span>{item.year}</span>
        </div>
      </div>
    </div>
  </div>
);

const GlobalSearchModal = ({ isOpen, onClose, data, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const allItems = [
      ...data.movies.map(m => ({ ...m, category: 'movies' })),
      ...data.tvshows.map(t => ({ ...t, category: 'tvshows' })),
      ...data.books.map(b => ({ ...b, category: 'books' }))
    ];

    const filtered = filterByQuery(allItems, query);
    setResults(filtered);
  }, [query, data]);

  const handleResultClick = (item) => {
    setActiveTab(item.category);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Search My Library
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Close size={24} />
            </button>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your saved items..."
              className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {results.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              {query
                ? 'No results found in your library.'
                : 'Search your saved items.'}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
            {results.map(item => (
              <LibraryResultCard
                key={`${item.category}-${item.id}`}
                item={item}
                onSelect={handleResultClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto">
    {tabs.map(tab => {
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base rounded-t-xl transition-all duration-300 whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-slate-900/50 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Icon size={16} />
          {tab.label}
        </button>
      );
    })}
  </div>
);

const Header = ({
  activeTab,
  onTabChange,
  onSearchClick,
  onAddClick,
  tabs,
  showMediaActions = true
}) => (
  <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-40">
    <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Diogo & Mónica's Dashboard
          </h1>
        </div>
        {showMediaActions && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onSearchClick}
              className="flex-1 sm:flex-none px-3 sm:px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:gap-2 gap-1 text-sm sm:text-base shadow-lg shadow-slate-900/30 hover:shadow-xl hover:shadow-slate-900/40 hover:scale-105"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </button>
            <button
              onClick={onAddClick}
              className="flex-1 sm:flex-none px-3 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:gap-2 gap-1 text-sm sm:text-base shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add New</span>
            </button>
          </div>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  </div>
);

const getDefaultTabs = () => [
  { id: TAB_CONFIG.CALENDAR.id, label: TAB_CONFIG.CALENDAR.label, icon: CalendarIcon },
  { id: TAB_CONFIG.TRIPS.id, label: TAB_CONFIG.TRIPS.label, icon: MapPin },
  { id: TAB_CONFIG.DATES.id, label: TAB_CONFIG.DATES.label, icon: Utensils },
  { id: TAB_CONFIG.RECIPES.id, label: TAB_CONFIG.RECIPES.label, icon: ChefHat },
  { id: TAB_CONFIG.MOVIES.id, label: TAB_CONFIG.MOVIES.label, icon: Film },
  { id: TAB_CONFIG.TV_SHOWS.id, label: TAB_CONFIG.TV_SHOWS.label, icon: Tv },
  { id: TAB_CONFIG.BOOKS.id, label: TAB_CONFIG.BOOKS.label, icon: Book }
];

// ============================================================================
// CALENDAR VIEW COMPONENT
// ============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (time) => {
  if (!time) return '';
  return time;
};

const formatDateLong = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
};

const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const isoDateFromParts = (year, month, day) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const AddEventForm = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      setError('Title and date are required.');
      return;
    }
    if (startHour && endHour && endHour < startHour) {
      setError('End hour must be after start hour.');
      return;
    }
    onAdd({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      date,
      startHour: startHour || '',
      endHour: endHour || '',
      description: description.trim()
    });
    setTitle('');
    setDate('');
    setStartHour('');
    setEndHour('');
    setDescription('');
    setError('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Add Activity</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dinner with friends"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Start Hour</label>
            <input
              type="time"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">End Hour</label>
            <input
              type="time"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some details..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-y"
          />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Add Activity
        </button>
      </div>
    </form>
  );
};

const CalendarView = ({ events, onAddEvent, onDeleteEvent }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = buildMonthGrid(viewYear, viewMonth);

  const eventsByDate = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  Object.keys(eventsByDate).forEach(d => {
    eventsByDate[d].sort((a, b) => (a.startHour || '').localeCompare(b.startHour || ''));
  });

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
    setSelectedDate(null);
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
    setSelectedDate(null);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  };

  const todayIso = isoDateFromParts(today.getFullYear(), today.getMonth(), today.getDate());

  const monthEvents = events
    .filter(ev => {
      const [y, m] = ev.date.split('-').map(Number);
      return y === viewYear && m - 1 === viewMonth;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startHour || '').localeCompare(b.startHour || '');
    });

  const agendaEvents = selectedDate
    ? (eventsByDate[selectedDate] || [])
    : monthEvents;

  const agendaTitle = selectedDate
    ? formatDateLong(selectedDate)
    : `Agenda — ${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <div>
      <AddEventForm onAdd={onAddEvent} />

      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg sm:text-xl font-semibold text-white min-w-[180px] text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button
              onClick={goNext}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm bg-slate-800/60 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-slate-400 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square sm:aspect-auto sm:min-h-[88px]" />;
            }
            const iso = isoDateFromParts(viewYear, viewMonth, day);
            const dayEvents = eventsByDate[iso] || [];
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(isSelected ? null : iso)}
                className={`text-left aspect-square sm:aspect-auto sm:min-h-[88px] p-1 sm:p-2 rounded-lg border transition-colors flex flex-col ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : isToday
                      ? 'border-purple-500/60 bg-slate-800/40 hover:bg-slate-800/70'
                      : 'border-slate-700/60 bg-slate-800/20 hover:bg-slate-800/50'
                }`}
              >
                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-purple-300' : 'text-slate-200'}`}>
                  {day}
                </span>
                <div className="mt-1 flex-1 overflow-hidden space-y-1 hidden sm:block">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-100 truncate"
                      title={ev.title}
                    >
                      {ev.startHour && <span className="font-medium mr-1">{ev.startHour}</span>}
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-slate-400">+{dayEvents.length - 2} more</div>
                  )}
                </div>
                {dayEvents.length > 0 && (
                  <div className="sm:hidden flex justify-center mt-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{agendaTitle}</h3>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Show month
            </button>
          )}
        </div>

        {agendaEvents.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            No activities {selectedDate ? 'for this day' : 'for this month'}.
          </p>
        ) : (
          <ul className="space-y-3">
            {agendaEvents.map(ev => (
              <li
                key={ev.id}
                className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-700/50"
              >
                <div className="flex flex-col items-center justify-center min-w-[56px] px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <span className="text-xs text-purple-300 uppercase font-medium">
                    {MONTH_NAMES[parseInt(ev.date.split('-')[1], 10) - 1].slice(0, 3)}
                  </span>
                  <span className="text-lg font-bold text-white">
                    {parseInt(ev.date.split('-')[2], 10)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-white truncate">{ev.title}</h4>
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                      aria-label="Delete event"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  {(ev.startHour || ev.endHour) && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {formatTime(ev.startHour)}
                      {ev.startHour && ev.endHour && ' – '}
                      {formatTime(ev.endHour)}
                    </p>
                  )}
                  {ev.description && (
                    <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">
                      {ev.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TRIPS VIEW COMPONENT
// ============================================================================

const TRIP_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/1a1a2e/8b5cf6?text=Trip';

const AddTripForm = ({ onAdd }) => {
  const [destination, setDestination] = useState('');
  const [year, setYear] = useState('');
  const [photo, setPhoto] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedYear = parseInt(year, 10);
    if (!destination.trim() || !parsedYear || parsedYear < 1900 || parsedYear > 9999) {
      setError('Destination and a valid year are required.');
      return;
    }
    onAdd({
      id: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      destination: destination.trim(),
      year: parsedYear,
      photo: photo.trim(),
      accommodation: accommodation.trim()
    });
    setDestination('');
    setYear('');
    setPhoto('');
    setAccommodation('');
    setError('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Add Trip</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-sm mb-1">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Lisbon, Portugal"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2026"
            min="1900"
            max="9999"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">
            Photo <span className="text-slate-500">(URL or /trips/filename.jpg)</span>
          </label>
          <input
            type="text"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="/trips/lisbon.jpg or https://..."
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">
            Accommodation <span className="text-slate-500">(optional link)</span>
          </label>
          <input
            type="url"
            value={accommodation}
            onChange={(e) => setAccommodation(e.target.value)}
            placeholder="https://airbnb.com/..."
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Add Trip
        </button>
      </div>
    </form>
  );
};

const TripCard = ({ trip, onDelete }) => (
  <div className="flex gap-4 group">
    <div className="flex flex-col items-center pt-2">
      <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-slate-900 shadow-md shadow-purple-500/40"></div>
      <div className="flex-1 w-px bg-slate-700/80 mt-1 min-h-[2rem]"></div>
    </div>

    <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden mb-6 hover:border-purple-500/50 transition-colors">
      <div className="aspect-video bg-slate-900 overflow-hidden">
        <img
          src={trip.photo || TRIP_PHOTO_PLACEHOLDER}
          alt={trip.destination}
          onError={(e) => { e.currentTarget.src = TRIP_PHOTO_PLACEHOLDER; }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-lg sm:text-xl font-bold text-white truncate flex items-center gap-2">
              <MapPin size={18} className="text-purple-400 shrink-0" />
              {trip.destination}
            </h4>
            <p className="text-sm text-slate-400 mt-1">{trip.year}</p>
          </div>
          <button
            onClick={() => onDelete(trip.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete trip"
          >
            <Trash size={16} />
          </button>
        </div>
        {trip.accommodation && (
          <a
            href={trip.accommodation}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors break-all"
          >
            <LinkIcon size={14} />
            Accommodation
          </a>
        )}
      </div>
    </div>
  </div>
);

const TripsView = ({ trips, onAddTrip, onDeleteTrip }) => {
  const currentYear = new Date().getFullYear();
  const sorted = [...trips].sort((a, b) => a.year - b.year);
  const upcoming = sorted.filter(t => t.year >= currentYear);
  const past = sorted.filter(t => t.year < currentYear).reverse();

  return (
    <div>
      <AddTripForm onAdd={onAddTrip} />

      <section className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Next Trips</h3>
        {upcoming.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center bg-slate-900/30 border border-slate-800 rounded-xl">
            No upcoming trips yet. Add one above!
          </p>
        ) : (
          <div>
            {upcoming.map(trip => (
              <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-bold text-white mb-4">Past Trips</h3>
        {past.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center bg-slate-900/30 border border-slate-800 rounded-xl">
            No past trips yet.
          </p>
        ) : (
          <div>
            {past.map(trip => (
              <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ============================================================================
// RECIPES VIEW COMPONENT
// ============================================================================

const RECIPE_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/1a1a2e/8b5cf6?text=Recipe';

const AddRecipeForm = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [link, setLink] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    onAdd({
      id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      photo: photo.trim(),
      prepTime: prepTime.trim(),
      link: link.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      createdAt: new Date().toISOString()
    });
    setName('');
    setPhoto('');
    setPrepTime('');
    setLink('');
    setIngredients('');
    setInstructions('');
    setError('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Add Recipe</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grandma's Lasagna"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1">Prep Time</label>
          <input
            type="text"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="e.g. 45 min"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Link <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">
            Photo <span className="text-slate-500">(URL)</span>
          </label>
          <input
            type="text"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">Ingredients</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="One per line…"
            rows={4}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-y"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step-by-step…"
            rows={5}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-y"
          />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Add Recipe
        </button>
      </div>
    </form>
  );
};

const RecipeCard = ({ recipe, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors group">
      <div
        className="aspect-video bg-slate-900 overflow-hidden cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <img
          src={recipe.photo || RECIPE_PHOTO_PLACEHOLDER}
          alt={recipe.name}
          onError={(e) => { e.currentTarget.src = RECIPE_PHOTO_PLACEHOLDER; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <ChefHat size={18} className="text-purple-400 shrink-0" />
              <span className="truncate">{recipe.name}</span>
            </h4>
            {recipe.prepTime && (
              <p className="text-sm text-slate-400 mt-1">⏱ {recipe.prepTime}</p>
            )}
          </div>
          <button
            onClick={() => onDelete(recipe.id)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete recipe"
          >
            <Trash size={16} />
          </button>
        </div>

        {recipe.link && (
          <a
            href={recipe.link}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors break-all"
          >
            <LinkIcon size={14} />
            Source
          </a>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            {recipe.ingredients && (
              <div>
                <h5 className="text-sm font-semibold text-purple-300 mb-1 uppercase tracking-wide">Ingredients</h5>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{recipe.ingredients}</p>
              </div>
            )}
            {recipe.instructions && (
              <div>
                <h5 className="text-sm font-semibold text-purple-300 mb-1 uppercase tracking-wide">Instructions</h5>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{recipe.instructions}</p>
              </div>
            )}
            {!recipe.ingredients && !recipe.instructions && (
              <p className="text-sm text-slate-500 italic">No details saved.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RecipesView = ({ recipes, onAddRecipe, onDeleteRecipe }) => {
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? recipes.filter(r =>
        (r.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (r.ingredients || '').toLowerCase().includes(query.toLowerCase())
      )
    : recipes;
  const sorted = [...filtered].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );

  return (
    <div>
      <AddRecipeForm onAdd={onAddRecipe} />

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes by name or ingredient…"
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
          {query
            ? 'No recipes match your search.'
            : 'No recipes yet. Add your first one above!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sorted.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDeleteRecipe} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DATES VIEW COMPONENT (restaurants, bars, coffee, brunch with Google Maps)
// ============================================================================

const getDateCategoryLabel = (value) => {
  const found = DATE_CATEGORIES.find(c => c.value === value);
  return found ? found.label : 'Other';
};

// Autocomplete input backed by Google Places. Falls back to a plain input
// (and plain saves without lat/lng) when Maps is unavailable.
const PlacesAutocompleteInput = ({ value, onChange, onPlaceSelected, disabled, placeholder }) => {
  const inputRef = React.useRef(null);
  const autocompleteRef = React.useRef(null);

  useEffect(() => {
    if (disabled || !inputRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name', 'place_id']
        });
        autocompleteRef.current = ac;
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (!place?.geometry?.location) return;
          onPlaceSelected({
            name: place.name || '',
            address: place.formatted_address || place.name || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id || ''
          });
        });
      })
      .catch((err) => {
        console.warn('Places Autocomplete unavailable:', err.message);
      });

    return () => {
      cancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [disabled]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-60"
    />
  );
};

const AddDateForm = ({ onAdd, mapsAvailable }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [isFavourite, setIsFavourite] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    onAdd({
      id: `date-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      category,
      address: address.trim(),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      placeId: coords?.placeId ?? '',
      notes: notes.trim(),
      link: link.trim(),
      isFavourite,
      createdAt: new Date().toISOString()
    });
    setName('');
    setCategory('restaurant');
    setAddress('');
    setCoords(null);
    setNotes('');
    setLink('');
    setIsFavourite(false);
    setError('');
  };

  const handlePlaceSelected = (place) => {
    if (place.name && !name.trim()) {
      setName(place.name);
    }
    setAddress(place.address);
    setCoords({ lat: place.lat, lng: place.lng, placeId: place.placeId });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Add a Place</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-sm mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Café Lisboa"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-sm mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            {DATE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">
            Address {mapsAvailable
              ? <span className="text-slate-500">(start typing to pick from Google Maps)</span>
              : <span className="text-slate-500">(type manually — Maps key not configured)</span>}
          </label>
          <PlacesAutocompleteInput
            value={address}
            onChange={(val) => { setAddress(val); setCoords(null); }}
            onPlaceSelected={handlePlaceSelected}
            disabled={!mapsAvailable}
            placeholder="Search an address or place…"
          />
          {coords && (
            <p className="text-xs text-purple-300 mt-1">
              Pin placed at {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">
            Link <span className="text-slate-500">(optional)</span>
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-400 text-sm mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What to try, who recommended it, best time to go…"
            rows={2}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-y"
          />
        </div>
        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2 text-slate-300 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFavourite}
              onChange={(e) => setIsFavourite(e.target.checked)}
              className="accent-purple-500"
            />
            <Star size={16} filled={isFavourite} className={isFavourite ? 'text-yellow-300' : 'text-slate-400'} />
            Mark as favourite
          </label>
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus size={16} />
          Add Place
        </button>
      </div>
    </form>
  );
};

const DatesMap = ({ places, focusedId }) => {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef(new Map());
  const infoWindowRef = React.useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 38.7223, lng: -9.1393 }, // Lisbon default
          zoom: 3,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#cbd5e1' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
            { featureType: 'water', stylers: [{ color: '#0f172a' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] }
          ]
        });
        infoWindowRef.current = new google.maps.InfoWindow();
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('Map unavailable:', err.message);
        if (!cancelled) setStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  // Sync markers with places
  useEffect(() => {
    if (status !== 'ready') return;
    const google = window.google;
    const map = mapInstanceRef.current;
    if (!google || !map) return;

    const existingIds = new Set(markersRef.current.keys());
    const incomingIds = new Set();
    const bounds = new google.maps.LatLngBounds();
    let hasAny = false;

    places.forEach(place => {
      if (place.lat == null || place.lng == null) return;
      incomingIds.add(place.id);
      hasAny = true;
      bounds.extend({ lat: place.lat, lng: place.lng });

      let marker = markersRef.current.get(place.id);
      if (!marker) {
        marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          title: place.name
        });
        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            const linkHtml = place.link
              ? `<a href="${place.link}" target="_blank" rel="noreferrer noopener" style="color:#c4b5fd;">Open link</a>`
              : '';
            infoWindowRef.current.setContent(
              `<div style="color:#0f172a;min-width:180px;">
                <strong>${place.name}</strong><br/>
                <span style="text-transform:capitalize;">${getDateCategoryLabel(place.category)}</span><br/>
                ${place.address ? `<span>${place.address}</span><br/>` : ''}
                ${linkHtml}
              </div>`
            );
            infoWindowRef.current.open(map, marker);
          }
        });
        markersRef.current.set(place.id, marker);
      } else {
        marker.setPosition({ lat: place.lat, lng: place.lng });
        marker.setTitle(place.name);
      }
    });

    existingIds.forEach(id => {
      if (!incomingIds.has(id)) {
        const m = markersRef.current.get(id);
        if (m) m.setMap(null);
        markersRef.current.delete(id);
      }
    });

    if (hasAny) {
      map.fitBounds(bounds, 60);
      if (places.filter(p => p.lat != null).length === 1) {
        map.setZoom(14);
      }
    }
  }, [places, status]);

  // Focus/pan to a specific place when user clicks on the list
  useEffect(() => {
    if (status !== 'ready' || !focusedId) return;
    const marker = markersRef.current.get(focusedId);
    const map = mapInstanceRef.current;
    if (marker && map && window.google?.maps?.event) {
      map.panTo(marker.getPosition());
      map.setZoom(15);
      window.google.maps.event.trigger(marker, 'click');
    }
  }, [focusedId, status]);

  if (status === 'error') {
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-6 text-center">
        <MapPin size={32} className="mx-auto text-slate-500 mb-3" />
        <p className="text-slate-300 font-medium">Map unavailable</p>
        <p className="text-slate-500 text-sm mt-1">
          Set <code className="text-purple-300">GOOGLE_MAPS_API_KEY</code> in your Vercel
          environment variables to enable the map.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden mb-6">
      <div
        ref={mapRef}
        className="w-full h-[320px] sm:h-[420px] bg-slate-900"
      />
    </div>
  );
};

const DateCard = ({ place, onDelete, onFocus, onToggleFavourite, isFocused }) => {
  const categoryStyle = DATE_CATEGORY_STYLES[place.category] || DATE_CATEGORY_STYLES.other;
  const mapsLink = place.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
    : place.lat != null && place.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
      : place.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
        : null;

  return (
    <div
      className={`bg-slate-900/50 border rounded-2xl p-4 sm:p-5 transition-colors cursor-pointer group ${
        isFocused ? 'border-purple-500 shadow-lg shadow-purple-900/30' : 'border-slate-700 hover:border-purple-500/50'
      }`}
      onClick={() => onFocus(place.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-bold text-white truncate">{place.name}</h4>
            {place.isFavourite && (
              <Star size={16} filled className="text-yellow-300 shrink-0" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${categoryStyle}`}>
              {getDateCategoryLabel(place.category)}
            </span>
            {place.lat != null && place.lng != null && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-300">
                <MapPin size={12} /> pin
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavourite(place.id); }}
            className={`p-2 rounded-lg transition-colors ${
              place.isFavourite
                ? 'text-yellow-300 hover:bg-slate-700/50'
                : 'text-slate-400 hover:text-yellow-300 hover:bg-slate-700/50'
            }`}
            aria-label={place.isFavourite ? 'Unmark favourite' : 'Mark favourite'}
          >
            <Star size={16} filled={place.isFavourite} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(place.id); }}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete place"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {place.address && (
        <p className="text-sm text-slate-300 mt-2">{place.address}</p>
      )}
      {place.notes && (
        <p className="text-sm text-slate-400 mt-2 whitespace-pre-wrap">{place.notes}</p>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {place.link && (
          <a
            href={place.link}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors break-all"
          >
            <LinkIcon size={14} />
            Link
          </a>
        )}
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors"
          >
            <MapPin size={14} />
            Open in Maps
          </a>
        )}
      </div>
    </div>
  );
};

const DatesView = ({ places, onAddPlace, onDeletePlace, onToggleFavourite }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const [mapsAvailable, setMapsAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setMapsAvailable(true); })
      .catch(() => { if (!cancelled) setMapsAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = places.filter(p => {
    if (onlyFavourites && !p.isFavourite) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if ((b.isFavourite ? 1 : 0) !== (a.isFavourite ? 1 : 0)) {
      return (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0);
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return (
    <div>
      <AddDateForm onAdd={onAddPlace} mapsAvailable={mapsAvailable} />

      <DatesMap places={filtered} focusedId={focusedId} />

      <FilterBar label="Filter:">
        <FilterButton
          label="All"
          isActive={categoryFilter === 'all'}
          onClick={() => setCategoryFilter('all')}
        />
        {DATE_CATEGORIES.map(c => (
          <FilterButton
            key={c.value}
            label={c.label}
            isActive={categoryFilter === c.value}
            onClick={() => setCategoryFilter(c.value)}
          />
        ))}
        <FilterButton
          label="★ Favourites"
          isActive={onlyFavourites}
          onClick={() => setOnlyFavourites(v => !v)}
        />
      </FilterBar>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
          {places.length === 0
            ? 'No places yet. Add a restaurant, bar, coffee spot, or brunch place above!'
            : 'No places match the current filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(place => (
            <DateCard
              key={place.id}
              place={place}
              isFocused={focusedId === place.id}
              onDelete={onDeletePlace}
              onFocus={setFocusedId}
              onToggleFavourite={onToggleFavourite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

function MediaTracker() {
  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  );
  const [activeTab, setActiveTab] = useState('calendar');
  const [data, setData] = useState(null); // Start with null for loading state
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    movies: ['plan-to-watch'],
    tvshows: ['plan-to-watch'],
    books: ['plan-to-read']
  });

  // Load data once the user is signed in
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      const stored = await getStoredData();
      // Migrate old anime data into tvshows and ensure all keys exist
      const migrated = {
        movies: stored.movies || [],
        tvshows: [...(stored.tvshows || []), ...(stored.anime || [])],
        books: stored.books || [],
        calendarEvents: stored.calendarEvents || [],
        trips: stored.trips || [],
        recipes: stored.recipes || [],
        dates: stored.dates || []
      };
      setData(migrated);
      setLoading(false);
    };
    loadData();
  }, [isAuthenticated]);

  // Persist data whenever it changes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (data) {
      saveData(data);
    }
  }, [data, isAuthenticated]);

  // Event Handlers
  const handleAdd = (item) => {
    const defaultStatus = getDefaultStatus(item.category);
    const newItem = { ...item, status: defaultStatus };

    setData(prev => ({
      ...prev,
      [item.category]: [...prev[item.category], newItem]
    }));

    setSearchModalOpen(false);
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

  const toggleFilter = (status) => {
    setSelectedFilters(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].includes(status)
        ? prev[activeTab].filter(s => s !== status)
        : [...prev[activeTab], status]
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

  // Gate the entire UI behind the login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // Show loading screen while data is being fetched
  if (loading || !data) {
    return <LoadingScreen />;
  }

  const isMediaTab = MEDIA_TABS.includes(activeTab);

  // Selectors (media tabs only)
  const filteredItems = isMediaTab
    ? data[activeTab].filter(item => selectedFilters[activeTab].includes(item.status))
    : [];

  const tabs = getDefaultTabs();
  const filterOptions = isMediaTab ? getFilterOptions(activeTab) : [];

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
      `}</style>

      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchClick={() => setGlobalSearchOpen(true)}
        onAddClick={() => setSearchModalOpen(true)}
        tabs={tabs}
        showMediaActions={isMediaTab}
      />

      {/* Main Content */}
      <div className="flex-1 max-w-8xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {isMediaTab && (
          <>
            <FilterBar label="Filter:">
              {filterOptions.map(option => (
                <FilterButton
                  key={option.value}
                  label={option.label}
                  isActive={selectedFilters[activeTab].includes(option.value)}
                  onClick={() => toggleFilter(option.value)}
                />
              ))}
            </FilterBar>

            <MediaGrid
              items={filteredItems}
              renderItem={item => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                />
              )}
              emptyComponent={<EmptyState onAddClick={() => setSearchModalOpen(true)} />}
            />
          </>
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            events={data.calendarEvents || []}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {activeTab === 'trips' && (
          <TripsView
            trips={data.trips || []}
            onAddTrip={handleAddTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        )}

        {activeTab === 'dates' && (
          <DatesView
            places={data.dates || []}
            onAddPlace={handleAddDate}
            onDeletePlace={handleDeleteDate}
            onToggleFavourite={handleToggleFavouriteDate}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={data.recipes || []}
            onAddRecipe={handleAddRecipe}
            onDeleteRecipe={handleDeleteRecipe}
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

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        category={activeTab}
        onAdd={handleAdd}
      />
    </div>
  );
}

// Make component globally available
window.MediaTracker = MediaTracker;