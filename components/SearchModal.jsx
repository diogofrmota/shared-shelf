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
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError('');
      setHasSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        let searchResults = [];
        switch (category) {
          case 'movies':
            searchResults = await window.searchMovies?.(trimmed) || [];
            break;
          case 'tvshows':
            searchResults = await window.searchTvShows?.(trimmed) || [];
            break;
          case 'books':
            searchResults = await window.searchBooks?.(trimmed) || [];
            break;
          default:
            break;
        }
        if (active) setResults(searchResults);
      } catch (err) {
        if (active) setError('Failed to search. Please try again.');
        console.error('Search error:', err);
      } finally {
        if (active) {
          setLoading(false);
          setHasSearched(true);
        }
      }
    }, window.API_REQUEST_CONFIG?.DEBOUNCE_DELAY || 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category]);

  if (!isOpen) return null;
  const ModalShell = window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;
  const CloseIcon = window.getWindowComponent?.('Close', window.MissingIcon) || window.MissingIcon;
  const SearchIcon = window.getWindowComponent?.('Search', window.MissingIcon) || window.MissingIcon;
  const ResultCardComponent = window.getWindowComponent?.('ResultCard', window.MissingComponent) || window.MissingComponent;
  const categoryName = window.getCategoryName?.(category) || category;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Search ${categoryName}`}
      dialogClassName="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
    >
        <div className="border-b border-[#E1D8D4] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-[#410001] sm:text-2xl">Search {categoryName}</h2>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              aria-label="Close"
            >
              <CloseIcon size={22} />
            </button>
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#857370]">
              <SearchIcon size={18} />
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
              {!query ? 'Enter a search term to get started.' : hasSearched ? 'No results found. Try a different search.' : ''}
            </div>
          )}

          {loading && (
            <div className="py-10 text-center text-sm text-[#534340] sm:py-14">
              Searching...
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {results.map(item => (
              <ResultCardComponent key={item.id} item={item} category={category} onAdd={onAdd} />
            ))}
          </div>
        </div>
    </ModalShell>
  );
};

Object.assign(window, { SearchModal });
