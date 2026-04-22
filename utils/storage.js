/**
 * Storage utilities for persisting application data
 * Uses Vercel Postgres in production, falls back to localStorage
 */

import { STORAGE_CONFIG, API_BASE_URL, FEATURES } from '../config.js';

// Generate or retrieve persistent user ID for cloud sync
const getUserId = () => {
  let userId = localStorage.getItem('media-tracker-user-id');
  if (!userId) {
    // Use crypto.randomUUID if available, otherwise fallback
    userId = crypto.randomUUID?.() ||
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    localStorage.setItem('media-tracker-user-id', userId);
  }
  return userId;
};

const USER_ID = getUserId();

/**
 * Retrieve stored data - tries cloud first, falls back to localStorage
 * @returns {Promise<Object>} Stored data or default schema
 */
export const getStoredData = async () => {
  // Try cloud storage first if enabled
  if (FEATURES.USE_REMOTE_STORAGE) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/data`, {
        headers: { 'x-user-id': USER_ID }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Cache the cloud data locally for offline access
        localStorage.setItem('media-tracker-data-cache', JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch from cloud, falling back to cache:', error);
    }
    
    // Fallback to cached cloud data if available
    const cached = localStorage.getItem('media-tracker-data-cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached data:', e);
      }
    }
  }
  
  // Final fallback to localStorage (original behavior)
  try {
    const stored = localStorage.getItem(STORAGE_CONFIG.KEY);
    return stored ? JSON.parse(stored) : { ...STORAGE_CONFIG.SCHEMA };
  } catch (error) {
    console.error('Error retrieving stored data:', error);
    return { ...STORAGE_CONFIG.SCHEMA };
  }
};

/**
 * Save data to cloud and/or localStorage
 * @param {Object} data - Data to save
 * @returns {Promise<void>}
 */
export const saveData = async (data) => {
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

/**
 * Clear all stored data (both cloud and local)
 * @returns {Promise<void>}
 */
export const clearStoredData = async () => {
  // Clear cloud data if enabled
  if (FEATURES.USE_REMOTE_STORAGE) {
    try {
      await fetch(`${API_BASE_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': USER_ID
        },
        body: JSON.stringify({ data: { ...STORAGE_CONFIG.SCHEMA } })
      });
    } catch (error) {
      console.error('Error clearing cloud data:', error);
    }
  }
  
  // Clear local data
  try {
    localStorage.removeItem(STORAGE_CONFIG.KEY);
    localStorage.removeItem('media-tracker-data-cache');
  } catch (error) {
    console.error('Error clearing stored data:', error);
  }
};

/**
 * Export data as JSON for backup
 * @returns {Promise<string>} JSON string of all data
 */
export const exportData = async () => {
  const data = await getStoredData();
  return JSON.stringify(data, null, 2);
};

/**
 * Import data from JSON
 * @param {string} jsonString - JSON string to import
 * @returns {Promise<boolean>} Success status
 */
export const importData = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.movies && data.tvshows && data.books) {
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
 * Get the current user ID (for debugging/admin purposes)
 * @returns {string} Current user ID
 */
export const getCurrentUserId = () => USER_ID;

/**
 * Force sync with cloud (useful when coming back online)
 * @returns {Promise<boolean>} Success status
 */
export const forceCloudSync = async () => {
  if (!FEATURES.USE_REMOTE_STORAGE) return false;
  
  try {
    const localData = JSON.parse(localStorage.getItem(STORAGE_CONFIG.KEY) || '{}');
    const response = await fetch(`${API_BASE_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': USER_ID
      },
      body: JSON.stringify({ data: localData })
    });
    return response.ok;
  } catch (error) {
    console.error('Force sync failed:', error);
    return false;
  }
};

/**
 * Check cloud connectivity
 * @returns {Promise<boolean>} True if cloud is reachable
 */
export const checkCloudConnection = async () => {
  if (!FEATURES.USE_REMOTE_STORAGE) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
};