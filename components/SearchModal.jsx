const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// SEARCH MODAL COMPONENT
// ============================================================================

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
          case 'tvshows':
            searchResults = await searchTvShows(query);
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
            <h2 className="text-2xl font-bold text-white">Search {getCategoryName(category)}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Close size={24} />
            </button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search for ${category}...`}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            autoFocus
          />

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {results.length === 0 && !loading && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              {query ? 'No results found. Try a different search.' : 'Enter a search term to get started.'}
            </div>
          )}

          {loading && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              Searching...
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
            {results.map(item => (
              <ResultCard key={item.id} item={item} category={category} onAdd={onAdd} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { SearchModal });
