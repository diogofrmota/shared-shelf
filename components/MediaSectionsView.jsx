const React = window.React;
const { Plus, Tv, Film, Book } = window;

// ============================================================================
// MEDIA SECTIONS VIEW COMPONENT
// ============================================================================

const MEDIA_SECTIONS = {
  movies: [
    { status: 'watching',      title: 'WATCHING' },
    { status: 'plan-to-watch', title: 'PLANNED TO WATCH' },
    { status: 'completed',     title: 'COMPLETED' }
  ],
  tvshows: [
    { status: 'watching',      title: 'WATCHING' },
    { status: 'plan-to-watch', title: 'PLANNED TO WATCH' },
    { status: 'completed',     title: 'COMPLETED' }
  ],
  books: [
    { status: 'reading',       title: 'READING' },
    { status: 'plan-to-read',  title: 'TO BE READ' },
    { status: 'read',          title: 'READ' }
  ]
};

const MEDIA_TYPE_TILES = [
  { id: 'tvshows', label: 'TV Shows', icon: Tv },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'books', label: 'Books', icon: Book }
];

const MEDIA_TYPE_LABELS = {
  tvshows: 'TV Show',
  movies: 'Movie',
  books: 'Book'
};

const MediaSectionsView = ({ activeTab, items, onStatusChange, onAddClick, onProgressChange, onMediaTypeSelect }) => {
  if (!activeTab) {
    return (
      <div className="animate-fade-in">
        <div className="grid gap-4 sm:grid-cols-3">
          {MEDIA_TYPE_TILES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onMediaTypeSelect?.(id)}
              className="group flex aspect-square flex-col items-center justify-center gap-4 rounded-xl border border-[#e1d8d4] bg-white text-[#410001] shadow-sm transition hover:-translate-y-1 hover:border-[#e63b2e] hover:shadow-lg hover:shadow-red-950/10 focus:outline-none focus:ring-2 focus:ring-[#ffb4a9] focus:ring-offset-2"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#ffdad4] text-[#e63b2e] transition group-hover:bg-[#e63b2e] group-hover:text-white">
                <Icon size={30} />
              </span>
              <span className="text-lg font-extrabold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const sections = MEDIA_SECTIONS[activeTab] || [];
  const addLabel = MEDIA_TYPE_LABELS[activeTab] || 'Item';

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[#410001]">{MEDIA_TYPE_TILES.find(tile => tile.id === activeTab)?.label || 'Watchlist'}</h2>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-2 rounded-lg bg-[#e63b2e] px-4 py-3 text-sm font-bold text-[#ffffff] shadow-lg shadow-red-950/10 transition hover:bg-[#a9372c]"
        >
          <Plus size={18} />
          Add {addLabel}
        </button>
      </div>
      {sections.map(section => {
        const sectionItems = items.filter(item => item.status === section.status);
        return (
          <div key={section.status}>
            <div className="mb-5 border-b border-[#e1d8d4] pb-3">
              <h2 className="text-2xl font-extrabold text-[#410001] uppercase tracking-widest">
                {section.title}
              </h2>
            </div>
            {sectionItems.length === 0 ? (
              <p className="text-slate-600 text-sm py-2 italic">Nothing here yet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-10 gap-2 sm:gap-3 md:gap-4">
                {sectionItems.map(item => (
                  <MediaCard key={item.id} item={item} onStatusChange={onStatusChange} onProgressChange={onProgressChange} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

Object.assign(window, { MEDIA_SECTIONS, MediaSectionsView });
