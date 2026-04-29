const React = window.React;
const { useState, useEffect } = React;

const getComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;
const getModalShell = () => window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;

// ============================================================================
// GLOBAL ADD MODAL COMPONENT
// ============================================================================

const GlobalAddModal = ({ isOpen, onClose, onSelect, enabledSections }) => {
  if (!isOpen) return null;
  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');
  const dateCategories = window.DATE_CATEGORIES || [];

  const categories = [
    { id: 'tasks',    label: 'Task',      icon: 'CheckSquare' },
    { id: 'calendar', label: 'Activity',  icon: 'CalendarIcon' },
    { id: 'locations', label: 'Location', icon: 'Utensils' },
    { id: 'trips',    label: 'Trip',      icon: 'MapPin' },
    { id: 'recipes',  label: 'Recipe',    icon: 'ChefHat' },
    { id: 'tvshows',  label: 'TV Show',   icon: 'Tv' },
    { id: 'movies',   label: 'Movie',     icon: 'Film' },
    { id: 'books',    label: 'Book',      icon: 'Book' },
  ];
  const enabledSet = new Set(Array.isArray(enabledSections) && enabledSections.length
    ? enabledSections
    : ['calendar', 'tasks', 'locations', 'trips', 'recipes', 'watchlist']);
  const visibleCategories = categories.filter(category => {
    if (['movies', 'tvshows', 'books'].includes(category.id)) return enabledSet.has('watchlist');
    return enabledSet.has(category.id);
  });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[150]"
      ariaLabel="Add item menu"
      dialogClassName="w-full max-w-sm rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
    >
        <div className="flex items-center justify-between border-b border-[#E1D8D4] p-5">
          <h2 className="text-lg font-extrabold text-[#410001]">What are you adding?</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            aria-label="Close add menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4">
          {visibleCategories.map(({ id, label, icon }) => {
            const Icon = getComponent(icon);
            return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group flex min-h-[96px] flex-col items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:bg-[#FFF8F5] hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFDAD4] text-[#E63B2E] transition group-hover:bg-[#E63B2E] group-hover:text-white">
                <Icon size={20} />
              </span>
              <span className="text-sm font-bold text-[#410001]">{label}</span>
            </button>
            );
          })}
        </div>
    </ModalShell>
  );
};

// ============================================================================
// ADD MODAL COMPONENT
// ============================================================================

const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

const FormField = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">
      {label} {required && <span className="text-[#E63B2E]">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "min-h-[44px] w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2.5 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";
const selectCls = inputCls;

const createTripItemId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const emptyItineraryItem = () => ({ id: createTripItemId('itinerary'), date: '', time: '', title: '', notes: '' });
const emptyBookingItem = () => ({ id: createTripItemId('booking'), type: 'accommodation', title: '', link: '', notes: '' });
const emptyPackingItem = () => ({ id: createTripItemId('packing'), text: '', packed: false });

const deriveTripYear = (formData = {}) => {
  const parsedYear = parseInt(formData.year, 10);
  if (parsedYear) return parsedYear;
  if (formData.startDate) {
    const parsedDate = new Date(formData.startDate);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate.getFullYear();
  }
  return new Date().getFullYear();
};

const cleanTripItinerary = (items) => (Array.isArray(items) ? items : [])
  .map(item => ({
    id: item.id || createTripItemId('itinerary'),
    date: item.date || '',
    time: item.time || '',
    title: item.title || '',
    notes: item.notes || ''
  }))
  .filter(item => item.date || item.time || item.title || item.notes);

const cleanTripBookings = (items) => (Array.isArray(items) ? items : [])
  .filter(item => item?.title || item?.link || item?.notes)
  .map(item => ({
    id: item.id || createTripItemId('booking'),
    type: item.type || 'reservation',
    title: item.title || '',
    link: item.link || '',
    notes: item.notes || ''
  }));

const cleanPackingList = (items) => (Array.isArray(items) ? items : [])
  .map(item => ({
    id: item.id || createTripItemId('packing'),
    text: item.text || '',
    packed: Boolean(item.packed)
  }))
  .filter(item => item.text);

const buildTripPayload = (formData = {}) => ({
  destination: formData.destination || '',
  year: deriveTripYear(formData),
  tripType: formData.tripType || 'next',
  startDate: formData.startDate || '',
  endDate: formData.endDate || formData.startDate || '',
  photo: formData.photo || '',
  accommodation: formData.accommodation || '',
  itinerary: cleanTripItinerary(formData.itinerary),
  bookings: cleanTripBookings(formData.bookings),
  notes: formData.notes || '',
  packingList: cleanPackingList(formData.packingList)
});

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const TASK_RECURRENCE_OPTIONS = RECURRENCE_OPTIONS.filter(option => option.value !== 'none');

const getRecurrenceFrequency = (formData = {}) => {
  const frequency = formData.recurrenceFrequency || formData.recurrence?.frequency || 'none';
  return RECURRENCE_OPTIONS.some(option => option.value === frequency) ? frequency : 'none';
};

const buildEventRecurrence = (formData = {}) => {
  const frequency = getRecurrenceFrequency(formData);
  if (frequency === 'none') return null;
  return {
    frequency,
    until: formData.recurrenceUntil || formData.recurrence?.until || ''
  };
};

const buildCalendarEventPayload = (formData = {}) => ({
  title: formData.title || '',
  date: formData.date || '',
  startDate: formData.date || '',
  endDate: formData.endDate || formData.date || '',
  time: formData.time || '',
  description: formData.description || '',
  recurrence: buildEventRecurrence(formData)
});

const getTaskRecurrenceFrequency = (formData = {}) => {
  const frequency = formData.taskRecurrenceFrequency || formData.recurrence?.frequency || 'weekly';
  return TASK_RECURRENCE_OPTIONS.some(option => option.value === frequency) ? frequency : 'weekly';
};

const buildTaskRecurrence = (formData = {}) => {
  if (!formData.isRecurring) return null;
  return { frequency: getTaskRecurrenceFrequency(formData) };
};

const CalendarRecurrenceFields = ({ formData, setFormData, editing = false }) => {
  const frequency = getRecurrenceFrequency(formData);

  return (
    <div className="space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
      <FormField label="Repeat">
        <select
          className={selectCls}
          value={frequency}
          onChange={(e) => setFormData({
            ...formData,
            recurrenceFrequency: e.target.value,
            recurrenceUntil: e.target.value === 'none' ? '' : formData.recurrenceUntil || ''
          })}
        >
          {RECURRENCE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormField>
      {frequency !== 'none' && (
        <>
          <FormField label="Repeat until">
            <input
              type="date"
              className={inputCls}
              min={formData.date || undefined}
              value={formData.recurrenceUntil || ''}
              onChange={(e) => setFormData({ ...formData, recurrenceUntil: e.target.value })}
            />
          </FormField>
          <p className="text-xs font-medium text-[#857370]">
            {editing ? 'Saving changes updates every occurrence in this series.' : 'Leave blank to keep showing this series in future months.'}
          </p>
        </>
      )}
    </div>
  );
};

const TaskRecurrenceFields = ({ formData, setFormData }) => {
  const isRecurring = Boolean(formData.isRecurring);

  return (
    <div className="space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
      <label className="flex min-h-[44px] items-center gap-2 text-sm font-bold text-[#410001]">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setFormData({
            ...formData,
            isRecurring: e.target.checked,
            taskRecurrenceFrequency: e.target.checked
              ? getTaskRecurrenceFrequency(formData)
              : 'weekly'
          })}
          className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
        />
        Recurring task
      </label>
      {isRecurring && (
        <>
          <FormField label="Repeat every">
            <select
              className={selectCls}
              value={getTaskRecurrenceFrequency(formData)}
              onChange={(e) => setFormData({ ...formData, taskRecurrenceFrequency: e.target.value })}
            >
              {TASK_RECURRENCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <p className="text-xs font-medium text-[#857370]">
            Checking a recurring task records one completed occurrence and keeps it active.
          </p>
        </>
      )}
    </div>
  );
};

const TripListSection = ({ title, actionLabel, rows, emptyRow, children, onChange }) => {
  const visibleRows = Array.isArray(rows) && rows.length ? rows : [emptyRow()];
  const updateRow = (id, patch) => onChange(visibleRows.map(row => row.id === id ? { ...row, ...patch } : row));
  const removeRow = (id) => onChange(visibleRows.length === 1 ? [] : visibleRows.filter(row => row.id !== id));

  return (
    <div className="space-y-2 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#534340]">{title}</h3>
        <button
          type="button"
          onClick={() => onChange([...visibleRows, emptyRow()])}
          className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-xs font-bold text-[#410001] transition hover:border-[#FFB4A9] hover:text-[#E63B2E]"
        >
          {actionLabel}
        </button>
      </div>
      <div className="space-y-2">
        {visibleRows.map((row, index) => (
          <div key={row.id} className="rounded-lg border border-[#E1D8D4] bg-white p-3">
            {children(row, updateRow)}
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="mt-2 min-h-[44px] rounded-lg px-2 text-xs font-bold text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
            >
              Remove {index + 1}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TripPlanningFields = ({ formData, setFormData }) => (
  <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField label="Start date">
        <input type="date" className={inputCls} value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
      </FormField>
      <FormField label="End date">
        <input type="date" className={inputCls} value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
      </FormField>
    </div>

    <TripListSection
      title="Itinerary"
      actionLabel="Add item"
      rows={formData.itinerary}
      emptyRow={emptyItineraryItem}
      onChange={(itinerary) => setFormData({ ...formData, itinerary })}
    >
      {(row, updateRow) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px]">
          <input type="date" className={inputCls} value={row.date || ''} onChange={(e) => updateRow(row.id, { date: e.target.value })} />
          <input type="time" className={inputCls} value={row.time || ''} onChange={(e) => updateRow(row.id, { time: e.target.value })} />
          <input type="text" className={`${inputCls} sm:col-span-2`} value={row.title || ''} placeholder="Plan" onChange={(e) => updateRow(row.id, { title: e.target.value })} />
          <textarea rows="2" className={`${inputCls} sm:col-span-2`} value={row.notes || ''} placeholder="Notes" onChange={(e) => updateRow(row.id, { notes: e.target.value })} />
        </div>
      )}
    </TripListSection>

    <TripListSection
      title="Bookings"
      actionLabel="Add booking"
      rows={formData.bookings}
      emptyRow={emptyBookingItem}
      onChange={(bookings) => setFormData({ ...formData, bookings })}
    >
      {(row, updateRow) => (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr]">
          <select className={selectCls} value={row.type || 'reservation'} onChange={(e) => updateRow(row.id, { type: e.target.value })}>
            <option value="accommodation">Accommodation</option>
            <option value="transport">Transport</option>
            <option value="reservation">Reservation</option>
            <option value="other">Other</option>
          </select>
          <input type="text" className={inputCls} value={row.title || ''} placeholder="Name" onChange={(e) => updateRow(row.id, { title: e.target.value })} />
          <input type="url" className={`${inputCls} sm:col-span-2`} value={row.link || ''} placeholder="Link" onChange={(e) => updateRow(row.id, { link: e.target.value })} />
          <textarea rows="2" className={`${inputCls} sm:col-span-2`} value={row.notes || ''} placeholder="Details" onChange={(e) => updateRow(row.id, { notes: e.target.value })} />
        </div>
      )}
    </TripListSection>

    <FormField label="Trip notes">
      <textarea rows="4" className={inputCls} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
    </FormField>

    <TripListSection
      title="Packing list"
      actionLabel="Add item"
      rows={formData.packingList}
      emptyRow={emptyPackingItem}
      onChange={(packingList) => setFormData({ ...formData, packingList })}
    >
      {(row, updateRow) => (
        <div className="flex min-h-[44px] items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(row.packed)}
            onChange={(e) => updateRow(row.id, { packed: e.target.checked })}
            className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
          />
          <input type="text" className={inputCls} value={row.text || ''} placeholder="Packing item" onChange={(e) => updateRow(row.id, { text: e.target.value })} />
        </div>
      )}
    </TripListSection>
  </>
);

const AddModal = ({ isOpen, onClose, activeTab, onAddMedia, onAddEvent, onAddTrip, onAddRecipe, onAddDate, onAddTask, profile }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsSaving(false);
  }, [isOpen, activeTab]);

  const getModalTitle = () => {
    const titles = {
      tasks: 'Add task', movies: 'Add movie', tvshows: 'Add TV show',
      books: 'Add book', calendar: 'Add activity', trips: 'Add trip',
      locations: 'Add location', recipes: 'Add recipe'
    };
    return titles[activeTab] || 'Add item';
  };

  const isMediaType = ['movies', 'tvshows', 'books'].includes(activeTab);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    switch (activeTab) {
      case 'tasks':
        if (formData.title) {
          onAddTask({
            id: `task-${uid()}`,
            title: formData.title,
            description: formData.description || '',
            assignedTo: formData.assignedTo || null,
            dueDate: formData.dueDate || null,
            completed: false,
            recurrence: buildTaskRecurrence(formData),
            lastCompletedAt: null,
            completionCount: 0,
            createdAt: new Date().toISOString()
          });
          onClose();
        }
        break;
      case 'calendar':
        if (formData.title && formData.date) {
          onAddEvent({ id: `event-${uid()}`, ...buildCalendarEventPayload(formData) });
          onClose();
        }
        break;
      case 'trips':
        if (formData.destination) {
          onAddTrip({ id: `trip-${uid()}`, ...buildTripPayload(formData) });
          onClose();
        }
        break;
      case 'recipes':
        if (formData.name) {
          onAddRecipe({ id: `recipe-${uid()}`, name: formData.name, photo: formData.photo || '', prepTime: formData.prepTime || '', link: formData.link || '', ingredients: formData.ingredients || '', instructions: formData.instructions || '', createdAt: new Date().toISOString() });
          onClose();
        }
        break;
      case 'locations':
        if (formData.name) {
          setIsSaving(true);
          const address = String(formData.address || '').trim();
          const geocoded = window.geocodeAddress
            ? await window.geocodeAddress(address)
            : { lat: null, lng: null, status: address ? 'failed' : 'empty', error: address ? 'Address lookup unavailable' : '' };
          onAddDate({
            id: `location-${uid()}`,
            name: formData.name,
            category: formData.category || 'restaurant',
            address,
            lat: geocoded.lat,
            lng: geocoded.lng,
            geocodingStatus: geocoded.status,
            geocodingError: geocoded.error || '',
            geocodedAddress: geocoded.displayName || '',
            geocodedAt: geocoded.status === 'resolved' ? new Date().toISOString() : null,
            notes: formData.notes || '',
            link: formData.link || '',
            isFavourite: formData.isFavourite || false,
            createdAt: new Date().toISOString()
          });
          onClose();
          setIsSaving(false);
        }
        break;
    }
  };

  if (!isOpen) return null;

  if (isMediaType) {
    const SearchModalComponent = window.getWindowComponent?.('SearchModal', window.MissingComponent) || window.MissingComponent;
    return (
      <SearchModalComponent
        isOpen={isOpen}
        onClose={onClose}
        category={activeTab}
        onAdd={(item) => { onAddMedia(item); onClose(); }}
      />
    );
  }

  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');
  const dateCategories = window.DATE_CATEGORIES || [];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[100]"
      ariaLabel={getModalTitle()}
      dialogClassName={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30 ${activeTab === 'trips' ? 'max-w-2xl' : 'max-w-md'}`}
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">{getModalTitle()}</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close add modal">
            <CloseIcon size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {activeTab === 'tasks' && (
            <>
              <FormField label="Title" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required autoFocus />
              </FormField>
              <FormField label="Description">
                <textarea rows="3" placeholder="Optional details…" className={inputCls} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </FormField>
              <FormField label="Assign to">
                <div className="flex flex-wrap gap-2">
                  {(profile?.users || [{ id: 'user-1', name: 'User 1', color: '#E63B2E' }, { id: 'user-2', name: 'User 2', color: '#8C4F45' }]).map(u => {
                    const userName = u.name || u.username || 'User';
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, assignedTo: formData.assignedTo === u.id ? null : u.id })}
                        className={`flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                          formData.assignedTo === u.id
                            ? 'border-transparent text-white'
                            : 'border-[#E1D8D4] bg-white text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001]'
                        }`}
                        style={formData.assignedTo === u.id ? { backgroundColor: u.color, borderColor: u.color } : {}}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: u.color }}>
                          {userName.charAt(0)}
                        </span>
                        <span className="truncate" title={userName}>{userName}</span>
                      </button>
                    );
                  })}
                </div>
              </FormField>
              <FormField label="Due date">
                <input type="date" className={inputCls} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </FormField>
              <TaskRecurrenceFields formData={formData} setFormData={setFormData} />
            </>
          )}

          {activeTab === 'calendar' && (
            <>
              <FormField label="Title" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </FormField>
              <FormField label="Date" required>
                <input type="date" className={inputCls} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </FormField>
              <FormField label="End date">
                <input type="date" className={inputCls} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </FormField>
              <FormField label="Time">
                <select className={selectCls} onChange={(e) => setFormData({ ...formData, time: e.target.value })}>
                  <option value="">— none —</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <CalendarRecurrenceFields formData={formData} setFormData={setFormData} />
              <FormField label="Description">
                <textarea rows="3" className={inputCls} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </FormField>
            </>
          )}

          {activeTab === 'trips' && (
            <>
              <FormField label="Trip type">
                <div className="flex gap-2">
                  {['past', 'next'].map(type => (
                    <button key={type} type="button" onClick={() => setFormData({ ...formData, tripType: type })}
                      className={`min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                        (formData.tripType || 'next') === type
                          ? 'border-[#E63B2E] bg-[#E63B2E] text-white'
                          : 'border-[#E1D8D4] bg-white text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001]'
                      }`}>
                      {type === 'past' ? 'Past trip' : 'Next trip'}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Destination" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required />
              </FormField>
              <FormField label="Year">
                <input type="number" min="1900" max="2100" placeholder={new Date().getFullYear()} className={inputCls} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} />
              </FormField>
              <TripPlanningFields formData={formData} setFormData={setFormData} />
              <FormField label="Photo URL">
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
              </FormField>
              <FormField label="Accommodation URL">
                <input type="url" className={inputCls} onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })} />
              </FormField>
            </>
          )}

          {activeTab === 'recipes' && (
            <>
              <FormField label="Name" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="Prep time">
                <input type="text" placeholder="e.g. 45 min" className={inputCls} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
              </FormField>
              <FormField label="Photo URL">
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
              </FormField>
              <FormField label="Recipe link">
                <input type="url" className={inputCls} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
              </FormField>
              <FormField label="Ingredients">
                <textarea placeholder="One per line" rows="4" className={inputCls} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
              </FormField>
              <FormField label="Instructions">
                <textarea rows="5" className={inputCls} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
              </FormField>
            </>
          )}

          {activeTab === 'locations' && (
            <>
              <FormField label="Place name" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="Category">
                <select className={selectCls} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {dateCategories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Address">
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </FormField>
              <FormField label="Website">
                <input type="url" className={inputCls} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
              </FormField>
              <FormField label="Notes">
                <textarea rows="3" className={inputCls} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </FormField>
              <FormField label="Favourite">
                <label className="flex min-h-[44px] items-center gap-2 pt-1 text-sm font-medium text-[#534340]">
                  <input type="checkbox" onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })} className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]" />
                  Mark as favourite
                </label>
              </FormField>
            </>
          )}

          <button type="submit" disabled={isSaving} className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:cursor-not-allowed disabled:bg-[#D8C2BE] disabled:shadow-none">
            {isSaving && activeTab === 'locations' ? 'Locating address...' : getModalTitle()}
          </button>
        </form>
    </ModalShell>
  );
};

// ============================================================================
// EDIT EVENT MODAL COMPONENT
// ============================================================================

const EditEventModal = ({ isOpen, onClose, event, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        title: event.title || '',
        date: event.startDate || event.date || '',
        endDate: event.endDate || '',
        time: event.time || '',
        description: event.description || '',
        recurrenceFrequency: event.recurrence?.frequency || event.recurrence || 'none',
        recurrenceUntil: event.recurrence?.until || event.recurrenceUntil || ''
      });
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;
  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.date) {
      onSave({
        ...event,
        ...buildCalendarEventPayload(formData)
      });
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[110]"
      ariaLabel="Edit activity"
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit activity</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close edit activity">
            <CloseIcon size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Title" required>
            <input type="text" className={inputCls} value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Date" required>
            <input type="date" className={inputCls} value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </FormField>
          <FormField label="End date">
            <input type="date" className={inputCls} value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </FormField>
          <FormField label="Time">
            <select className={selectCls} value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })}>
              <option value="">— none —</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <CalendarRecurrenceFields formData={formData} setFormData={setFormData} editing />
          <FormField label="Description">
            <textarea rows="3" className={inputCls} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </FormField>

          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            Save changes
          </button>
        </form>
    </ModalShell>
  );
};

// ============================================================================
// EDIT RECIPE MODAL (minimal)
// ============================================================================

const EditRecipeModal = ({ isOpen, onClose, recipe, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && recipe) {
      setFormData({
        name: recipe.name || '',
        photo: recipe.photo || '',
        prepTime: recipe.prepTime || '',
        link: recipe.link || '',
        ingredients: recipe.ingredients || '',
        instructions: recipe.instructions || '',
      });
    }
  }, [isOpen, recipe]);

  if (!isOpen || !recipe) return null;
  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name) {
      onSave({ ...recipe, ...formData });
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[120]"
      ariaLabel="Edit recipe"
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit recipe</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close edit recipe">
            <CloseIcon size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Name" required>
            <input type="text" className={inputCls} value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Photo URL">
            <input type="text" className={inputCls} value={formData.photo || ''} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
          </FormField>
          <FormField label="Prep time">
            <input type="text" className={inputCls} value={formData.prepTime || ''} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
          </FormField>
          <FormField label="Recipe link">
            <input type="url" className={inputCls} value={formData.link || ''} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
          </FormField>
          <FormField label="Ingredients">
            <textarea rows="4" className={inputCls} value={formData.ingredients || ''} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
          </FormField>
          <FormField label="Instructions">
            <textarea rows="5" className={inputCls} value={formData.instructions || ''} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
          </FormField>
          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            Save changes
          </button>
        </form>
    </ModalShell>
  );
};

// ============================================================================
// EDIT TRIP MODAL (minimal)
// ============================================================================

const EditTripModal = ({ isOpen, onClose, trip, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && trip) {
      setFormData({
        destination: trip.destination || '',
        year: trip.year || new Date().getFullYear(),
        tripType: trip.tripType || 'next',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        photo: trip.photo || '',
        accommodation: trip.accommodation || '',
        itinerary: Array.isArray(trip.itinerary) ? trip.itinerary : [],
        bookings: Array.isArray(trip.bookings) ? trip.bookings : [],
        notes: trip.notes || '',
        packingList: Array.isArray(trip.packingList) ? trip.packingList : [],
      });
    }
  }, [isOpen, trip]);

  if (!isOpen || !trip) return null;
  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.destination) {
      onSave({ ...trip, ...buildTripPayload(formData) });
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[130]"
      ariaLabel="Edit trip"
      dialogClassName="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit trip</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close edit trip">
            <CloseIcon size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Destination" required>
            <input type="text" className={inputCls} value={formData.destination || ''} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Year">
            <input type="number" className={inputCls} value={formData.year || ''} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} />
          </FormField>
          <TripPlanningFields formData={formData} setFormData={setFormData} />
          <FormField label="Trip type">
            <div className="flex gap-2">
              {['past', 'next'].map(type => (
                <button key={type} type="button" onClick={() => setFormData({ ...formData, tripType: type })}
                  className={`min-h-[44px] flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                    formData.tripType === type
                      ? 'border-[#E63B2E] bg-[#E63B2E] text-white'
                      : 'border-[#E1D8D4] bg-white text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001]'
                  }`}>
                  {type === 'past' ? 'Past trip' : 'Next trip'}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Photo URL">
            <input type="text" className={inputCls} value={formData.photo || ''} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
          </FormField>
          <FormField label="Accommodation URL">
            <input type="url" className={inputCls} value={formData.accommodation || ''} onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })} />
          </FormField>
          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            Save changes
          </button>
        </form>
    </ModalShell>
  );
};

Object.assign(window, { GlobalAddModal, AddModal, EditEventModal, EditRecipeModal, EditTripModal });
