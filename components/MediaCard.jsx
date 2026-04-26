const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// TV SHOW PROGRESS MODAL
// ============================================================================

const TvProgressModal = ({ item, onClose, onSave }) => {
  const isTmdb = item.id.startsWith('tmdb-');
  const isAnime = item.id.startsWith('mal-');

  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState(null);   // array of { season_number, episode_count }
  const [totalEpisodes, setTotalEpisodes] = useState(null); // for anime
  const [currentSeason, setCurrentSeason] = useState(item.progress?.currentSeason || 1);
  const [currentEpisode, setCurrentEpisode] = useState(item.progress?.currentEpisode || 1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (isTmdb) {
        const tmdbId = item.id.replace('tmdb-', '');
        const details = await fetchTvDetails(tmdbId);
        if (details?.seasons?.length) {
          setSeasons(details.seasons);
          // If we already have saved progress, restore selectors
          setCurrentSeason(item.progress?.currentSeason || 1);
          setCurrentEpisode(item.progress?.currentEpisode || 1);
        }
      } else if (isAnime) {
        const malId = item.id.replace('mal-', '');
        const details = await fetchAnimeDetails(malId);
        setTotalEpisodes(details?.episodes || null);
        setCurrentEpisode(item.progress?.currentEpisode || 1);
      }
      setLoading(false);
    };
    load();
  }, [item.id]);

  // Number of episodes in the current season (null = unknown)
  const episodeCount = isTmdb && seasons
    ? (seasons.find(s => s.season_number === currentSeason)?.episode_count || null)
    : totalEpisodes;

  const handleSave = () => {
    const progress = isTmdb
      ? { currentSeason, currentEpisode, seasons }
      : { currentEpisode, totalEpisodes };
    onSave(progress);
    onClose();
  };

  const selectCls = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide mb-1">Progress</p>
              <h3 className="font-bold text-white text-sm line-clamp-2">{item.title}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0">
              <Close size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-slate-400 text-sm">Loading show info…</div>
          ) : (
            <div className="space-y-4">
              {/* Season selector — only for TMDB shows with season data */}
              {isTmdb && seasons && seasons.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Season</label>
                  <select
                    value={currentSeason}
                    onChange={e => {
                      const s = Number(e.target.value);
                      setCurrentSeason(s);
                      setCurrentEpisode(1);
                    }}
                    className={selectCls}
                  >
                    {seasons.map(s => (
                      <option key={s.season_number} value={s.season_number}>
                        Season {s.season_number} ({s.episode_count} ep)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Episode selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Episode</label>
                {episodeCount ? (
                  <select
                    value={currentEpisode}
                    onChange={e => setCurrentEpisode(Number(e.target.value))}
                    className={selectCls}
                  >
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                      <option key={ep} value={ep}>Episode {ep}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={currentEpisode}
                    onChange={e => setCurrentEpisode(Math.max(1, Number(e.target.value)))}
                    className={selectCls}
                    placeholder="Episode number"
                  />
                )}
              </div>

              <button
                onClick={handleSave}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Save Progress
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MEDIA CARD COMPONENT
// ============================================================================

const MediaCard = ({ item, onStatusChange, onProgressChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const statusOptions = getStatusOptions(item.category);

  const isWatchingTvShow = item.category === 'tvshows' && item.status === 'watching';
  const progress = item.progress;

  const progressLabel = (() => {
    if (!progress) return null;
    if (progress.currentSeason) return `S${progress.currentSeason} E${progress.currentEpisode}`;
    if (progress.currentEpisode) return `Ep ${progress.currentEpisode}`;
    return null;
  })();

  return (
    <>
      <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20">
        <div className="aspect-2/3 overflow-hidden bg-slate-900 rounded-t-xl">
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            decoding="async"
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

            {/* Progress tracker — only for TV shows in Watching */}
            {isWatchingTvShow && (
              <button
                onClick={() => setShowProgressModal(true)}
                className="mt-2 w-full flex items-center justify-between gap-1 px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors group/prog"
              >
                <span className="text-xs text-blue-300 font-medium truncate">
                  {progressLabel || 'Set progress…'}
                </span>
                <span className="text-blue-400 opacity-60 group-hover/prog:opacity-100 transition-opacity text-xs shrink-0">✎</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showProgressModal && (
        <TvProgressModal
          item={item}
          onClose={() => setShowProgressModal(false)}
          onSave={(progress) => onProgressChange && onProgressChange(item.id, progress)}
        />
      )}
    </>
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
        loading="lazy"
        decoding="async"
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
