// ============================================================================
// STORAGE HELPERS (global scope, no ES modules)
// ============================================================================

const API_BASE = window.API_BASE_URL ?? '';
const LEGACY_STORAGE_KEY = 'media-tracker-data';
const LEGACY_CACHE_KEY = 'media-tracker-data-cache';

const createDefaultStoredData = () => ({
  calendarEvents: [],
  tasks: [],
  locations: [],
  trips: [],
  recipes: [],
  watchlist: [],
  profile: {
    users: [
      { id: 'user-1', name: 'Diogo', avatar: '', color: '#c1121f' },
      { id: 'user-2', name: 'Mónica', avatar: '', color: '#669bbc' }
    ]
  }
});

/**
 * Check if user is authenticated
 */
const isAuthenticated = () => {
  const token = localStorage.getItem('couple-planner-auth-token');
  const sessionToken = sessionStorage.getItem('couple-planner-auth-token');
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
      localStorage.setItem('couple-planner-legacy-auth', 'true');
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
  localStorage.removeItem('couple-planner-auth-token');
  localStorage.removeItem('couple-planner-legacy-auth');
  localStorage.removeItem('couple-planner-user');
  sessionStorage.removeItem('couple-planner-auth-token');
};

/**
 * Retrieve stored data from localStorage.
 */
const getStoredData = async () => {
  // Legacy storage is local-only. Current cloud persistence is space-scoped
  // through /api/space/:id/data and requires an authenticated space member.
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Error retrieving stored data:', error);
  }

  const cached = localStorage.getItem(LEGACY_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {
      console.error('Failed to parse cached data:', e);
    }
  }
  
  return createDefaultStoredData();
};

/**
 * Save data to cloud and/or localStorage
 */
const saveData = async (data) => {
  // Always save to localStorage as backup
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
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
