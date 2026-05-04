const React = window.React;
const { useState, useEffect } = React;
const getMediaComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;
const getMediaModalShell = () => window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;

// ============================================================================
// MEDIA DETAIL MODAL
// ============================================================================

const MediaDetailModal = ({ item, onClose, onStatusChange, onProgressChange, watchModeLabel }) => {
  const statusOptions = window.getStatusOptions?.(item.category) || [];
  const placeholder = window.PLACEHOLDER_IMAGE || '';
  const safeThumbnail = window.safeImageUrl?.(item.thumbnail, placeholder) || placeholder;
  const ModalShell = getMediaModalShell();
  const CloseIcon = getMediaComponent('Close');

  const isTvShow = item.category === 'tvshows';
  const isBook = item.category === 'books';
  const itemId = String(item?.id ?? '');
  const isTmdb = itemId.startsWith('tmdb-');
  const isAnime = itemId.startsWith('mal-');
  const progress = item.progress;

  const [loadingProgress, setLoadingProgress] = useState(isTvShow);
  const [seasons, setSeasons] = useState(null);
  const [totalEpisodes, setTotalEpisodes] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(progress?.currentSeason || 1);
  const [currentEpisode, setCurrentEpisode] = useState(progress?.currentEpisode || 1);
  const initialTotalPages = Math.max(0, Math.floor(Number(progress?.totalPages ?? item.totalPages ?? 0) || 0));
  const [currentPage, setCurrentPage] = useState(Math.min(
    Math.max(0, Math.floor(Number(progress?.currentPage ?? 0) || 0)),
    initialTotalPages || Number.MAX_SAFE_INTEGER
  ));
  const [totalPages, setTotalPages] = useState(initialTotalPages);

  useEffect(() => {
    if (!isTvShow) return undefined;
    let active = true;
    const load = async () => {
      setLoadingProgress(true);
      if (isTmdb) {
        const details = await window.fetchTvDetails?.(itemId.replace('tmdb-', ''));
        if (!active) return;
        if (details?.seasons?.length) {
          setSeasons(details.seasons);
          setCurrentSeason(progress?.currentSeason || 1);
          setCurrentEpisode(progress?.currentEpisode || 1);
        }
      } else if (isAnime) {
        const details = await window.fetchAnimeDetails?.(itemId.replace('mal-', ''));
        if (!active) return;
        setTotalEpisodes(details?.episodes || null);
        setCurrentEpisode(progress?.currentEpisode || 1);
      }
      if (active) setLoadingProgress(false);
    };
    load();
    return () => { active = false; };
  }, [itemId]);

  const progressLabel = (() => {
    if (!progress) return '';
    if (isBook && Number.isFinite(Number(progress.currentPage))) {
      const page = Math.max(0, Math.floor(Number(progress.currentPage) || 0));
      const total = Math.max(0, Math.floor(Number(progress.totalPages || item.totalPages || 0) || 0));
      return total ? `${Math.min(page, total)} / ${total} pages` : `Page ${page}`;
    }
    if (progress.currentSeason) return `S${progress.currentSeason} E${progress.currentEpisode}`;
    if (progress.currentEpisode) return `Ep ${progress.currentEpisode}`;
    return '';
  })();

  const episodeCount = isTmdb && seasons
    ? (seasons.find(season => season.season_number === currentSeason)?.episode_count || null)
    : totalEpisodes;
  const normalizedCurrentPage = totalPages ? Math.min(currentPage, totalPages) : currentPage;
  const bookProgressPercent = isBook && totalPages ? Math.round((normalizedCurrentPage / totalPages) * 100) : null;
  const fieldCls = "min-h-[44px] w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2.5 text-sm text-[#000000] outline-none transition focus:border-[#E63B2E]";

  const saveTvProgress = () => {
    const nextProgress = isTmdb
      ? { currentSeason, currentEpisode, seasons }
      : { currentEpisode, totalEpisodes };
    onProgressChange?.(item.id, nextProgress);
  };

  const saveBookProgress = () => {
    onProgressChange?.(item.id, {
      currentPage: totalPages ? Math.min(currentPage, totalPages) : currentPage,
      totalPages: totalPages || null
    });
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      ariaLabel={`Details for ${item.title}`}
      dialogClassName="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#000000]/30"
    >
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-[#E1D8D4] p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Details</p>
            <h3 className="truncate text-lg font-extrabold text-[#000000]" title={item.title}>{item.title}</h3>
          </div>
          <button onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close details">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-4 sm:grid-cols-[11rem_1fr] sm:p-5">
          <div className="mx-auto w-36 overflow-hidden rounded-xl border border-[#E1D8D4] bg-[#FFDAD4] sm:mx-0 sm:w-full">
            <img
              src={safeThumbnail}
              alt={item.title}
              onError={(e) => { if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder; }}
              className="aspect-[2/3] h-full w-full object-cover"
            />
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <h4 className="text-xl font-extrabold text-[#000000]">{item.title}</h4>
              {item.author && <p className="text-sm font-semibold text-[#534340]">{item.author}</p>}
              <div className="flex flex-wrap gap-2 text-xs font-bold text-[#8C4F45]">
                {item.year && <span className="rounded-full bg-[#FFF8F5] px-2.5 py-1">{item.year}</span>}
                {item.rating && <span className="rounded-full bg-[#FFF8F5] px-2.5 py-1">Rating {item.rating}</span>}
                {item.totalPages && <span className="rounded-full bg-[#FFF8F5] px-2.5 py-1">{item.totalPages} pages</span>}
                {watchModeLabel && <span className="rounded-full bg-[#FFF8F5] px-2.5 py-1">{watchModeLabel}</span>}
                {progressLabel && <span className="rounded-full bg-[#FFF8F5] px-2.5 py-1">{progressLabel}</span>}
              </div>
            </div>

            <section>
              <h5 className="mb-2 text-sm font-extrabold text-[#000000]">Status</h5>
              <div className="grid gap-2 sm:grid-cols-3">
                {statusOptions.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange?.(item.id, status)}
                    className={`min-h-[44px] rounded-lg border px-3 text-sm font-bold transition ${item.status === status ? 'border-[#E63B2E] bg-[#FFDAD4] text-[#E63B2E]' : 'border-[#E1D8D4] text-[#000000] hover:bg-[#FFF8F5]'}`}
                  >
                    {window.formatStatusLabel?.(status) || status}
                  </button>
                ))}
              </div>
            </section>

            {isTvShow && (
              <section className="space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                <h5 className="text-sm font-extrabold text-[#000000]">Progress</h5>
                {loadingProgress ? (
                  <div className="py-3 text-sm font-semibold text-[#534340]">Loading show info...</div>
                ) : (
                  <>
                    {isTmdb && seasons && seasons.length > 0 && (
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#000000]">Season</label>
                        <select
                          value={currentSeason}
                          onChange={e => {
                            const nextSeason = Number(e.target.value);
                            setCurrentSeason(nextSeason);
                            setCurrentEpisode(1);
                          }}
                          className={fieldCls}
                        >
                          {seasons.map(season => (
                            <option key={season.season_number} value={season.season_number}>
                              Season {season.season_number} ({season.episode_count} ep)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#000000]">Episode</label>
                      {episodeCount ? (
                        <select value={currentEpisode} onChange={e => setCurrentEpisode(Number(e.target.value))} className={fieldCls}>
                          {Array.from({ length: episodeCount }, (_, index) => index + 1).map(episode => (
                            <option key={episode} value={episode}>Episode {episode}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="number" min="1" value={currentEpisode} onChange={e => setCurrentEpisode(Math.max(1, Number(e.target.value) || 1))} className={fieldCls} />
                      )}
                    </div>
                    <button type="button" onClick={saveTvProgress} className="min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#CC302F]">
                      Save progress
                    </button>
                  </>
                )}
              </section>
            )}

            {isBook && (
              <section className="space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                <h5 className="text-sm font-extrabold text-[#000000]">Progress</h5>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#000000]">Current page</label>
                  <input type="number" min="0" max={totalPages || undefined} value={currentPage} onChange={e => setCurrentPage(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className={fieldCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#000000]">Total pages</label>
                  <input type="number" min="0" value={totalPages} onChange={e => {
                    const nextTotal = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setTotalPages(nextTotal);
                    setCurrentPage(page => nextTotal ? Math.min(page, nextTotal) : page);
                  }} className={fieldCls} />
                </div>
                {bookProgressPercent !== null && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#000000]">
                      <span>{normalizedCurrentPage} / {totalPages} pages</span>
                      <span>{bookProgressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#FFDAD4]">
                      <div className="h-full rounded-full bg-[#E63B2E] transition-all" style={{ width: `${bookProgressPercent}%` }} />
                    </div>
                  </div>
                )}
                <button type="button" onClick={saveBookProgress} className="min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#CC302F]">
                  Save progress
                </button>
              </section>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onStatusChange?.(item.id, 'remove');
              }}
              className="min-h-[44px] w-full rounded-xl border border-[#FFDAD4] bg-white px-3 text-sm font-bold text-[#C1121F] transition hover:bg-[#FFDAD4]"
            >
              Delete item
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

// ============================================================================
// MEDIA CARD COMPONENT
// ============================================================================

const MediaCard = ({ item, onStatusChange, onProgressChange, watchModeLabel }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const placeholder = window.PLACEHOLDER_IMAGE || '';
  const safeThumbnail = window.safeImageUrl?.(item.thumbnail, placeholder) || placeholder;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDetailModal(true)}
        className="group aspect-[2/3] overflow-hidden rounded-lg border border-[#E1D8D4] bg-[#FFDAD4] shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:shadow-md hover:shadow-[#000000]/10 focus:outline-none focus:ring-4 focus:ring-[#FFB4A9]/40"
        aria-label={`Open details for ${item.title}`}
      >
        <img
          src={safeThumbnail}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onError={(e) => { if (e.currentTarget.src !== placeholder) e.currentTarget.src = placeholder; }}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </button>

      {showDetailModal && (
        <MediaDetailModal
          item={item}
          onClose={() => setShowDetailModal(false)}
          onStatusChange={onStatusChange}
          onProgressChange={onProgressChange}
          watchModeLabel={watchModeLabel}
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
  const placeholder = window.PLACEHOLDER_IMAGE || '';
  const safeThumbnail = window.safeImageUrl?.(item.thumbnail, placeholder) || placeholder;

  return (
  <div
    className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#000000]/10"
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
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(65,0,1,0.9)] via-[rgba(65,0,1,0.5)] to-transparent p-2 opacity-100 transition duration-300 sm:p-3 sm:opacity-0 sm:group-hover:opacity-100">
      <h3 className="line-clamp-2 text-xs font-bold leading-tight text-white sm:text-sm" title={item.title}>
        {item.title}
      </h3>
      {item.author && <p className="mt-0.5 truncate text-[11px] font-medium text-white/80" title={item.author}>{item.author}</p>}
      {pageLabel && (
        <p className="mt-0.5 text-[11px] font-semibold text-white/80">{pageLabel}</p>
      )}
      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/85 sm:gap-2">
        <span>Rating {item.rating}</span>
        <span>/</span>
        <span>{item.year}</span>
      </div>
    </div>
  </div>
  );
};

Object.assign(window, { MediaCard, ResultCard });
