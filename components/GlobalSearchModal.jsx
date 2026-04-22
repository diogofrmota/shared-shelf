/**
 * GlobalSearchModal Component
 * Modal for searching within saved library items
 */

const React = window.React;
const { useState, useEffect } = React;

import { Close } from './Icons.jsx';
import { filterByQuery, getCategoryName } from '../utils/helpers.js';

/**
 * Reusable library result card
 */
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

export const GlobalSearchModal = ({ isOpen, onClose, data, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Filter library items
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
        {/* Header */}
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

          {/* Search Input */}
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

        {/* Results Grid */}
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
