const React = window.React;

// ============================================================================
// API HELPER FUNCTIONS (global scope, no ES modules)
// ============================================================================

// Browser-used API helpers live in this global script because the app runs
// without a bundler or ES module imports.
// Empty string = same-origin, so preview + production deployments each hit
// their own /api routes instead of falling back to a hardcoded URL.
const API_BASE = window.API_BASE_URL ?? '';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
const pendingSpaceSaves = new Map();

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
  return localStorage.getItem('couple-planner-auth-token') || sessionStorage.getItem('couple-planner-auth-token');
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

const geocodeAddress = async (address) => {
  const query = String(address || '').trim();
  if (query.length < 2) {
    return { lat: null, lng: null, status: 'empty', error: '' };
  }

  try {
    const res = await fetch(`${API_BASE}/api/nominatim?q=${encodeURIComponent(query)}`, {
      headers: getAuthorizedHeaders()
    });
    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        lat: null,
        lng: null,
        status: 'failed',
        error: payload?.error || 'Address lookup failed'
      };
    }

    const result = Array.isArray(payload) ? payload[0] : null;
    const lat = Number(result?.lat);
    const lng = Number(result?.lon);

    if (!result || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { lat: null, lng: null, status: 'unresolved', error: 'Address not found' };
    }

    return {
      lat,
      lng,
      status: 'resolved',
      error: '',
      displayName: result.display_name || query
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { lat: null, lng: null, status: 'failed', error: 'Address lookup failed' };
  }
};

const clearAuthToken = () => {
  localStorage.removeItem('couple-planner-auth-token');
  localStorage.removeItem('couple-planner-user');
  sessionStorage.removeItem('couple-planner-auth-token');
};

const setAuthToken = (token, persist = true) => {
  if (persist) {
    localStorage.setItem('couple-planner-auth-token', token);
  } else {
    sessionStorage.setItem('couple-planner-auth-token', token);
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
      localStorage.setItem('couple-planner-user', JSON.stringify(data.user));
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
// SPACE DATA FUNCTIONS
// ============================================================================

const getCachedSpaceData = (spaceId) => {
  try {
    const cached = localStorage.getItem(`space-data-${spaceId}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error reading cached space data:', error);
    return null;
  }
};

const cacheSpaceData = (spaceId, data) => {
  try {
    localStorage.setItem(`space-data-${spaceId}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching space data locally:', error);
  }
};

const getSpaceData = async (spaceId) => {
  try {
    const token = getAuthToken() || sessionStorage.getItem('couple-planner-auth-token');
    if (!token) return getCachedSpaceData(spaceId);

    const res = await fetch(`${API_BASE}/api/space/${spaceId}/data`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return getCachedSpaceData(spaceId);
    return await res.json();
  } catch (error) {
    console.error('Error fetching space data:', error);
    return getCachedSpaceData(spaceId);
  }
};

const persistSpaceData = async (spaceId, data) => {
  try {
    const token = getAuthToken() || sessionStorage.getItem('couple-planner-auth-token');
    if (!token) return false;

    const res = await fetch(`${API_BASE}/api/space/${spaceId}/data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });
    
    return res.ok;
  } catch (error) {
    console.error('Error saving space data to API:', error);
    return false;
  }
};

const saveSpaceData = async (spaceId, data, { debounceMs = 700 } = {}) => {
  cacheSpaceData(spaceId, data);

  if (debounceMs <= 0) {
    return persistSpaceData(spaceId, data);
  }

  const previous = pendingSpaceSaves.get(spaceId);
  if (previous) {
    clearTimeout(previous.timeoutId);
    previous.resolve(false);
  }

  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(async () => {
      pendingSpaceSaves.delete(spaceId);
      resolve(await persistSpaceData(spaceId, data));
    }, debounceMs);

    pendingSpaceSaves.set(spaceId, { timeoutId, resolve, data });
  });
};

const flushPendingSpaceSaves = async () => {
  const entries = [...pendingSpaceSaves.entries()];
  pendingSpaceSaves.clear();
  return Promise.all(entries.map(([spaceId, { timeoutId, resolve, data: pendingData }]) => {
    clearTimeout(timeoutId);
    return persistSpaceData(spaceId, pendingData).then(result => {
      resolve(result);
      return result;
    });
  }));
};

const flushPendingSpaceSavesViaBeacon = () => {
  const token = getAuthToken();
  if (!token) return;
  for (const [spaceId, { timeoutId, resolve, data: pendingData }] of pendingSpaceSaves.entries()) {
    clearTimeout(timeoutId);
    resolve(false);
    fetch(`${API_BASE}/api/space/${spaceId}/data`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: pendingData }),
      keepalive: true
    }).catch(() => {});
  }
  pendingSpaceSaves.clear();
};

const changePassword = async (currentPassword, newPassword) => {
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to change password');
  }

  return payload;
};

const changeEmail = async (newEmail) => {
  const res = await fetch(`${API_BASE}/api/auth/change-email`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ newEmail })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to initiate email change');
  }

  return payload;
};

const confirmEmailChange = async (token) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/confirm-email-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data.message || data.error,
      linkStatus: data.linkStatus
    };
  } catch {
    return { success: false, message: 'Network error occurred.', linkStatus: 'network' };
  }
};

const checkUsernameAvailable = async (username, excludeUserId = '') => {
  try {
    const params = new URLSearchParams({ username });
    if (excludeUserId) params.set('excludeUserId', excludeUserId);
    const res = await fetch(`${API_BASE}/api/auth/check-username?${params}`);
    const data = await res.json().catch(() => ({}));
    return { available: Boolean(data.available), reason: data.reason || '' };
  } catch {
    return { available: null, reason: '' };
  }
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
    localStorage.setItem('couple-planner-user', JSON.stringify(payload.user));
  }

  return payload.user;
};

const getUserSpaces = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/space`, {
      headers: getAuthorizedHeaders()
    });

    if (!res.ok) return [];
    const payload = await res.json();
    return payload.spaces || [];
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return [];
  }
};

const createSpace = async (name, enabledSections) => {
  const res = await fetch(`${API_BASE}/api/space`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ name, enabledSections })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to create space');
  }

  return { ...payload, space: payload.space || payload.shelf || null };
};

const joinSpace = async (spaceId, joinCode) => {
  const res = await fetch(`${API_BASE}/api/space/join`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify({ spaceId, joinCode })
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to join space');
  }

  return { ...payload, space: payload.space || payload.shelf || null };
};

const updateSpace = async (spaceId, updates) => {
  const res = await fetch(`${API_BASE}/api/space/${spaceId}`, {
    method: 'PATCH',
    headers: getAuthorizedHeaders(true),
    body: JSON.stringify(updates)
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to update space');
  }

  return payload.space || payload.shelf || null;
};

const getSpaceShareInfo = async (spaceId) => {
  const res = await fetch(`${API_BASE}/api/space/${spaceId}/share`, {
    headers: getAuthorizedHeaders()
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load space share details');
  }

  return payload;
};

const regenerateSpaceJoinCode = async (spaceId) => {
  const res = await fetch(`${API_BASE}/api/space/${spaceId}/share`, {
    method: 'POST',
    headers: getAuthorizedHeaders(true)
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to generate a new join code');
  }

  return payload;
};

const leaveSpace = async (spaceId) => {
  const res = await fetch(`${API_BASE}/api/space/${spaceId}/membership`, {
    method: 'DELETE',
    headers: getAuthorizedHeaders(true)
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to leave space');
  }

  try {
    localStorage.removeItem(`space-data-${spaceId}`);
  } catch {}

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
  changePassword,
  changeEmail,
  confirmEmailChange,
  checkUsernameAvailable,
  forgotPassword,
  resetPassword,
  geocodeAddress,
  getCachedSpaceData,
  getSpaceData,
  saveSpaceData,
  flushPendingSpaceSaves,
  flushPendingSpaceSavesViaBeacon,
  getUserSpaces,
  createSpace,
  joinSpace,
  updateSpace,
  getSpaceShareInfo,
  regenerateSpaceJoinCode,
  leaveSpace
});
