const React = window.React;

// ============================================================================
// API HELPER FUNCTIONS (global scope, no ES modules)
// ============================================================================

// Config constants (inline since we can't import from config.js in browser)
const API_BASE = window.API_BASE_URL || 'https://shared-shelf.vercel.app';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

// ============================================================================
// MEDIA SEARCH FUNCTIONS
// ============================================================================

const searchMovies = async (query) => {
  try {
    const url = new URL('https://api.themoviedb.org/3/search/multi');
    url.searchParams.append('api_key', window.TMDB_API_KEY || '');
    url.searchParams.append('query', query);
    url.searchParams.append('include_adult', 'false');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch movies');

    const data = await response.json();

    return data.results
      .filter(item => item.media_type === 'movie')
      .map(transformMovieData);
  } catch (error) {
    console.error('Movie search error:', error);
    return [];
  }
};

const searchTvShows = async (query) => {
  try {
    const url = new URL('https://api.themoviedb.org/3/search/multi');
    url.searchParams.append('api_key', window.TMDB_API_KEY || '');
    url.searchParams.append('query', query);
    url.searchParams.append('include_adult', 'false');

    const [tmdbResult, jikanResult] = await Promise.allSettled([
      fetch(url.toString()).then(r => r.json()),
      fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`).then(r => r.json())
    ]);

    const tvResults = tmdbResult.status === 'fulfilled'
      ? (tmdbResult.value.results || []).filter(i => i.media_type === 'tv').map(transformMovieData)
      : [];

    const animeResults = jikanResult.status === 'fulfilled'
      ? (jikanResult.value.data || []).map(transformAnimeData)
      : [];

    return [...tvResults, ...animeResults];
  } catch (error) {
    console.error('TV show search error:', error);
    return [];
  }
};

const searchAnime = async (query) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`);
    if (!response.ok) throw new Error('Failed to fetch anime');

    const data = await response.json();
    return data.data.map(transformAnimeData);
  } catch (error) {
    console.error('Anime search error:', error);
    return [];
  }
};

const searchBooks = async (query) => {
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.append('q', query);
    url.searchParams.append('limit', '20');
    url.searchParams.append('fields', 'key,title,author_name,first_publish_year,cover_i,ratings_average');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch books');

    const data = await response.json();
    return (data.docs || []).map(transformBookData);
  } catch (error) {
    console.error('Book search error:', error);
    return [];
  }
};

// ============================================================================
// DATA TRANSFORMERS
// ============================================================================

const transformMovieData = (item) => ({
  id: `tmdb-${item.id}`,
  title: item.title || item.name,
  thumbnail: item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : PLACEHOLDER_IMAGE,
  rating: item.vote_average?.toFixed(1) || 'N/A',
  year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A',
  type: item.media_type === 'movie' ? 'Movie' : 'TV Show',
  category: item.media_type === 'movie' ? 'movies' : 'tvshows'
});

const transformAnimeData = (item) => ({
  id: `mal-${item.mal_id}`,
  title: item.title,
  thumbnail: item.images?.jpg?.image_url || PLACEHOLDER_IMAGE,
  rating: item.score?.toFixed(1) || 'N/A',
  year: item.year || 'N/A',
  type: item.type || 'Anime',
  category: 'tvshows'
});

const transformBookData = (doc) => ({
  id: `book-${doc.key?.replace('/works/', '') || Math.random().toString(36).slice(2)}`,
  title: doc.title || 'Unknown Title',
  thumbnail: doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : PLACEHOLDER_IMAGE,
  rating: doc.ratings_average ? parseFloat(doc.ratings_average).toFixed(1) : 'N/A',
  year: doc.first_publish_year?.toString() || 'N/A',
  author: doc.author_name?.[0] || 'Unknown Author',
  category: 'books'
});

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

const getAuthToken = () => {
  return localStorage.getItem('shared-shelf-auth-token') || sessionStorage.getItem('shared-shelf-auth-token');
};

const clearAuthToken = () => {
  localStorage.removeItem('shared-shelf-auth-token');
  localStorage.removeItem('shared-shelf-user');
  sessionStorage.removeItem('shared-shelf-auth-token');
};

const setAuthToken = (token, persist = true) => {
  if (persist) {
    localStorage.setItem('shared-shelf-auth-token', token);
  } else {
    sessionStorage.setItem('shared-shelf-auth-token', token);
  }
};

const getDefaultStatus = (category) => {
  const defaults = {
    movies: 'toWatch',
    tvshows: 'toWatch',
    books: 'toRead'
  };
  return defaults[category] || 'toWatch';
};

// ============================================================================
// LOGIN / REGISTER
// ============================================================================

const loginUser = async (email, password, rememberMe) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    if (data.token && data.user) {
      setAuthToken(data.token, !!rememberMe);
      localStorage.setItem('shared-shelf-user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

const registerUser = async (email, password, name) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }

    const data = await res.json();
    if (data.token && data.user) {
      setAuthToken(data.token, true);
      localStorage.setItem('shared-shelf-user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json();
    return { success: res.ok, message: data.message || data.error };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, message: 'Network error occurred.' };
  }
};

const forgotPassword = async (email) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await res.json();
    return { success: res.ok, message: data.message || data.error };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { success: false, message: 'Network error occurred.' };
  }
};

// ============================================================================
// SHELF DATA FUNCTIONS
// ============================================================================

const getShelfData = async (shelfId) => {
  try {
    const token = getAuthToken() || sessionStorage.getItem('shared-shelf-auth-token');
    if (!token) return null;

    const res = await fetch(`${API_BASE}/api/shelves/${shelfId}/data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching shelf data:', error);
    
    // Fallback to localStorage
    const cached = localStorage.getItem(`shelf-data-${shelfId}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  }
};

const saveShelfData = async (shelfId, data) => {
  // Always save locally as backup
  try {
    localStorage.setItem(`shelf-data-${shelfId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error caching shelf data locally:', e);
  }

  // Try to save to API
  try {
    const token = getAuthToken() || sessionStorage.getItem('shared-shelf-auth-token');
    if (!token) return false;

    const res = await fetch(`${API_BASE}/api/shelves/${shelfId}/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });
    
    return res.ok;
  } catch (error) {
    console.error('Error saving shelf data to API:', error);
    return false;
  }
};

// ============================================================================
// EXPORT ALL TO window
// ============================================================================

Object.assign(window, {
  searchMovies,
  searchTvShows,
  searchAnime,
  searchBooks,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getDefaultStatus,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  getShelfData,
  saveShelfData
});