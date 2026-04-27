const React = window.React;
const { useState } = React;

// ============================================================================
// TRIPS VIEW COMPONENT
// ============================================================================

const TRIP_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/FFDAD4/E63B2E?text=Trip';

const formatTripDate = (date) => {
  if (!date) return '';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTripDateRange = (trip = {}) => {
  const start = formatTripDate(trip.startDate);
  const end = formatTripDate(trip.endDate);
  if (start && end && start !== end) return `${start} - ${end}`;
  if (start) return start;
  if (trip.year) return String(trip.year);
  return '';
};

const getTripSortValue = (trip = {}) => {
  const dateValue = trip.startDate || trip.endDate;
  if (dateValue) {
    const timestamp = new Date(`${dateValue}T00:00:00`).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }
  return new Date(Number(trip.year) || new Date().getFullYear(), 0, 1).getTime();
};

const isPastTrip = (trip = {}, today = new Date()) => {
  const endDate = trip.endDate || trip.startDate;
  if (endDate) {
    const end = new Date(`${endDate}T23:59:59`);
    if (!Number.isNaN(end.getTime())) return end < today;
  }
  if (trip.tripType) return trip.tripType === 'past';
  return (Number(trip.year) || today.getFullYear()) < today.getFullYear();
};

const getTripMetrics = (trip = {}) => ({
  itinerary: Array.isArray(trip.itinerary) ? trip.itinerary.length : 0,
  bookings: Array.isArray(trip.bookings) ? trip.bookings.length : 0,
  packed: Array.isArray(trip.packingList) ? trip.packingList.filter(item => item.packed).length : 0,
  packing: Array.isArray(trip.packingList) ? trip.packingList.length : 0
});

const TripSummaryPill = ({ children }) => (
  <span className="rounded-full bg-[#FFF8F5] px-2.5 py-1 text-xs font-bold text-[#534340]">
    {children}
  </span>
);

const TripCard = ({ trip, onDelete, onEdit, onOpen }) => {
  const metrics = getTripMetrics(trip);
  const dateRange = getTripDateRange(trip);
  const safePhoto = window.safeImageUrl?.(trip.photo, TRIP_PHOTO_PLACEHOLDER) || TRIP_PHOTO_PLACEHOLDER;
  const safeAccommodation = window.safeExternalUrl?.(trip.accommodation) || '';

  return (
    <div
      role="button"
      tabIndex="0"
      onClick={() => onOpen(trip)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(trip);
        }
      }}
      className="group overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#410001]/10 focus:outline-none focus:ring-2 focus:ring-[#E63B2E]"
    >
      <div className="relative h-40 overflow-hidden bg-[#FFDAD4] sm:h-44">
        <img
          src={safePhoto}
          alt={trip.destination}
          onError={(e) => { e.currentTarget.src = TRIP_PHOTO_PLACEHOLDER; }}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {dateRange && (
          <span className="absolute right-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-[#410001] shadow-sm backdrop-blur-sm">
            <span className="truncate">{dateRange}</span>
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="flex items-center gap-2 truncate text-base font-bold text-[#410001] sm:text-lg">
              <MapPin size={16} className="shrink-0 text-[#E63B2E]" />
              {trip.destination}
            </h4>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(trip); }}
                className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
                aria-label="Edit trip"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
              className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
              aria-label="Delete trip"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {metrics.itinerary > 0 && <TripSummaryPill>{metrics.itinerary} itinerary</TripSummaryPill>}
          {metrics.bookings > 0 && <TripSummaryPill>{metrics.bookings} bookings</TripSummaryPill>}
          {metrics.packing > 0 && <TripSummaryPill>{metrics.packed}/{metrics.packing} packed</TripSummaryPill>}
        </div>

        {safeAccommodation && (
          <a
            href={safeAccommodation}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]"
          >
            <LinkIcon size={13} />
            Accommodation
          </a>
        )}
      </div>
    </div>
  );
};

const TripDetailSection = ({ title, children }) => (
  <section className="rounded-xl border border-[#E1D8D4] bg-white p-4">
    <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[#410001]">{title}</h3>
    {children}
  </section>
);

const TripDetailModal = ({ trip, onClose, onEdit }) => {
  if (!trip) return null;
  const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const bookings = Array.isArray(trip.bookings) ? trip.bookings : [];
  const packingList = Array.isArray(trip.packingList) ? trip.packingList : [];
  const dateRange = getTripDateRange(trip);
  const safePhoto = window.safeImageUrl?.(trip.photo, TRIP_PHOTO_PLACEHOLDER) || TRIP_PHOTO_PLACEHOLDER;
  const safeAccommodation = window.safeExternalUrl?.(trip.accommodation) || '';

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] shadow-2xl shadow-[#410001]/30">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E1D8D4] bg-white p-5">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-[#410001]">{trip.destination}</h2>
            {dateRange && <p className="mt-1 text-sm font-semibold text-[#857370]">{dateRange}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => { onClose(); onEdit(trip); }}
              className="rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            >
              Edit
            </button>
            <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close trip details">
              <Close size={22} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="h-44 overflow-hidden rounded-xl bg-[#FFDAD4] sm:h-56">
            <img
              src={safePhoto}
              alt={trip.destination}
              onError={(e) => { e.currentTarget.src = TRIP_PHOTO_PLACEHOLDER; }}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TripDetailSection title="Itinerary">
              {itinerary.length ? (
                <div className="space-y-3">
                  {itinerary.map(item => (
                    <div key={item.id} className="border-b border-[#F0E4E0] pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-bold text-[#410001]">{item.title || 'Untitled plan'}</p>
                      {(item.date || item.time) && <p className="mt-0.5 text-xs font-semibold text-[#857370]">{[formatTripDate(item.date), item.time].filter(Boolean).join(' at ')}</p>}
                      {item.notes && <p className="mt-1 text-sm text-[#534340]">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#857370]">No itinerary items yet.</p>
              )}
            </TripDetailSection>

            <TripDetailSection title="Bookings">
              {bookings.length || safeAccommodation ? (
                <div className="space-y-3">
                  {safeAccommodation && (
                    <a href={safeAccommodation} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E63B2E] transition hover:text-[#A9372C]">
                      <LinkIcon size={14} />
                      Accommodation
                    </a>
                  )}
                  {bookings.map(item => (
                    <div key={item.id} className="border-b border-[#F0E4E0] pb-3 last:border-0 last:pb-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#857370]">{item.type || 'Booking'}</p>
                      <p className="text-sm font-bold text-[#410001]">{item.title || 'Untitled booking'}</p>
                      {window.safeExternalUrl?.(item.link) && (
                        <a href={window.safeExternalUrl(item.link)} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#E63B2E] transition hover:text-[#A9372C]">
                          <LinkIcon size={14} />
                          Open link
                        </a>
                      )}
                      {item.notes && <p className="mt-1 text-sm text-[#534340]">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#857370]">No bookings yet.</p>
              )}
            </TripDetailSection>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TripDetailSection title="Notes">
              {trip.notes ? <p className="whitespace-pre-wrap text-sm text-[#534340]">{trip.notes}</p> : <p className="text-sm text-[#857370]">No notes yet.</p>}
            </TripDetailSection>

            <TripDetailSection title="Packing">
              {packingList.length ? (
                <ul className="space-y-2">
                  {packingList.map(item => (
                    <li key={item.id} className="flex items-center gap-2 text-sm text-[#534340]">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none ${item.packed ? 'border-[#E63B2E] bg-[#E63B2E] text-white' : 'border-[#D8C2BE] bg-white'}`}>
                        {item.packed ? 'x' : ''}
                      </span>
                      <span className={item.packed ? 'line-through decoration-[#E63B2E]/60' : ''}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#857370]">No packing items yet.</p>
              )}
            </TripDetailSection>
          </div>
        </div>
      </div>
    </div>
  );
};

const TripsView = ({ trips, onDeleteTrip, onEditTrip }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const today = new Date();
  const sorted = [...trips].sort((a, b) => getTripSortValue(a) - getTripSortValue(b));
  const upcoming = sorted.filter(t => !isPastTrip(t, today));
  const past = sorted.filter(t => isPastTrip(t, today)).reverse();

  return (
    <div className="space-y-10 animate-fade-in">
      <section>
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-[#410001] sm:text-3xl">Next trips</h2>
            <p className="mt-1 text-sm text-[#534340]">Upcoming adventures to look forward to.</p>
          </div>
        </header>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#534340]">
            No upcoming trips yet. Start planning your next adventure.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(trip => (
              <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} onEdit={onEditTrip} onOpen={setSelectedTrip} />
            ))}
          </div>
        )}
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-2xl font-extrabold text-[#410001] sm:text-3xl">Past trips</h2>
          <p className="mt-1 text-sm text-[#534340]">Memories and archived itineraries.</p>
        </header>
        {past.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#534340]">
            No past trips yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {past.map(trip => (
              <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} onEdit={onEditTrip} onOpen={setSelectedTrip} />
            ))}
          </div>
        )}
      </section>

      <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} onEdit={onEditTrip} />
    </div>
  );
};

Object.assign(window, { TripsView });
