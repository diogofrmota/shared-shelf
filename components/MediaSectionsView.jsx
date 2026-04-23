const React = window.React;

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

const MediaSectionsView = ({ activeTab, items, onStatusChange, onAddClick, onProgressChange }) => {
  const sections = MEDIA_SECTIONS[activeTab] || [];
  return (
    <div className="space-y-10 animate-fade-in">
      {sections.map(section => {
        const sectionItems = items.filter(item => item.status === section.status);
        return (
          <div key={section.status}>
            <div className="mb-5 border-b border-slate-800 pb-3">
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-widest">
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
