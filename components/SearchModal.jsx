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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="border-b border-[#E1D8D4] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-[#410001] sm:text-2xl">Search {getCategoryName(category)}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              aria-label="Close"
            >
              <Close size={22} />
            </button>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#857370]">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search for ${category}...`}
              className="w-full rounded-xl border border-[#E1D8D4] bg-white py-3 pl-10 pr-4 text-sm text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]"
              autoFocus
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-[#FFB4A9] bg-[#FFDAD4] p-3 text-sm font-semibold text-[#C1121F]">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {results.length === 0 && !loading && (
            <div className="py-10 text-center text-sm text-[#534340] sm:py-14">
              {query ? 'No results found. Try a different search.' : 'Enter a search term to get started.'}
            </div>
          )}

          {loading && (
            <div className="py-10 text-center text-sm text-[#534340] sm:py-14">
              Searching...
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
