const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// TRIPS VIEW COMPONENT
// ============================================================================

const TRIP_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/1a1a2e/8b5cf6?text=Trip';

const TripCard = ({ trip, onDelete, onEdit }) => (
  <div className="flex gap-4 group">
    <div className="flex flex-col items-center pt-2">
      <div className="w-4 h-4 rounded-full bg-purple-500 border-4 border-slate-900 shadow-md shadow-purple-500/40"></div>
      <div className="flex-1 w-px bg-slate-700/80 mt-1 min-h-[2rem]"></div>
    </div>

    <div className="flex-1 bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden mb-6 hover:border-purple-500/50 transition-colors flex">
      <div className="w-1/5 bg-slate-900 overflow-hidden shrink-0">
        <img
          src={trip.photo || TRIP_PHOTO_PLACEHOLDER}
          alt={trip.destination}
          onError={(e) => { e.currentTarget.src = TRIP_PHOTO_PLACEHOLDER; }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
              <MapPin size={16} className="text-purple-400 shrink-0" />
              {trip.destination}
            </h4>
            <p className="text-sm text-slate-400 mt-0.5">{trip.year}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(trip)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Edit trip"
              >
                <span className="text-base">✎</span>
              </button>
            )}
            <button
              onClick={() => onDelete(trip.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
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
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors break-all"
          >
            <LinkIcon size={13} />
            Accommodation
          </a>
        )}
      </div>
    </div>
  </div>
);

const TripsView = ({ trips, onDeleteTrip, onEditTrip }) => {
  const currentYear = new Date().getFullYear();
  const sorted = [...trips].sort((a, b) => (a.year || 0) - (b.year || 0));
  const upcoming = sorted.filter(t => t.tripType ? t.tripType === 'next' : (t.year || currentYear) >= currentYear);
  const past = sorted.filter(t => t.tripType ? t.tripType === 'past' : (t.year || currentYear) < currentYear).reverse();

  return (
    <div>
      <section className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Next Trips</h3>
        {upcoming.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center bg-slate-900/30 border border-slate-800 rounded-xl">
            No upcoming trips yet. Add one above!
          </p>
        ) : (
          <div>{upcoming.map(trip => <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} onEdit={onEditTrip} />)}</div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-bold text-white mb-4">Past Trips</h3>
        {past.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center bg-slate-900/30 border border-slate-800 rounded-xl">
            No past trips yet.
          </p>
        ) : (
          <div>{past.map(trip => <TripCard key={trip.id} trip={trip} onDelete={onDeleteTrip} onEdit={onEditTrip} />)}</div>
        )}
      </section>
    </div>
  );
};

// ============================================================================
// EDIT TRIP MODAL
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

  const fieldCls = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Edit Trip</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
              <Close size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Trip Type</label>
              <div className="flex gap-2">
                {['past', 'next'].map(type => (
                  <button key={type} type="button"
                    onClick={() => setFormData({ ...formData, tripType: type })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${(formData.tripType || 'next') === type ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white'}`}>
                    {type === 'past' ? 'Past Trip' : 'Next Trip'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Destination <span className="text-red-400">*</span></label>
              <input type="text" value={formData.destination || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Year</label>
              <input type="number" min="1900" max="2100" value={formData.year || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || formData.year })} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Photo URL</label>
              <input type="text" value={formData.photo || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Accommodation URL</label>
              <input type="url" value={formData.accommodation || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { TripsView, EditTripModal });
