/**
 * Configuration file for API keys and constants
 *
 * For local development, create a .env.local file (see .env.example).
 * On Vercel, set environment variables in the project settings.
 */

// API Configuration
export const API_CONFIG = {
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    API_KEY: 'TMDB_API_KEY_PLACEHOLDER',
    ENDPOINTS: {
      SEARCH_MULTI: '/search/multi'
    }
  },
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

// Storage Configuration
export const STORAGE_CONFIG = {
  KEY: 'media-tracker-data',
  SCHEMA: {
    movies: [],
    tvshows: [],
    books: []
  }
};

// Status Configuration
export const STATUS_CONFIG = {
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

// Status Labels and Styling
export const STATUS_STYLES = {
  'plan-to-watch': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'watching': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'completed': 'bg-green-500/20 text-green-300 border-green-500/30',
  'plan-to-read': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'reading': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'read': 'bg-green-500/20 text-green-300 border-green-500/30'
};

export const STATUS_LABELS = {
  'plan-to-watch': 'To Watch',
  'watching': 'Watching',
  'completed': 'Completed',
  'plan-to-read': 'To be Read',
  'reading': 'Reading',
  'read': 'Read'
};

// Filter Configuration
export const FILTER_CONFIG = {
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

// Tab Configuration
export const TAB_CONFIG = {
  MOVIES: {
    id: 'movies',
    label: 'Movies'
  },
  TV_SHOWS: {
    id: 'tvshows',
    label: 'TV Shows'
  },
  BOOKS: {
    id: 'books',
    label: 'Books'
  }
};

// Placeholder Images
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/500x750/1a1a2e/8b5cf6?text=No+Image';

// API Request Configuration
export const API_REQUEST_CONFIG = {
  DEBOUNCE_DELAY: 300,
  TIMEOUT: 10000
};

export const API_BASE_URL = '';  // Empty for relative paths in Vercel

export const FEATURES = {
  USE_REMOTE_STORAGE: true,
  SYNC_ENABLED: true
};