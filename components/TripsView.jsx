const React = window.React;
const { useState, useMemo } = React;

const getTripsComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

// ============================================================================
// TRIPS VIEW COMPONENT
// ============================================================================

const formatTripDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

const formatRange = (start, end) => {
  if (!start && !end) return 'No dates yet';
  if (start && end && start !== end) return `${formatTripDate(start)} → ${formatTripDate(end)}`;
  return formatTripDate(start || end);
};

const inputCls = 'min-h-[40px] w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm text-[#000000] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]';

const SectionHeading = ({ title, count }) => (
  <div className="flex items-center gap-2">
    <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#A9372C]">{title}</h4>
    {typeof count === 'number' && count > 0 && (
      <span className="rounded-full bg-[#FFDAD4] px-2 py-0.5 text-[10px] font-bold text-[#A9372C]">{count}</span>
    )}
  </div>
);

const ChecklistEditor = ({ items = [], onChange, placeholder, withCheckbox = false }) => {
  const [draft, setDraft] = useState('');
  const Trash = getTripsComponent('Trash');

  const uid = () => `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleAdd = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...(items || []), { id: uid(), title: value, notes: '', completed: false }]);
    setDraft('');
  };

  const handleRemove = (id) => {
    onChange((items || []).filter(item => item.id !== id));
  };

  const handleToggle = (id) => {
    onChange((items || []).map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {(items || []).map(item => (
          <li key={item.id} className="flex items-center gap-2 rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5">
            {withCheckbox && (
              <input
                type="checkbox"
                checked={Boolean(item.completed)}
                onChange={() => handleToggle(item.id)}
                className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
                aria-label={`Toggle ${item.title}`}
              />
            )}
            <span className={`flex-1 truncate text-sm text-[#000000] ${withCheckbox && item.completed ? 'line-through opacity-60' : ''}`}>{item.title}</span>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
              aria-label={`Remove ${item.title}`}
            >
              <Trash size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-[40px] shrink-0 rounded-lg bg-[#E63B2E] px-3 text-sm font-bold text-white transition hover:bg-[#CC302F]"
        >
          Add
        </button>
      </div>
    </div>
  );
};

const ItineraryEditor = ({ items = [], onChange }) => {
  const Trash = getTripsComponent('Trash');
  const uid = () => `day-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleAdd = () => {
    const nextDay = (items?.length || 0) + 1;
    onChange([...(items || []), { id: uid(), day: nextDay, date: '', title: '', notes: '' }]);
  };

  const handleUpdate = (id, patch) => {
    onChange((items || []).map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const handleRemove = (id) => {
    const remaining = (items || []).filter(item => item.id !== id);
    const renumbered = remaining.map((item, idx) => ({ ...item, day: idx + 1 }));
    onChange(renumbered);
  };

  return (
    <div className="space-y-2">
      {(items || []).map(item => (
        <div key={item.id} className="rounded-lg border border-[#E1D8D4] bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#A9372C]">Day {item.day}</p>
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
              aria-label="Remove day"
            >
              <Trash size={14} />
            </button>
          </div>
          <input
            type="text"
            value={item.title || ''}
            onChange={(e) => handleUpdate(item.id, { title: e.target.value })}
            placeholder="Headline (e.g. Arrival, Old town)"
            className={`${inputCls} mt-2`}
          />
          <input
            type="date"
            value={item.date || ''}
            onChange={(e) => handleUpdate(item.id, { date: e.target.value })}
            className={`${inputCls} mt-2`}
          />
          <textarea
            value={item.notes || ''}
            onChange={(e) => handleUpdate(item.id, { notes: e.target.value })}
            placeholder="Plans, reservations, transport..."
            rows="2"
            className={`${inputCls} mt-2 min-h-[60px]`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="min-h-[40px] w-full rounded-lg border border-dashed border-[#E1D8D4] bg-white px-3 text-sm font-bold text-[#A9372C] transition hover:bg-[#FFF8F5]"
      >
        + Add day
      </button>
    </div>
  );
};

const TripCard = ({ trip, expanded, onToggleExpanded, onDelete, onUpdateTrip }) => {
  const Trash = getTripsComponent('Trash');
  const Plane = getTripsComponent('Plane');
  const ChevronRight = getTripsComponent('ChevronRight');

  const updateField = (patch) => onUpdateTrip(trip.id, patch);

  const dateRange = formatRange(trip.startDate, trip.endDate);
  return (
    <article className="rounded-2xl border border-[#E1D8D4] bg-white shadow-sm transition hover:border-[#FFB4A9]">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFDAD4] text-[#A9372C]">
          <Plane size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold text-[#000000]" title={trip.destination}>{trip.destination || 'Untitled trip'}</h3>
          <p className="mt-0.5 text-sm font-medium text-[#534340]">{dateRange}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#534340]">
            {trip.hotel && <span className="rounded-full bg-[#FFF8F5] px-2 py-0.5">🏨 {trip.hotel}</span>}
            {trip.itinerary?.length > 0 && <span className="rounded-full bg-[#FFF8F5] px-2 py-0.5">{trip.itinerary.length} day{trip.itinerary.length === 1 ? '' : 's'}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
            aria-label="Delete trip"
          >
            <Trash size={16} />
          </button>
          <span className="flex h-11 w-11 items-center justify-center text-[#000000]">
            <ChevronRight size={18} className={`transition ${expanded ? 'rotate-90' : ''}`} />
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#E1D8D4] bg-[#FFF8F5] p-4 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-[#000000]">Destination</span>
              <input
                type="text"
                value={trip.destination || ''}
                onChange={(e) => updateField({ destination: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Lisbon, Portugal"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wide text-[#000000]">Start</span>
                <input
                  type="date"
                  value={trip.startDate || ''}
                  onChange={(e) => updateField({ startDate: e.target.value })}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wide text-[#000000]">End</span>
                <input
                  type="date"
                  value={trip.endDate || ''}
                  onChange={(e) => updateField({ endDate: e.target.value })}
                  className={`${inputCls} mt-1`}
                />
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-[#000000]">Accommodation</span>
              <input
                type="text"
                value={trip.hotel || ''}
                onChange={(e) => updateField({ hotel: e.target.value })}
                className={`${inputCls} mt-1`}
                placeholder="Accommodation name & address"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wide text-[#000000]">Flights</span>
            <textarea
              value={trip.flights || ''}
              onChange={(e) => updateField({ flights: e.target.value })}
              rows="2"
              className={`${inputCls} mt-1 min-h-[60px]`}
              placeholder="Outbound + return flights, confirmation numbers..."
            />
          </label>

          <div>
            <SectionHeading title="Itinerary by day" count={trip.itinerary?.length} />
            <div className="mt-2">
              <ItineraryEditor items={trip.itinerary || []} onChange={(itinerary) => updateField({ itinerary })} />
            </div>
          </div>

          <div>
            <SectionHeading title="Places to visit" count={trip.placesToVisit?.length} />
            <div className="mt-2">
              <ChecklistEditor
                items={trip.placesToVisit || []}
                onChange={(placesToVisit) => updateField({ placesToVisit })}
                placeholder="Add a place..."
                withCheckbox
              />
            </div>
          </div>

          <div>
            <SectionHeading title="Restaurants" count={trip.restaurants?.length} />
            <div className="mt-2">
              <ChecklistEditor
                items={trip.restaurants || []}
                onChange={(restaurants) => updateField({ restaurants })}
                placeholder="Add a restaurant..."
                withCheckbox
              />
            </div>
          </div>

          <label className="block">
            <span className="block text-xs font-bold uppercase tracking-wide text-[#000000]">Shared notes</span>
            <textarea
              value={trip.notes || ''}
              onChange={(e) => updateField({ notes: e.target.value })}
              rows="3"
              className={`${inputCls} mt-1 min-h-[80px]`}
              placeholder="Anything to remember together..."
            />
          </label>
        </div>
      )}
    </article>
  );
};

const TripsView = ({ trips, onDeleteTrip, onUpdateTrip, onAddClick }) => {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = useMemo(() => {
    return [...(trips || [])].sort((a, b) => {
      const aDate = a.startDate || '9999-12-31';
      const bDate = b.startDate || '9999-12-31';
      return aDate.localeCompare(bDate);
    });
  }, [trips]);

  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;
  const Plane = getTripsComponent('Plane');
  const Plus = getTripsComponent('Plus');

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Trips Manager</h2>
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
          >
            <Plus size={16} />
            Add trip
          </button>
        </div>
        <p className="mt-1 text-sm text-[#000000]">Plan trips together, setup destinations, flights, accommodation and itineraries.</p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No trips yet"
          message="Plan your next escape together — destination, dates, accommodation and lists."
          icon={Plane}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              expanded={expandedId === trip.id}
              onToggleExpanded={() => setExpandedId(prev => prev === trip.id ? null : trip.id)}
              onDelete={onDeleteTrip}
              onUpdateTrip={onUpdateTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { TripsView });
