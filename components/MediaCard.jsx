const React = window.React;
const { useState } = React;

// ============================================================================
// MEDIA CARD COMPONENT
// ============================================================================

const MediaCard = ({ item, onStatusChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const statusOptions = getStatusOptions(item.category);

  return (
    <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20">
      <div className="aspect-2/3 overflow-hidden bg-slate-900 rounded-t-xl">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-2 sm:p-3 md:p-4 space-y-1 sm:space-y-2">
        <div>
          <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2 leading-tight mb-1">
            {item.title}
          </h3>
          {item.author && (
            <p className="text-xs sm:text-xs text-slate-400">{item.author}</p>
          )}

          <div className="flex items-start justify-between mt-1 sm:mt-2">
            <div className="flex items-center flex-wrap gap-x-1 gap-y-0.5 text-xs text-slate-400 min-w-0">
              <span className="flex items-center gap-1">⭐ {item.rating}</span>
              <span>•</span>
              <span>{item.year}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ThreeDots size={16} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mb-2 bottom-full w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 z-20">
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(item.id, status);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        {formatStatusLabel(status)}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        onStatusChange(item.id, 'remove');
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors border-t border-slate-700 mt-1"
                    >
                      Remove from list
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// RESULT CARD COMPONENT (used in SearchModal)
// ============================================================================

const ResultCard = ({ item, category, onAdd }) => (
  <div
    className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 cursor-pointer"
    onClick={() => onAdd({ ...item, category })}
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
        {item.author && <p className="text-xs text-slate-400">{item.author}</p>}
        <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">⭐ {item.rating}</span>
          <span>•</span>
          <span>{item.year}</span>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { MediaCard, ResultCard });
