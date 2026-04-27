const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// GLOBAL SEARCH MODAL COMPONENT
// ============================================================================

const LibraryResultCard = ({ item, onSelect }) => {
  const safeThumbnail = window.safeImageUrl?.(item.thumbnail, PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;
  return (
  <div
    className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#410001]/10"
    onClick={() => onSelect(item)}
  >
    <div className="aspect-[2/3] overflow-hidden bg-[#FFDAD4]">
      <img
        src={safeThumbnail}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(65,0,1,0.9)] via-[rgba(65,0,1,0.5)] to-transparent p-2 opacity-0 transition duration-300 group-hover:opacity-100 sm:p-3">
      <h3 className="line-clamp-2 text-xs font-bold leading-tight text-white sm:text-sm">
        {item.title}
      </h3>
      {item.author && <p className="mt-0.5 text-[11px] font-medium text-white/80">{item.author}</p>}
      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/85 sm:gap-2">
        <span className="flex items-center gap-0.5">⭐ {item.rating}</span>
        <span>·</span>
        <span>{item.year}</span>
      </div>
    </div>
  </div>
  );
};

const GlobalSearchModal = ({ isOpen, onClose, data, setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const allItems = data.watchlist || [];
    setResults(filterByQuery(allItems, query));
  }, [query, data]);

  const handleResultClick = (item) => {
    setActiveTab(item.category);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="border-b border-[#E1D8D4] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-[#410001] sm:text-2xl">Search your library</h2>
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
              placeholder="Search your saved items..."
              className="w-full rounded-xl border border-[#E1D8D4] bg-white py-3 pl-10 pr-4 text-sm text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {results.length === 0 && (
            <div className="py-10 text-center text-sm text-[#534340] sm:py-14">
              {query ? 'No results found in your library.' : 'Search your saved items.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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

Object.assign(window, { GlobalSearchModal });
