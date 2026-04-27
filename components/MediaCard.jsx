const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// TV SHOW PROGRESS MODAL
// ============================================================================

const TvProgressModal = ({ item, onClose, onSave }) => {
  const isTmdb = item.id.startsWith('tmdb-');
  const isAnime = item.id.startsWith('mal-');

  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState(null);
  const [totalEpisodes, setTotalEpisodes] = useState(null);
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

  const selectCls = "w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm text-[#241A18] outline-none transition focus:border-[#E63B2E]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="mr-3 min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Progress</p>
              <h3 className="line-clamp-2 text-sm font-bold text-[#410001]">{item.title}</h3>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
              <Close size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-[#534340]">Loading show info…</div>
          ) : (
            <div className="space-y-4">
              {isTmdb && seasons && seasons.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#534340]">Season</label>
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

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#534340]">Episode</label>
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
                className="w-full rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#A9372C]"
              >
                Save progress
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// BOOK PROGRESS MODAL
// ============================================================================

const BookProgressModal = ({ item, onClose, onSave }) => {
  const initialTotalPages = Math.max(0, Math.floor(Number(item.progress?.totalPages ?? item.totalPages ?? 0) || 0));
  const initialCurrentPage = Math.min(
    Math.max(0, Math.floor(Number(item.progress?.currentPage ?? 0) || 0)),
    initialTotalPages || Number.MAX_SAFE_INTEGER
  );

  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  const clampedCurrentPage = totalPages ? Math.min(currentPage, totalPages) : currentPage;
  const progressPercent = totalPages ? Math.round((clampedCurrentPage / totalPages) * 100) : null;
  const numberInputCls = "w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm text-[#241A18] outline-none transition focus:border-[#E63B2E]";

  const handleCurrentPageChange = (value) => {
    const nextPage = Math.max(0, Math.floor(Number(value) || 0));
    setCurrentPage(totalPages ? Math.min(nextPage, totalPages) : nextPage);
  };

  const handleTotalPagesChange = (value) => {
    const nextTotal = Math.max(0, Math.floor(Number(value) || 0));
    setTotalPages(nextTotal);
    setCurrentPage(page => nextTotal ? Math.min(page, nextTotal) : page);
  };

  const handleSave = () => {
    const normalizedTotalPages = totalPages || null;
    const normalizedCurrentPage = normalizedTotalPages ? Math.min(currentPage, normalizedTotalPages) : currentPage;
    onSave({
      currentPage: normalizedCurrentPage,
      totalPages: normalizedTotalPages
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="mr-3 min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Progress</p>
              <h3 className="line-clamp-2 text-sm font-bold text-[#410001]">{item.title}</h3>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
              <Close size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#534340]">Current page</label>
              <input
                type="number"
                min="0"
                max={totalPages || undefined}
                value={currentPage}
                onChange={e => handleCurrentPageChange(e.target.value)}
                className={numberInputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#534340]">Total pages</label>
              <input
                type="number"
                min="0"
                value={totalPages}
                onChange={e => handleTotalPagesChange(e.target.value)}
                className={numberInputCls}
              />
            </div>

            {totalPages > 0 && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#534340]">
                  <span>{clampedCurrentPage} / {totalPages} pages</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#FFDAD4]">
                  <div
                    className="h-full rounded-full bg-[#E63B2E] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#A9372C]"
            >
              Save progress
            </button>
          </div>
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
  const safeThumbnail = window.safeImageUrl?.(item.thumbnail, PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;

  const isWatchingTvShow = item.category === 'tvshows' && item.status === 'watching';
  const isBook = item.category === 'books';
  const pageLabel = item.category === 'books' && item.totalPages ? `${item.totalPages} pages` : null;
  const progress = item.progress;

  const progressLabel = (() => {
    if (isBook && !progress) return 'Set progress...';
    if (!progress) return null;
    if (isBook && Number.isFinite(Number(progress.currentPage))) {
      const currentPage = Math.max(0, Math.floor(Number(progress.currentPage) || 0));
      const totalPages = Math.max(0, Math.floor(Number(progress.totalPages || item.totalPages || 0) || 0));
      return totalPages ? `${Math.min(currentPage, totalPages)} / ${totalPages} pages` : `Page ${currentPage}`;
    }
    if (progress.currentSeason) return `S${progress.currentSeason} E${progress.currentEpisode}`;
    if (progress.currentEpisode) return `Ep ${progress.currentEpisode}`;
    return null;
  })();

  const bookProgressPercent = (() => {
    if (!isBook) return null;
    const totalPages = Math.max(0, Math.floor(Number(progress?.totalPages || item.totalPages || 0) || 0));
    if (!totalPages) return null;
    const currentPage = Math.min(Math.max(0, Math.floor(Number(progress?.currentPage || 0) || 0)), totalPages);
    return Math.round((currentPage / totalPages) * 100);
  })();

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#410001]/10">
        <div className="aspect-[2/3] overflow-hidden bg-[#FFDAD4]">
          <img
            src={safeThumbnail}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        <div className="space-y-1.5 p-2 sm:p-3">
          <h3 className="line-clamp-2 text-xs font-bold leading-tight text-[#410001] sm:text-sm">
            {item.title}
          </h3>
          {item.author && (
            <p className="text-[11px] font-medium text-[#534340]">{item.author}</p>
          )}
          {pageLabel && (
            <p className="text-[11px] font-semibold text-[#8C4F45]">{pageLabel}</p>
          )}

          <div className="flex items-start justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] font-medium text-[#534340]">
              <span className="flex items-center gap-0.5">⭐ {item.rating}</span>
              <span>·</span>
              <span>{item.year}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
                aria-label="Options"
              >
                <ThreeDots size={14} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute bottom-full right-0 z-20 mb-2 w-44 overflow-hidden rounded-lg border border-[#E1D8D4] bg-white py-1 shadow-xl shadow-[#410001]/15">
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          onStatusChange(item.id, status);
                          setShowMenu(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-[#410001] transition hover:bg-[#FFF8F5]"
                      >
                        {formatStatusLabel(status)}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        onStatusChange(item.id, 'remove');
                        setShowMenu(false);
                      }}
                      className="block w-full border-t border-[#E1D8D4] px-3 py-2 text-left text-sm font-semibold text-[#C1121F] transition hover:bg-[#FFDAD4]"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {bookProgressPercent !== null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-[#FFDAD4]">
              <div
                className="h-full rounded-full bg-[#E63B2E]"
                style={{ width: `${bookProgressPercent}%` }}
              />
            </div>
          )}

          {(isWatchingTvShow || isBook) && (
            <button
              onClick={() => setShowProgressModal(true)}
              className="mt-1 flex w-full items-center justify-between gap-1 rounded-lg border border-[#FFB4A9] bg-[#FFF8F5] px-2 py-1.5 transition hover:bg-[#FFDAD4]"
            >
              <span className="truncate text-[11px] font-bold text-[#E63B2E]">
                {progressLabel || 'Set progress…'}
              </span>
              <span className="shrink-0 text-[10px] text-[#A9372C] opacity-70">✎</span>
            </button>
          )}
        </div>
      </div>

      {showProgressModal && isWatchingTvShow && (
        <TvProgressModal
          item={item}
          onClose={() => setShowProgressModal(false)}
          onSave={(progress) => onProgressChange && onProgressChange(item.id, progress)}
        />
      )}
      {showProgressModal && isBook && (
        <BookProgressModal
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

const ResultCard = ({ item, category, onAdd }) => {
  const pageLabel = category === 'books' && item.totalPages ? `${item.totalPages} pages` : null;
  const safeThumbnail = window.safeImageUrl?.(item.thumbnail, PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;

  return (
  <div
    className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#410001]/10"
    onClick={() => onAdd({ ...item, category })}
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
      {pageLabel && (
        <p className="mt-0.5 text-[11px] font-semibold text-white/80">{pageLabel}</p>
      )}
      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/85 sm:gap-2">
        <span className="flex items-center gap-0.5">⭐ {item.rating}</span>
        <span>·</span>
        <span>{item.year}</span>
      </div>
    </div>
  </div>
  );
};

Object.assign(window, { MediaCard, ResultCard });
