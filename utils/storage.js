// ============================================================================
// STORAGE HELPERS (global scope, no ES modules)
// ============================================================================

const API_BASE = window.API_BASE_URL || 'https://shared-shelf.vercel.app';

// Fixed user ID for this household (fallback)
const USER_ID = 'diogo-monica-shared';

/**
 * Check if user is authenticated
 */
const isAuthenticated = () => {
  const token = localStorage.getItem('shared-shelf-auth-token');
  const sessionToken = sessionStorage.getItem('shared-shelf-auth-token');
  return !!(token || sessionToken);
};

/**
 * Authenticate user with credentials via API (legacy simple auth)
 */
const authenticate = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.authenticated) {
      localStorage.setItem('shared-shelf-legacy-auth', 'true');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
};

/**
 * Logout user
 */
const logout = () => {
  localStorage.removeItem('shared-shelf-auth-token');
  localStorage.removeItem('shared-shelf-legacy-auth');
  localStorage.removeItem('shared-shelf-user');
  sessionStorage.removeItem('shared-shelf-auth-token');
};

/**
 * Retrieve stored data - tries cloud first, falls back to localStorage
 */
const getStoredData = async () => {
  // Try cloud storage first
  try {
    const response = await fetch(`${API_BASE}/api/data`, {
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
  
  // Fallback to cached cloud data
  const cached = localStorage.getItem('media-tracker-data-cache');
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {
      console.error('Failed to parse cached data:', e);
    }
  }
  
  // Final fallback to original localStorage key
  try {
    const stored = localStorage.getItem('media-tracker-data');
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Error retrieving stored data:', error);
  }
  
  // Return default schema
  return {
    tasks: [],
    movies: [],
    tvshows: [],
    books: [],
    calendarEvents: [],
    trips: [],
    recipes: [],
    dates: [],
    profile: {
      users: [
        { id: 'user-1', name: 'Diogo', avatar: '', color: '#8b5cf6' },
        { id: 'user-2', name: 'Mónica', avatar: '', color: '#ec4899' }
      ]
    }
  };
};

/**
 * Save data to cloud and/or localStorage
 */
const saveData = async (data) => {
  // Always save to localStorage as backup
  try {
    localStorage.setItem('media-tracker-data', JSON.stringify(data));
    localStorage.setItem('media-tracker-data-cache', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  
  // Sync to cloud
  try {
    const response = await fetch(`${API_BASE}/api/data`, {
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
};

/**
 * Export data as JSON for backup
 */
const exportData = async () => {
  const data = await getStoredData();
  return JSON.stringify(data, null, 2);
};

/**
 * Import data from JSON
 */
const importData = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data && typeof data === 'object') {
      await saveData(data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};

/**
 * Check cloud connectivity
 */
const checkCloudConnection = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};

Object.assign(window, {
  isAuthenticated,
  authenticate,
  logout,
  getStoredData,
  saveData,
  exportData,
  importData,
  checkCloudConnection
});