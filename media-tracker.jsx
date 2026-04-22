/**
 * Relationship Dashboard - Complete Application
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

// Shared library — every browser writes/reads the same bucket in Neon.
const USER_ID = 'diogo-monica-shared';

// Client-side auth management
const AUTH_STORAGE_KEY = 'media-tracker-auth';

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
};

// Authenticate with API
const authenticate = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

// Logout user
const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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

const CheckSquare = ({ size = 20, className = '' }) => (
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
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

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

const Eye = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOff = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const LogoutIcon = ({ size = 20, className = '' }) => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
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
      <p className="text-white text-lg">Loading ...</p>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await authenticate(username, password);
      if (success) {
        onLogin();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-900/60 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm"
      >
        <h1 className="text-2xl font-bold text-white text-center mb-1">Shared Dashboard</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Please enter your credentials to login.</p>

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
        <div className="relative mb-4">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Authenticating ...' : 'Sign in'}
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
// HEADER COMPONENT (Search button removed)
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

const getAddButtonText = (activeTab) => {
  switch(activeTab) {
    case 'tasks': return 'Add Task';
    case 'movies': return 'Add Movie';
    case 'tvshows': return 'Add TV Show';
    case 'books': return 'Add Book';
    case 'calendar': return 'Add Activity';
    case 'trips': return 'Add Trip';
    case 'dates': return 'Add Place';
    case 'recipes': return 'Add Recipe';
    default: return 'Add New';
  }
};

const Header = ({
  activeTab,
  onTabChange,
  onAddClick,
  onLogout,
  tabs,
  showMediaActions = true
}) => (
  <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-40">
    <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Diogo & Mónica - Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {showMediaActions && (
            <button
              onClick={onAddClick}
              className="flex-1 sm:flex-none px-3 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:gap-2 gap-1 text-sm sm:text-base shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{getAddButtonText(activeTab)}</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-3 bg-slate-700/30 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:gap-2 gap-1 text-sm sm:text-base border border-slate-700 hover:border-red-500"
              title="Logout"
            >
              <LogoutIcon size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  </div>
);

const getDefaultTabs = () => [
  { id: TAB_CONFIG.TASKS.id, label: TAB_CONFIG.TASKS.label, icon: CheckSquare },
  { id: TAB_CONFIG.CALENDAR.id, label: TAB_CONFIG.CALENDAR.label, icon: CalendarIcon },
  { id: TAB_CONFIG.DATES.id, label: TAB_CONFIG.DATES.label, icon: Utensils },
  { id: TAB_CONFIG.TRIPS.id, label: TAB_CONFIG.TRIPS.label, icon: MapPin },
  { id: TAB_CONFIG.RECIPES.id, label: TAB_CONFIG.RECIPES.label, icon: ChefHat },
  { id: TAB_CONFIG.TV_SHOWS.id, label: TAB_CONFIG.TV_SHOWS.label, icon: Tv },
  { id: TAB_CONFIG.MOVIES.id, label: TAB_CONFIG.MOVIES.label, icon: Film },
  { id: TAB_CONFIG.BOOKS.id, label: TAB_CONFIG.BOOKS.label, icon: Book }
];

// ============================================================================
// ADD MODAL COMPONENT
// ============================================================================

const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
})();

const FormField = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-300">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const AddModal = ({ isOpen, onClose, activeTab, onAddMedia, onAddEvent, onAddTrip, onAddRecipe, onAddDate, onAddTask }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setShowSearchModal(false);
      setFormData({});
    }
  }, [isOpen]);

  const getModalTitle = () => {
    switch(activeTab) {
      case 'tasks': return 'Add Task';
      case 'movies': return 'Add Movie';
      case 'tvshows': return 'Add TV Show';
      case 'books': return 'Add Book';
      case 'calendar': return 'Add Activity';
      case 'trips': return 'Add Trip';
      case 'dates': return 'Add Place';
      case 'recipes': return 'Add Recipe';
      default: return 'Add Item';
    }
  };

  const isMediaType = ['movies', 'tvshows', 'books'].includes(activeTab);

  const handleSubmit = (e) => {
    e.preventDefault();
    const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    switch(activeTab) {
      case 'tasks':
        if (formData.title) {
          onAddTask({
            id: `task-${uid()}`,
            title: formData.title,
            description: formData.description || '',
            completed: false,
            createdAt: new Date().toISOString()
          });
          onClose();
        }
        break;
      case 'calendar':
        if (formData.title && formData.date) {
          onAddEvent({
            id: `event-${uid()}`,
            title: formData.title,
            date: formData.date,
            startDate: formData.date,
            endDate: formData.endDate || formData.date,
            time: formData.time || '',
            description: formData.description || ''
          });
          onClose();
        }
        break;
      case 'trips':
        if (formData.destination) {
          onAddTrip({
            id: `trip-${uid()}`,
            destination: formData.destination,
            year: formData.startDate ? parseInt(formData.startDate.split('-')[0]) : new Date().getFullYear(),
            startDate: formData.startDate || '',
            endDate: formData.endDate || '',
            photo: formData.photo || '',
            accommodation: formData.accommodation || ''
          });
          onClose();
        }
        break;
      case 'recipes':
        if (formData.name) {
          onAddRecipe({
            id: `recipe-${uid()}`,
            name: formData.name,
            photo: formData.photo || '',
            prepTime: formData.prepTime || '',
            link: formData.link || '',
            ingredients: formData.ingredients || '',
            instructions: formData.instructions || '',
            createdAt: new Date().toISOString()
          });
          onClose();
        }
        break;
      case 'dates':
        if (formData.name) {
          onAddDate({
            id: `date-${uid()}`,
            name: formData.name,
            category: formData.category || 'restaurant',
            address: formData.address || '',
            lat: null,
            lng: null,
            notes: formData.notes || '',
            link: formData.link || '',
            isFavourite: formData.isFavourite || false,
            createdAt: new Date().toISOString()
          });
          onClose();
        }
        break;
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500";
  const selectCls = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500";

  if (isMediaType) {
    return (
      <SearchModal
        isOpen={isOpen}
        onClose={onClose}
        category={activeTab}
        onAdd={(item) => {
          onAddMedia(item);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700/50 sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{getModalTitle()}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Close size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === 'tasks' && (
            <>
              <FormField label="Title" required>
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  autoFocus
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  rows="3"
                  placeholder="Optional details…"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormField>
            </>
          )}

          {activeTab === 'calendar' && (
            <>
              <FormField label="Title" required>
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Date" required>
                <input
                  type="date"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="End Date">
                <input
                  type="date"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </FormField>
              <FormField label="Time">
                <select
                  className={selectCls}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  <option value="">— none —</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Description">
                <textarea
                  rows="3"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </FormField>
            </>
          )}

          {activeTab === 'trips' && (
            <>
              <FormField label="Destination" required>
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Start Date">
                <input
                  type="date"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </FormField>
              <FormField label="End Date">
                <input
                  type="date"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </FormField>
              <FormField label="Photo URL">
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                />
              </FormField>
              <FormField label="Accommodation URL">
                <input
                  type="url"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
                />
              </FormField>
            </>
          )}

          {activeTab === 'recipes' && (
            <>
              <FormField label="Name" required>
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Prep Time">
                <input
                  type="text"
                  placeholder="e.g. 45 min"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                />
              </FormField>
              <FormField label="Photo URL">
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                />
              </FormField>
              <FormField label="Recipe Link">
                <input
                  type="url"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </FormField>
              <FormField label="Ingredients">
                <textarea
                  placeholder="One per line"
                  rows="4"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                />
              </FormField>
              <FormField label="Instructions">
                <textarea
                  rows="5"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </FormField>
            </>
          )}

          {activeTab === 'dates' && (
            <>
              <FormField label="Place Name" required>
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Category">
                <select
                  className={selectCls}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="coffee">Coffee</option>
                  <option value="brunch">Brunch</option>
                  <option value="other">Other</option>
                </select>
              </FormField>
              <FormField label="Address">
                <input
                  type="text"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormField>
              <FormField label="Website">
                <input
                  type="url"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </FormField>
              <FormField label="Notes">
                <textarea
                  rows="3"
                  className={inputCls}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </FormField>
              <FormField label="Favourite">
                <label className="flex items-center gap-2 text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })}
                    className="accent-purple-500"
                  />
                  Mark as favourite
                </label>
              </FormField>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold mt-2"
          >
            {getModalTitle()}
          </button>
        </form>
      </div>
    </div>
  );
};

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

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

const formatDateLong = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} — ${date.toLocaleDateString(undefined, { weekday: 'long' })}`;
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

const CalendarView = ({ events, onDeleteEvent }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = buildMonthGrid(viewYear, viewMonth);

  const eventsByDate = events.reduce((acc, ev) => {
    const start = ev.startDate || ev.date;
    const end = ev.endDate || start;
    const cur = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');
    while (cur <= endD) {
      const iso = cur.toISOString().split('T')[0];
      if (!acc[iso]) acc[iso] = [];
      acc[iso].push(ev);
      cur.setDate(cur.getDate() + 1);
    }
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

  const monthStart = isoDateFromParts(viewYear, viewMonth, 1);
  const monthEnd = isoDateFromParts(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());

  const monthEvents = events
    .filter(ev => {
      const start = ev.startDate || ev.date;
      const end = ev.endDate || start;
      return start <= monthEnd && end >= monthStart;
    })
    .sort((a, b) => {
      const aStart = a.startDate || a.date;
      const bStart = b.startDate || b.date;
      if (aStart !== bStart) return aStart.localeCompare(bStart);
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
                      {(ev.startHour || ev.time) && <span className="font-medium mr-1">{ev.startHour || ev.time}</span>}
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
                <div className="flex flex-col items-center justify-center min-w-[64px] px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <span className="text-xs text-purple-300 font-medium tabular-nums">
                    {formatDateDisplay(ev.startDate || ev.date)}
                  </span>
                  {ev.endDate && ev.endDate !== (ev.startDate || ev.date) && (
                    <span className="text-xs text-purple-400 tabular-nums">
                      → {formatDateDisplay(ev.endDate)}
                    </span>
                  )}
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
                  {(ev.time || ev.startHour || ev.endHour) && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {ev.time
                        ? ev.time
                        : `${formatTime(ev.startHour)}${ev.startHour && ev.endHour ? ' – ' : ''}${formatTime(ev.endHour)}`
                      }
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

const TripsView = ({ trips, onDeleteTrip }) => {
  const currentYear = new Date().getFullYear();
  const sorted = [...trips].sort((a, b) => a.year - b.year);
  const upcoming = sorted.filter(t => t.year >= currentYear);
  const past = sorted.filter(t => t.year < currentYear).reverse();

  return (
    <div>
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

// SINGLE RecipeCard component with both onDelete and onEdit props
const RecipeCard = ({ recipe, onDelete, onEdit }) => {
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
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(recipe)}
                className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Edit recipe"
              >
                <span className="text-lg">✎</span>
              </button>
            )}
            <button
              onClick={() => onDelete(recipe.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete recipe"
            >
              <Trash size={16} />
            </button>
          </div>
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

const EditRecipeModal = ({ isOpen, onClose, recipe, onSave }) => {
  const [formData, setFormData] = useState(recipe || {});

  useEffect(() => {
    if (recipe) {
      setFormData(recipe);
    }
  }, [recipe]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Edit Recipe</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
              <Close size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                Recipe Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Prep Time</label>
              <input
                type="text"
                value={formData.prepTime || ''}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Photo URL</label>
              <input
                type="text"
                value={formData.photo || ''}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Recipe Link</label>
              <input
                type="url"
                value={formData.link || ''}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Ingredients</label>
              <textarea
                value={formData.ingredients || ''}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono text-sm"
                rows="4"
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Instructions</label>
              <textarea
                value={formData.instructions || ''}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                rows="4"
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
            
            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Updated RecipesView with edit functionality
const RecipesView = ({ recipes, onDeleteRecipe, onEditRecipe }) => {
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
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onDelete={onDeleteRecipe}
              onEdit={onEditRecipe}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DATES VIEW COMPONENT - UPDATED WITH LEAFLET/OPENSTREETMAP
// ============================================================================

const getDateCategoryLabel = (value) => {
  const found = DATE_CATEGORIES.find(c => c.value === value);
  return found ? found.label : 'Other';
};

// Simple address input (no Google Places dependency)
const AddressInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
  />
);

// Leaflet Map Component for Dates
const DatesLeafletMap = ({ places, focusedId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Check if Leaflet is available
    if (typeof window.L === 'undefined') {
      console.warn('Leaflet not loaded');
      return;
    }

    const L = window.L;
    
    // Only create map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([38.7223, -9.1393], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      setMapReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        markersRef.current.clear();
        setMapReady(false);
      }
    };
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;
    
    const L = window.L;
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    
    // Clear existing markers
    layerGroup.clearLayers();
    markersRef.current.clear();
    
    const bounds = L.latLngBounds([]);
    let hasMarkers = false;
    
    places.forEach(place => {
      if (place.lat != null && place.lng != null) {
        const latLng = L.latLng(place.lat, place.lng);
        bounds.extend(latLng);
        hasMarkers = true;
        
        const popupContent = `
          <div style="min-width:180px;">
            <strong>${place.name}</strong><br/>
            <span style="text-transform:capitalize;">${getDateCategoryLabel(place.category)}</span><br/>
            ${place.address ? `<span>${place.address}</span><br/>` : ''}
            ${place.link ? `<a href="${place.link}" target="_blank" rel="noreferrer noopener" style="color:#c4b5fd;">Open link</a>` : ''}
          </div>
        `;
        
        const marker = L.marker(latLng)
          .bindPopup(popupContent)
          .addTo(layerGroup);
        
        markersRef.current.set(place.id, marker);
      }
    });
    
    // Fit bounds if there are markers
    if (hasMarkers) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
  }, [places, mapReady]);

  // Focus on a specific place when focusedId changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !focusedId) return;
    
    const marker = markersRef.current.get(focusedId);
    if (marker) {
      const map = mapInstanceRef.current;
      map.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  }, [focusedId, mapReady]);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden mb-6" style={{ zIndex: 1 }}>
      <div
        ref={mapRef}
        className="w-full h-[320px] sm:h-[420px] bg-slate-900"
        style={{ zIndex: 1 }}
      />
      <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">
        © OpenStreetMap contributors
      </div>
    </div>
  );
};

const DateCard = ({ place, onDelete, onFocus, onToggleFavourite, isFocused }) => {
  const categoryStyle = DATE_CATEGORY_STYLES[place.category] || DATE_CATEGORY_STYLES.other;
  const mapsLink = (place.lat != null && place.lng != null)
    ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}&zoom=15`
    : place.address
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(place.address)}`
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
                <MapPin size={12} /> pinned
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
            Open in OpenStreetMap
          </a>
        )}
      </div>
    </div>
  );
};

// Nominatim search component for address lookup
const NominatimAddressSearch = ({ onSelect, placeholder = "Search for an address..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchPlaces = debounce(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nominatim?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      } catch (err) {
        console.error('Nominatim search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    fetchPlaces();
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
      />
      {loading && (
        <div className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 w-full text-slate-400 text-sm">
          Searching...
        </div>
      )}
      {showResults && results.length > 0 && (
        <ul className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-60 overflow-auto w-full shadow-lg">
          {results.map((place) => (
            <li
              key={place.place_id}
              className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm border-b border-slate-700 last:border-b-0 transition-colors"
              onClick={() => {
                onSelect({
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                  displayName: place.display_name,
                  address: place.display_name
                });
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DatesView = ({ places, onDeletePlace, onToggleFavourite }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [focusedId, setFocusedId] = useState(null);

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
      <DatesLeafletMap places={filtered} focusedId={focusedId} />

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
// TASKS VIEW COMPONENT
// ============================================================================

const TasksView = ({ tasks, onToggleTask, onDeleteTask, onUpdateTask, onReorderTasks, onAddClick }) => {
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Sort tasks: incomplete first, then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const activeCnt = tasks.filter(t => !t.completed).length;

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    setEditForm({ title: task.title, description: task.description || '' });
  };

  const handleSaveEdit = (taskId) => {
    if (!editForm.title.trim()) return;
    onUpdateTask?.(taskId, editForm.title.trim(), editForm.description.trim());
    setEditingTask(null);
    setEditForm({ title: '', description: '' });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: '', description: '' });
  };

  const handleMoveTask = (index, direction) => {
    const currentTasks = [...sortedTasks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= currentTasks.length) return;
    
    const task = currentTasks[index];
    const targetTask = currentTasks[newIndex];
    if (task.completed !== targetTask.completed) return;
    
    [currentTasks[index], currentTasks[newIndex]] = [currentTasks[newIndex], currentTasks[index]];
    onReorderTasks?.(currentTasks);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const currentTasks = [...sortedTasks];
    const draggedTask = currentTasks[draggedIndex];
    const targetTask = currentTasks[dropIndex];
    
    if (draggedTask.completed !== targetTask.completed) return;

    currentTasks.splice(draggedIndex, 1);
    currentTasks.splice(dropIndex, 0, draggedTask);
    onReorderTasks?.(currentTasks);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          {tasks.length > 0 && (
            <p className="text-slate-400 text-sm mt-0.5">
              {activeCnt} remaining · {tasks.length - activeCnt} done
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <FilterButton label="All"       isActive={filter === 'all'}       onClick={() => setFilter('all')} />
          <FilterButton label="Active"    isActive={filter === 'active'}    onClick={() => setFilter('active')} />
          <FilterButton label="Completed" isActive={filter === 'completed'} onClick={() => setFilter('completed')} />
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState onAddClick={onAddClick} />
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
            No tasks match this filter.
          </div>
        )
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task, index) => (
            <div
              key={task.id}
              draggable={editingTask !== task.id}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                task.completed
                  ? 'bg-slate-900/30 border-slate-800'
                  : 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50'
              } ${draggedIndex === index ? 'opacity-50' : ''} ${!task.completed ? 'cursor-move' : ''}`}
            >
              {editingTask === task.id ? (
                // Edit Mode
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    placeholder="Task title"
                    autoFocus
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    placeholder="Description (optional)"
                    rows="2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(task.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <>
                  <input
                    type="checkbox"
                    checked={task.completed || false}
                    onChange={() => onToggleTask(task.id)}
                    className="mt-1 w-4 h-4 rounded border-slate-600 accent-purple-500 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold leading-snug ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className={`text-sm mt-1 whitespace-pre-wrap ${task.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up/Down */}
                    {!task.completed && (
                      <>
                        <button
                          onClick={() => handleMoveTask(index, 'up')}
                          disabled={index === 0 || filteredTasks[index - 1]?.completed}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          aria-label="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveTask(index, 'down')}
                          disabled={index === filteredTasks.length - 1 || filteredTasks[index + 1]?.completed}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          aria-label="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {/* Edit */}
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
                      aria-label="Edit task"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                      aria-label="Delete task"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MEDIA SECTIONS VIEW
// ============================================================================

const MEDIA_SECTIONS = {
  movies: [
    { status: 'watching',      title: 'WATCHING' },
    { status: 'plan-to-watch', title: 'PLANNED TO WATCH' },
    { status: 'completed',     title: 'COMPLETED' }
  ],
  tvshows: [
    { status: 'watching',      title: 'WATCHING' },
    { status: 'plan-to-watch', title: 'PLANNED TO WATCH' },
    { status: 'completed',     title: 'COMPLETED' }
  ],
  books: [
    { status: 'reading',       title: 'READING' },
    { status: 'plan-to-read',  title: 'TO BE READ', },
    { status: 'read',          title: 'READ' }
  ]
};

const MediaSectionsView = ({ activeTab, items, onStatusChange, onAddClick }) => {
  const sections = MEDIA_SECTIONS[activeTab] || [];
  return (
    <div className="space-y-10 animate-fade-in">
      {sections.map(section => {
        const sectionItems = items.filter(item => item.status === section.status);
        return (
          <div key={section.status}>
            <div className="mb-5 border-b border-slate-800 pb-3">
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest">
                {section.title}
              </h2>
            </div>
            {sectionItems.length === 0 ? (
              <p className="text-slate-600 text-sm py-2 italic">Nothing here yet.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-12 gap-2 sm:gap-3 md:gap-4">
                {sectionItems.map(item => (
                  <MediaCard key={item.id} item={item} onStatusChange={onStatusChange} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

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
  const [editRecipeModalOpen, setEditRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

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
        dates: stored.dates || []
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
      saveData(data);
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

  // NEW: Update task content (title and description)
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

  // NEW: Reorder tasks (for drag-and-drop and move up/down)
  const handleReorderTasks = (reorderedTasks) => {
    setData(prev => ({
      ...prev,
      tasks: reorderedTasks
    }));
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
        onAddClick={() => setAddModalOpen(true)}
        onLogout={handleLogout}
        tabs={tabs}
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
          />
        )}

        {isMediaTab && (
          <MediaSectionsView
            activeTab={activeTab}
            items={data[activeTab] || []}
            onStatusChange={handleStatusChange}
            onAddClick={() => setAddModalOpen(true)}
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
          />
        )}

        {activeTab === 'dates' && (
          <DatesView
            places={data.dates || []}
            onDeletePlace={handleDeleteDate}
            onToggleFavourite={handleToggleFavouriteDate}
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
        onClose={() => setAddModalOpen(false)}
        activeTab={activeTab}
        onAddMedia={handleAddMedia}
        onAddEvent={handleAddEvent}
        onAddTrip={handleAddTrip}
        onAddRecipe={handleAddRecipe}
        onAddDate={handleAddDate}
        onAddTask={handleAddTask}
      />

      <EditRecipeModal
        isOpen={editRecipeModalOpen}
        onClose={() => setEditRecipeModalOpen(false)}
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
      />
    </div>
  );
}

// Make component globally available
window.MediaTracker = MediaTracker;