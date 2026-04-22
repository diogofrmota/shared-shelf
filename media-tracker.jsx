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
    anime: [],
    books: []
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
  'plan-to-read': 'To Read',
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
    { value: 'plan-to-read', label: 'To Read' },
    { value: 'reading', label: 'Reading' },
    { value: 'read', label: 'Read' }
  ]
};

const TAB_CONFIG = {
  MOVIES: { id: 'movies', label: 'Movies/Shows' },
  ANIME: { id: 'anime', label: 'Anime' },
  BOOKS: { id: 'books', label: 'Books' }
};

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
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => transformMovieData(item));
  } catch (error) {
    console.error('Movie search error:', error);
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
          case 'anime':
            searchResults = await searchAnime(query);
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
      ...data.anime.map(a => ({ ...a, category: 'anime' })),
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
  tabs
}) => (
  <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-40">
    <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Diogo & Mónica's Tracker
          </h1>
        </div>
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
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  </div>
);

const getDefaultTabs = () => [
  { id: TAB_CONFIG.MOVIES.id, label: TAB_CONFIG.MOVIES.label, icon: Film },
  { id: TAB_CONFIG.ANIME.id, label: TAB_CONFIG.ANIME.label, icon: Tv },
  { id: TAB_CONFIG.BOOKS.id, label: TAB_CONFIG.BOOKS.label, icon: Book }
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

function MediaTracker() {
  // State Management
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  );
  const [activeTab, setActiveTab] = useState('movies');
  const [data, setData] = useState(null); // Start with null for loading state
  const [loading, setLoading] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    movies: ['plan-to-watch'],
    anime: ['plan-to-watch'],
    books: ['plan-to-read']
  });

  // Load data once the user is signed in
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      const stored = await getStoredData();
      setData(stored);
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

  // Gate the entire UI behind the login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  // Show loading screen while data is being fetched
  if (loading || !data) {
    return <LoadingScreen />;
  }

  // Selectors
  const filteredItems = data[activeTab].filter(item =>
    selectedFilters[activeTab].includes(item.status)
  );

  const tabs = getDefaultTabs();
  const filterOptions = getFilterOptions(activeTab);

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
      />

      {/* Main Content */}
      <div className="flex-1 max-w-8xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Filter Bar */}
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

        {/* Content Grid */}
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