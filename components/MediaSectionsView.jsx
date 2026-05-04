const React = window.React;
const getMediaSectionsComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

// ============================================================================
// MEDIA SECTIONS VIEW COMPONENT
// ============================================================================

const MEDIA_SECTIONS = {
  movies: [
    { status: 'watching',      title: 'Watching' },
    { status: 'plan-to-watch', title: 'Planned to watch' },
    { status: 'completed',     title: 'Completed' }
  ],
  tvshows: [
    { status: 'watching',      title: 'Watching' },
    { status: 'plan-to-watch', title: 'Planned to watch' },
    { status: 'completed',     title: 'Completed' }
  ],
  books: [
    { status: 'reading',       title: 'Reading' },
    { status: 'plan-to-read',  title: 'To be read' },
    { status: 'read',          title: 'Read' }
  ]
};

const MEDIA_TYPE_TILES = [
  { id: 'tvshows', label: 'TV Shows', icon: 'Tv', description: 'Series, miniseries, and shows you follow.' },
  { id: 'movies', label: 'Movies', icon: 'Film', description: 'Films you have watched, planned, or want to revisit.' },
  { id: 'books', label: 'Books', icon: 'Book', description: 'Reading lists and books in progress.' }
];

const MEDIA_TYPE_LABELS = {
  tvshows: 'TV Show',
  movies: 'Movie',
  books: 'Book'
};

const MEDIA_TYPE_EMPTY_COPY = {
  tvshows: {
    title: 'No TV shows yet',
    message: 'Add a series to track what you are watching.',
    actionLabel: 'Add TV show',
    icon: 'Tv'
  },
  movies: {
    title: 'No movies yet',
    message: 'Save films to watch, finish, or remember.',
    actionLabel: 'Add movie',
    icon: 'Film'
  },
  books: {
    title: 'No books yet',
    message: 'Build a shared reading list.',
    actionLabel: 'Add book',
    icon: 'Book'
  }
};

const MediaSectionsView = ({ activeTab, items, onStatusChange, onAddClick, onProgressChange, onMediaTypeSelect, watchFilter, onWatchFilterChange, watchOptions }) => {
  const { useState } = React;
  const [showCompleted, setShowCompleted] = useState(true);
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;
  const MediaCard = window.getWindowComponent?.('MediaCard', window.MissingComponent) || window.MissingComponent;
  const Plus = getMediaSectionsComponent('Plus');
  const ChevronLeft = getMediaSectionsComponent('ChevronLeft');
  const filterOptions = Array.isArray(watchOptions) && watchOptions.length
    ? watchOptions
    : [{ id: 'together', label: 'Together' }];
  const watchLabelById = filterOptions.reduce((labels, option) => ({ ...labels, [option.id]: option.label }), {});
  if (!activeTab) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Entertainment</h2>
          <p className="mt-1 text-sm text-[#000000]">Keep track of what you're watching and reading.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {MEDIA_TYPE_TILES.map(({ id, label, icon, description }) => {
            const Icon = getMediaSectionsComponent(icon);
            return (
            <button
              key={id}
              type="button"
              onClick={() => onMediaTypeSelect?.(id)}
              className="group flex min-h-[44px] flex-col items-start gap-4 rounded-2xl border border-[#E1D8D4] bg-white p-6 text-left text-[#000000] shadow-sm transition hover:-translate-y-1 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#000000]/10 focus:outline-none focus:ring-4 focus:ring-[#FFB4A9]/40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFDAD4] text-[#E63B2E] transition group-hover:bg-[#E63B2E] group-hover:text-white">
                <Icon size={26} />
              </span>
              <div>
                <p className="text-lg font-extrabold">{label}</p>
                <p className="mt-1 text-sm font-medium text-[#000000]">{description}</p>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    );
  }

  const sections = MEDIA_SECTIONS[activeTab] || [];
  const addLabel = MEDIA_TYPE_LABELS[activeTab] || 'Item';
  const tileLabel = MEDIA_TYPE_TILES.find(tile => tile.id === activeTab)?.label || 'Entertainment';
  const emptyCopy = MEDIA_TYPE_EMPTY_COPY[activeTab] || {
    title: `No ${tileLabel.toLowerCase()} yet`,
    message: 'Add the first shared pick.',
    actionLabel: `Add ${addLabel.toLowerCase()}`,
    icon: 'Film'
  };
  const EmptyIcon = typeof emptyCopy.icon === 'string' ? getMediaSectionsComponent(emptyCopy.icon) : emptyCopy.icon;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMediaTypeSelect?.(null)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#E1D8D4] bg-white text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            aria-label="Back to media types"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">{tileLabel}</h2>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
        >
          <Plus size={18} />
          Add {addLabel}
        </button>
      </div>
      <div className="inline-flex rounded-xl border border-[#E1D8D4] bg-white p-1">
        {filterOptions.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => onWatchFilterChange?.(option.id)}
            className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold transition ${watchFilter === option.id ? 'bg-[#E63B2E] text-white' : 'text-[#000000] hover:bg-[#FFF8F5]'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={emptyCopy.title}
          message={emptyCopy.message}
          actionLabel={emptyCopy.actionLabel}
          icon={EmptyIcon}
          onAddClick={onAddClick}
        />
      ) : sections.map(section => {
        const sectionItems = items.filter(item => item.status === section.status);
        const isCompletedSection = ['completed', 'read'].includes(section.status);
        if (isCompletedSection && !showCompleted && sectionItems.length > 0) {
          return (
            <section key={section.status}>
              <button type="button" onClick={() => setShowCompleted(true)} className="mb-3 w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-left text-sm font-bold text-[#000000]">
                Show completed ({sectionItems.length})
              </button>
            </section>
          );
        }
        return (
          <section key={section.status}>
            <div className="mb-3 flex items-baseline justify-between border-b border-[#E1D8D4] pb-2">
              <h3 className="text-lg font-extrabold text-[#000000] sm:text-xl">{section.title}</h3>
              <div className="flex items-center gap-2">
                {isCompletedSection && sectionItems.length > 0 && <button type="button" onClick={() => setShowCompleted(false)} className="text-xs font-bold text-[#E63B2E]">Collapse</button>}
                <span className="text-xs font-semibold text-[#000000]">{sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}</span>
              </div>
            </div>
            {sectionItems.length === 0 ? (
              <EmptyState
                title={`No ${section.title.toLowerCase()} items`}
                message={`Move items here when they are ${section.title.toLowerCase()}.`}
                icon={EmptyIcon}
                compact
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {sectionItems.map(item => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onStatusChange={onStatusChange}
                    onProgressChange={onProgressChange}
                    watchModeLabel={watchLabelById[item.watchingMode] || (item.watchingMode === 'alone' ? 'Personal pick' : 'Together')}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

Object.assign(window, { MEDIA_SECTIONS, MediaSectionsView });
