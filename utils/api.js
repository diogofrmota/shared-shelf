const React = window.React;

// ============================================================================
// API HELPER FUNCTIONS (global scope, no ES modules)
// ============================================================================

// Config constants (inline since we can't import from config.js in browser)
// Empty string = same-origin, so preview + production deployments each hit
// their own /api routes instead of falling back to a hardcoded URL.
const API_BASE = window.API_BASE_URL ?? '';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
const pendingShelfSaves = new Map();

const safeExternalUrl = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';

  try {
    const url = new URL(raw, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
};

const safeImageUrl = (value, fallback = '') => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return fallback;
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(raw)) return raw;
  return safeExternalUrl(raw) || fallback;
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

// ============================================================================
// MEDIA SEARCH FUNCTIONS
// ============================================================================

const searchMovies = async (query) => {
  try {
    const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthorizedHeaders()
    });
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
    const [tmdbResult, jikanResult] = await Promise.allSettled([
      fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, { headers: getAuthorizedHeaders() }).then(r => {
        if (!r.ok) throw new Error('Failed to fetch TV shows');
        return r.json();
      }),
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
    url.searchParams.append('fields', 'key,title,author_name,first_publish_year,cover_i,ratings_average,number_of_pages_median');

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
  type: item.media_type === 'movie' ? 'Movie' : 'Tv Show',
  category: item.media_type === 'movie' ? 'movies' : 'tvshows'
});

const transformAnimeData = (item) => ({
  id: `mal-${item.mal_id}`,
  title: item.title,
  thumbnail: item.images?.jpg?.image_url || PLACEHOLDER_IMAGE,
  rating: item.score?.toFixed(1) || 'N/A',
  year: item.year || 'N/A',
  type: 'Tv Show',
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
  totalPages: Number.isFinite(Number(doc.number_of_pages_median)) ? Number(doc.number_of_pages_median) : null,
  type: 'Book',
  category: 'books'
});

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

const getAuthToken = () => {
  return localStorage.getItem('shared-shelf-auth-token') || sessionStorage.getItem('shared-shelf-auth-token');
};

const getAuthorizedHeaders = (includeJson = false) => {
  const headers = {};
  const token = getAuthToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
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
    movies: 'plan-to-watch',
    tvshows: 'plan-to-watch',
    books: 'plan-to-read'
  };
  return defaults[category] || 'plan-to-watch';
};

// ============================================================================
// LOGIN / REGISTER
// ============================================================================

const loginUser = async (email, password, rememberMe) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: email, password, rememberMe })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Login failed:', res.status, err);
      const parts = [err.error || `Login failed (HTTP ${res.status})`];
      if (err.hint) parts.push(err.hint);
      throw new Error(parts.join(' — '));
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

const registerUser = async (email, password, name, username) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, username })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Register failed:', res.status, err);
      const parts = [err.error || `Registration failed (HTTP ${res.status})`];
      if (err.hint) parts.push(err.hint);
      throw new Error(parts.join(' — '));
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

const confirmEmail = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/confirm-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && Boolean(data.message),
      message: data.message || data.error,
      linkStatus: data.linkStatus,
      nextAction: data.nextAction
    };
  } catch (error) {
    console.error('Confirm email error:', error);
    return { success: false, message: 'Network error occurred.', linkStatus: 'network' };
  }
};

const validateResetToken = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, validateOnly: true })
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && Boolean(data.message),
      message: data.message || data.error,
      linkStatus: data.linkStatus,
      nextAction: data.nextAction
    };
  } catch (error) {
    console.error('Validate reset token error:', error);
    return { success: false, message: 'Network error occurred.', linkStatus: 'network' };
  }
};

const resetPassword = async (token, newPassword) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok && Boolean(data.message),
      message: data.message || data.error,
      linkStatus: data.linkStatus,
      nextAction: data.nextAction
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, message: 'Network error occurred.', linkStatus: 'network' };
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

const getCachedShelfData = (shelfId) => {
  try {
    const cached = localStorage.getItem(`shelf-data-${shelfId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading cached shelf data:', error);
    return null;
  }
};

const cacheShelfData = (shelfId, data) => {
  try {
    localStorage.setItem(`shelf-data-${shelfId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching shelf data locally:', error);
  }
};

const getShelfData = async (shelfId) => {
  try {
    const token = getAuthToken() || sessionStorage.getItem('shared-shelf-auth-token');
    if (!token) return getCachedShelfData(shelfId);

    const res = await fetch(`${API_BASE}/api/shelf/${shelfId}/data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return getCachedShelfData(shelfId);
    return await res.json();
  } catch (error) {
    console.error('Error fetching shelf data:', error);
    return getCachedShelfData(shelfId);
  }
};

const persistShelfData = async (shelfId, data) => {
  try {
    const token = getAuthToken() || sessionStorage.getItem('shared-shelf-auth-token');
    if (!token) return false;

    const res = await fetch(`${API_BASE}/api/shelf/${shelfId}/data`, {
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

const saveShelfData = async (shelfId, data, { debounceMs = 700 } = {}) => {
  cacheShelfData(shelfId, data);

  if (debounceMs <= 0) {
    return persistShelfData(shelfId, data);
  }

  const previous = pendingShelfSaves.get(shelfId);
  if (previous) {
    clearTimeout(previous.timeoutId);
    previous.resolve(false);
  }

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(async () => {
      pendingShelfSaves.delete(shelfId);
      resolve(await persistShelfData(shelfId, data));
    }, debounceMs);

    pendingShelfSaves.set(shelfId, { timeoutId, resolve });
  });
};

const updateAccount = async ({ name, username }) => {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'PATCH',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ name, username })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to update profile');
  }

  if (payload.user) {
    localStorage.setItem('shared-shelf-user', JSON.stringify(payload.user));
  }

  return payload.user;
};

const getUserShelves = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/shelf`, {
      headers: getAuthorizedHeaders()
    });

    if (!res.ok) return [];
    const payload = await res.json();
    return payload.shelves || [];
  } catch (error) {
    console.error('Error fetching shelves:', error);
    return [];
  }
};

const createShelf = async (name, enabledSections) => {
  const res = await fetch(`${API_BASE}/api/shelf`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ name, enabledSections })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to create shelf');
  }

  return payload;
};

const joinShelf = async (shelfId, joinCode) => {
  const res = await fetch(`${API_BASE}/api/shelf/join`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ shelfId, joinCode })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to join shelf');
  }

  return payload;
};

const updateShelf = async (shelfId, updates) => {
  const res = await fetch(`${API_BASE}/api/shelf/${shelfId}`, {
    method: 'PATCH',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify(updates)
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to update shelf');
  }

  return payload.shelf || null;
};

const getShelfShareInfo = async (shelfId) => {
  const res = await fetch(`${API_BASE}/api/shelf/${shelfId}/share`, {
    headers: getAuthorizedHeaders()
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load shelf share details');
  }

  return payload;
};

const regenerateShelfJoinCode = async (shelfId) => {
  const res = await fetch(`${API_BASE}/api/shelf/${shelfId}/share`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true)
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to generate a new join code');
  }

  return payload;
};

// ============================================================================
// EXPORT ALL TO window
// ============================================================================

Object.assign(window, {
  searchMovies,
  searchTvShows,
  searchAnime,
  searchBooks,
  safeExternalUrl,
  safeImageUrl,
  escapeHtml,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getDefaultStatus,
  loginUser,
  registerUser,
  confirmEmail,
  validateResetToken,
  updateAccount,
  forgotPassword,
  resetPassword,
  getCachedShelfData,
  getShelfData,
  saveShelfData,
  getUserShelves,
  createShelf,
  joinShelf,
  updateShelf,
  getShelfShareInfo,
  regenerateShelfJoinCode
});
