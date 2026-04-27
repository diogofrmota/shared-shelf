const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// TRIPS VIEW COMPONENT
// ============================================================================

const TRIP_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/FFDAD4/E63B2E?text=Trip';

const TripCard = ({ trip, onDelete, onEdit }) => (
  <div className="group overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#410001]/10">
    <div className="relative h-40 overflow-hidden bg-[#FFDAD4] sm:h-44">
      <img
        src={trip.photo || TRIP_PHOTO_PLACEHOLDER}
        alt={trip.destination}
        onError={(e) => { e.currentTarget.src = TRIP_PHOTO_PLACEHOLDER; }}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      {trip.year && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-[#410001] shadow-sm backdrop-blur-sm">
          {trip.year}
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
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={() => onEdit(trip)}
              className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              aria-label="Edit trip"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          )}
          <button
            onClick={() => onDelete(trip.id)}
            className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
            aria-label="Delete trip"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>
      {trip.accommodation && (
        <a
          href={trip.accommodation}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]"
        >
          <LinkIcon size={13} />
          Accommodation
        </a>
      )}
    </div>
  </div>
);

const TripsView = ({ trips, onDeleteTrip, onEditTrip }) => {
  const currentYear = new Date().getFullYear();
  const sorted = [...trips].sort((a, b) => (a.year || 0) - (b.year || 0));
  const upcoming = sorted.filter(t => t.tripType ? t.tripType === 'next' : (t.year || currentYear) >= currentYear);
  const past = sorted.filter(t => t.tripType ? t.tripType === 'past' : (t.year || currentYear) < currentYear).reverse();

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
            {upcoming.map(trip => <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} onEdit={onEditTrip} />)}
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
            {past.map(trip => <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} onEdit={onEditTrip} />)}
          </div>
        )}
      </section>
    </div>
  );
};

// ============================================================================
// EDIT TRIP MODAL (kept simple – AddModal also has one)
// ============================================================================

const EditTripModal = ({ isOpen, onClose, trip, onSave }) => {
  const [formData, setFormData] = useState(trip || {});

  useEffect(() => {
    if (trip) setFormData(trip);
  }, [trip]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData });
    onClose();
  };

  if (!isOpen) return null;

  const fieldCls = "w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="flex items-center justify-between border-b border-[#E1D8D4] p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit trip</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
            <Close size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Trip type</label>
            <div className="flex gap-2">
              {['past', 'next'].map(type => (
                <button key={type} type="button"
                  onClick={() => setFormData({ ...formData, tripType: type })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                    (formData.tripType || 'next') === type
                      ? 'border-[#E63B2E] bg-[#E63B2E] text-white'
                      : 'border-[#E1D8D4] bg-white text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001]'
                  }`}>
                  {type === 'past' ? 'Past trip' : 'Next trip'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Destination *</label>
            <input type="text" value={formData.destination || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Year</label>
            <input type="number" min="1900" max="2100" value={formData.year || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || formData.year })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Photo URL</label>
            <input type="text" value={formData.photo || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Accommodation URL</label>
            <input type="url" value={formData.accommodation || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#A9372C]">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

Object.assign(window, { TripsView, EditTripModal });
