/**
 * API utilities for fetching data from external services
 * Handles movie, anime, and book searches
 * 
 * TMDB API key is configured in config.js (injected by GitHub Actions at deploy time)
 */

import { API_CONFIG, PLACEHOLDER_IMAGE } from '../config.js';

/**
 * Search for movies and TV shows using TMDB API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of movie/TV show objects
 */
export const searchMovies = async (query) => {
  try {
    const { TMDB } = API_CONFIG;
    
    const url = new URL(`${TMDB.BASE_URL}${TMDB.ENDPOINTS.SEARCH_MULTI}`);
    url.searchParams.append('api_key', TMDB.API_KEY);
    url.searchParams.append('query', query);
    url.searchParams.append('include_adult', false);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch movies');

    const data = await response.json();
    
    return data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => transformMovieData(item));
  } catch (error) {
    console.error('Movie search error:', error);
    return [];
  }
};

/**
 * Search for anime using Jikan API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of anime objects
 */
export const searchAnime = async (query) => {
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

/**
 * Search for books using Google Books API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of book objects
 */
export const searchBooks = async (query) => {
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

/**
 * Transform TMDB response to standardized format
 * @private
 */
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

/**
 * Transform Jikan response to standardized format
 * @private
 */
const transformAnimeData = (item) => ({
  id: `mal-${item.mal_id}`,
  title: item.title,
  thumbnail: item.images.jpg.image_url || PLACEHOLDER_IMAGE,
  rating: item.score?.toFixed(1) || 'N/A',
  year: item.year || 'N/A',
  type: item.type || 'Anime'
});

/**
 * Transform Google Books response to standardized format
 * @private
 */
const transformBookData = (item) => ({
  id: `book-${item.id}`,
  title: item.volumeInfo.title,
  thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || PLACEHOLDER_IMAGE,
  rating: item.volumeInfo.averageRating?.toFixed(1) || 'N/A',
  year: item.volumeInfo.publishedDate?.split('-')[0] || 'N/A',
  author: item.volumeInfo.authors?.[0] || 'Unknown Author'
});
