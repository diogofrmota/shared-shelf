const React = window.React;
const { useState, useEffect, useRef } = React;

const getComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;
const getModalShell = () => window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;

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
    <label className="block text-xs font-bold uppercase tracking-wide text-[#000000]">
      {label} {required && <span className="text-[#E63B2E]">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "min-h-[44px] w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2.5 text-[#000000] placeholder-[#000000] outline-none transition focus:border-[#E63B2E]";
const selectCls = inputCls;

const formatDateForInput = (isoDate) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const parseDateInput = (displayValue) => {
  const match = String(displayValue || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, dayRaw, monthRaw, yearRaw] = match;
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
  return `${yearRaw}-${monthRaw}-${dayRaw}`;
};

const formatDateDigits = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const DateInput = ({ value, onChange, required = false, autoFocus = false }) => {
  const [displayValue, setDisplayValue] = useState(formatDateForInput(value));
  const nativeRef = useRef(null);
  const CalendarIconPicker = getComponent('CalendarIcon');

  useEffect(() => {
    setDisplayValue(formatDateForInput(value));
  }, [value]);

  const handleChange = (e) => {
    const nextDisplay = formatDateDigits(e.target.value);
    const nextIso = parseDateInput(nextDisplay);
    setDisplayValue(nextDisplay);
    onChange(nextIso);
    e.target.setCustomValidity(
      nextDisplay && nextDisplay.length === 10 && !nextIso ? 'Enter a valid date as dd/mm/yyyy.' : ''
    );
  };

  const handleNativePick = (e) => {
    const iso = e.target.value; // YYYY-MM-DD
    if (iso) onChange(iso);
    // reset so the same date can be re-picked
    e.target.value = '';
  };

  const openPicker = () => {
    if (!nativeRef.current) return;
    if (value) nativeRef.current.value = value;
    try { nativeRef.current.showPicker(); } catch { nativeRef.current.click(); }
  };

  return (
    <div className="flex gap-1">
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        className={`${inputCls} flex-1`}
        value={displayValue}
        onChange={handleChange}
        pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
        required={required}
        autoFocus={autoFocus}
      />
      <input
        type="date"
        ref={nativeRef}
        onChange={handleNativePick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={openPicker}
        className="flex min-h-[44px] w-11 shrink-0 items-center justify-center rounded-lg border border-[#E1D8D4] bg-[#FBF2ED] text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#E63B2E]"
        aria-label="Open date picker"
        title="Pick date"
      >
        <CalendarIconPicker size={15} />
      </button>
    </div>
  );
};

const isMultiDayCalendarEvent = (formData = {}) => (
  Boolean(formData.date && formData.endDate && formData.endDate > formData.date)
);

const DATE_STATUS_OPTIONS = window.DATE_STATUS_OPTIONS || [
  { value: 'want-to-go', label: 'Want to go' },
  { value: 'visited', label: 'Visited' }
];

const TASK_PRIORITY_OPTIONS = window.TASK_PRIORITY_OPTIONS || [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const buildTripPayload = (formData = {}) => ({
  destination: formData.destination || '',
  startDate: formData.startDate || '',
  endDate: formData.endDate || formData.startDate || '',
  flights: formData.flights || '',
  hotel: formData.hotel || '',
  budget: formData.budget != null && formData.budget !== '' ? Number(formData.budget) : null,
  itinerary: parseTripItinerary(formData.itineraryText || formData.itinerary),
  packingList: [],
  placesToVisit: [],
  restaurants: [],
  documents: formData.documents || '',
  notes: formData.notes || ''
});

const parseTripItinerary = (value) => {
  if (Array.isArray(value)) return value;
  const text = String(value || '').trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const days = [];
  let current = null;
  const uid = () => `day-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const dayMatch = trimmed.match(/^day\s+(\d+)/i);
    if (dayMatch) {
      const title = trimmed.replace(/^day\s+\d+\s*[:.-]?\s*/i, '').trim();
      current = {
        id: uid(),
        day: Number(dayMatch[1]),
        date: '',
        title,
        notes: ''
      };
      days.push(current);
      return;
    }

    if (!current) {
      current = {
        id: uid(),
        day: days.length + 1,
        date: '',
        title: `Day ${days.length + 1}`,
        notes: ''
      };
      days.push(current);
    }
    current.notes = current.notes ? `${current.notes}\n${trimmed}` : trimmed;
  });

  return days.map((day, idx) => ({
    ...day,
    day: Number.isFinite(Number(day.day)) ? Number(day.day) : idx + 1
  }));
};

const EVENT_COLOR_PALETTE = [
  '#E63B2E', '#2563EB', '#16A34A', '#9333EA',
  '#D97706', '#0891B2', '#DB2777', '#6B7280'
];

const DEFAULT_EVENT_COLOR = '#E63B2E';

const ColorPicker = ({ value, onChange }) => {
  const selected = value || DEFAULT_EVENT_COLOR;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {EVENT_COLOR_PALETTE.map(color => (
        <button
          type="button"
          key={color}
          onClick={() => onChange(color)}
          className={`h-8 w-8 rounded-full transition hover:scale-110 ${selected === color ? 'ring-2 ring-offset-2 ring-[#000000] scale-110' : ''}`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
          aria-pressed={selected === color}
        />
      ))}
    </div>
  );
};

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

const buildCalendarEventPayload = (formData = {}) => {
  const multiDay = isMultiDayCalendarEvent(formData);
  const endDate = formData.endDate && formData.endDate >= formData.date ? formData.endDate : formData.date;
  return {
    title: formData.title || '',
    date: formData.date || '',
    startDate: formData.date || '',
    endDate: endDate || '',
    time: multiDay ? '' : formData.time || '',
    description: formData.description || '',
    color: formData.color || DEFAULT_EVENT_COLOR,
    isPersonal: Boolean(formData.isPersonal),
    recurrence: buildEventRecurrence(formData)
  };
};

const VisibilityToggle = ({ value, onChange }) => {
  const UserIcon = window.getWindowComponent?.('UserIcon', window.MissingIcon) || window.MissingIcon;
  const UsersIcon = window.getWindowComponent?.('UsersIcon', window.MissingIcon) || window.MissingIcon;
  return (
    <div className="flex overflow-hidden rounded-lg border border-[#E1D8D4]">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex flex-1 min-h-[44px] items-center justify-center gap-1.5 text-sm font-bold transition ${!value ? 'bg-[#E63B2E] text-white' : 'bg-white text-[#000000] hover:bg-[#FFF8F5]'}`}
      >
        <UsersIcon size={14} />
        Shared
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex flex-1 min-h-[44px] items-center justify-center gap-1.5 border-l border-[#E1D8D4] text-sm font-bold transition ${value ? 'bg-[#E63B2E] text-white' : 'bg-white text-[#000000] hover:bg-[#FFF8F5]'}`}
      >
        <UserIcon size={14} />
        Personal
      </button>
    </div>
  );
};

const getTaskRecurrenceFrequency = (formData = {}) => {
  const frequency = formData.taskRecurrenceFrequency || formData.recurrence?.frequency || 'none';
  return TASK_RECURRENCE_OPTIONS.some(option => option.value === frequency) ? frequency : 'none';
};

const buildTaskRecurrence = (formData = {}) => {
  if (!formData.isRecurring) return null;
  const frequency = getTaskRecurrenceFrequency(formData);
  if (frequency === 'none') return null;
  return { frequency };
};

const CalendarRecurrenceFields = ({ formData, setFormData, editing = false }) => {
  const frequency = getRecurrenceFrequency(formData);

  return (
    <div className="space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
      <FormField label="Does it repeat?">
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
            <DateInput
              value={formData.recurrenceUntil || ''}
              onChange={(recurrenceUntil) => setFormData({ ...formData, recurrenceUntil })}
            />
          </FormField>
          <p className="text-xs font-medium text-[#000000]">
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
      <label className="flex min-h-[44px] items-center gap-2 text-sm font-bold text-[#000000]">
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
          <p className="text-xs font-medium text-[#000000]">
            Checking a recurring task records one completed occurrence and keeps it active.
          </p>
        </>
      )}
    </div>
  );
};


const AddModal = ({ isOpen, onClose, activeTab, onAddMedia, onAddEvent, onAddTrip, onAddRecipe, onAddDate, onAddTask, profile, initialData, mediaWatchOptions, mediaWatchFilter }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const addressLookupTimerRef = useRef(null);

  useEffect(() => {
    setFormData(initialData && typeof initialData === 'object' ? { ...initialData } : {});
    setIsSaving(false);
    setShowTaskOptions(false);
    setShowCalendarOptions(Boolean(initialData?.date));
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (activeTab !== 'dates') return;
    const query = String(formData.address || '').trim();
    if (addressLookupTimerRef.current) clearTimeout(addressLookupTimerRef.current);
    if (query.length < 3 || !window.api?.request) {
      setAddressSuggestions([]);
      return;
    }
    addressLookupTimerRef.current = setTimeout(async () => {
      try {
        const results = await window.api.request(`/api/nominatim?q=${encodeURIComponent(query)}`, { auth: true });
        const suggestions = Array.isArray(results)
          ? results.slice(0, 5).map(item => String(item.display_name || '').trim()).filter(Boolean)
          : [];
        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(true);
      } catch (_) {
        setAddressSuggestions([]);
      }
    }, 250);

    return () => {
      if (addressLookupTimerRef.current) clearTimeout(addressLookupTimerRef.current);
    };
  }, [activeTab, formData.address]);

  const getModalTitle = () => {
    const titles = {
      tasks: 'Add task', movies: 'Add movie', tvshows: 'Add TV show',
      books: 'Add book', calendar: 'Add activity', trips: 'Add trip',
      dates: 'Add date', recipes: 'Add recipe'
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
            priority: formData.priority && formData.priority !== 'none' ? formData.priority : null,
            completed: false,
            recurrence: buildTaskRecurrence(formData),
            lastCompletedAt: null,
            completionCount: 0,
            completionHistory: [],
            subtasks: String(formData.subtasksText || '').split('\n').map(v => v.trim()).filter(Boolean).map((title, idx) => ({ id: `subtask-${uid()}-${idx}`, title, completed: false })),
            listType: formData.listType || 'task',
            createdAt: new Date().toISOString()
          });
          onClose();
        }
        break;
      case 'calendar':
        if (formData.title && formData.date) {
          if (formData.endDate && formData.date && formData.endDate < formData.date) break; // blocked by inline validation
          onAddEvent({ id: `event-${uid()}`, ...buildCalendarEventPayload(formData) });
          onClose();
        }
        break;
      case 'trips':
        if (formData.destination) {
          if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) break;
          onAddTrip({
            id: `trip-${uid()}`,
            ...buildTripPayload(formData),
            createdAt: new Date().toISOString()
          });
          onClose();
        }
        break;
      case 'recipes':
        if (formData.name) {
          onAddRecipe({ id: `recipe-${uid()}`, name: formData.name, link: formData.link || '', ingredients: formData.ingredients || '', isFavourite: Boolean(formData.isFavourite), subtasks: String(formData.subtasksText || '').split('\n').map(v => v.trim()).filter(Boolean).map((title, idx) => ({ id: `subtask-${uid()}-${idx}`, title, completed: false })),
            listType: formData.listType || 'task',
            createdAt: new Date().toISOString() });
          onClose();
        }
        break;
      case 'dates':
        if (formData.name) {
          setIsSaving(true);
          const address = String(formData.address || '').trim();
          const geocoded = window.geocodeAddress
            ? await window.geocodeAddress(address)
            : { lat: null, lng: null, status: address ? 'failed' : 'empty', error: address ? 'Address lookup unavailable' : '' };
          const status = formData.status === 'visited' ? 'visited' : 'want-to-go';
          onAddDate({
            id: `date-${uid()}`,
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
            status,
            beenThere: status === 'visited',
            isFavourite: false,
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
        watchOptions={mediaWatchOptions}
        defaultWatchFilter={mediaWatchFilter}
      />
    );
  }

  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');
  const ChevronRightIcon = getComponent('ChevronRight');
  const dateCategories = window.DATE_CATEGORIES || [];
  const isCalendarMultiDay = isMultiDayCalendarEvent(formData);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[100]"
      ariaLabel={getModalTitle()}
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#000000]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#000000]">{getModalTitle()}</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close add modal">
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
                <textarea rows="3" placeholder="Optional notes/details for this task…" className={inputCls} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </FormField>
              <button
                type="button"
                onClick={() => setShowTaskOptions(open => !open)}
                className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[#E1D8D4] bg-[#FFF8F5] px-3 py-2 text-sm font-bold text-[#000000] transition hover:border-[#FFB4A9] hover:bg-[#FFDAD4]/35"
                aria-expanded={showTaskOptions}
              >
                <span>More options</span>
                <ChevronRightIcon size={18} className={`transition ${showTaskOptions ? 'rotate-90' : ''}`} />
              </button>
              {showTaskOptions && (
                <div className="space-y-4 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                  <FormField label="Due date">
                    <DateInput value={formData.dueDate || ''} onChange={(dueDate) => setFormData({ ...formData, dueDate })} />
                  </FormField>
                  <FormField label="Priority">
                    <select
                      className={selectCls}
                      value={formData.priority || 'none'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {TASK_PRIORITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </FormField>
                  {Array.isArray(profile?.users) && profile.users.length > 0 && (
                    <FormField label="Assign to">
                      <select className={selectCls} value={formData.assignedTo || ''} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value || null })}>
                        <option value="">Unassigned</option>
                        {profile.users.map(u => <option key={u.id} value={u.id}>{u.name || u.username}</option>)}
                      </select>
                    </FormField>
                  )}
                  <FormField label="Checklist items">
                    <textarea rows="3" placeholder="One item per line" className={inputCls} onChange={(e) => setFormData({ ...formData, subtasksText: e.target.value })} />
                  </FormField>
                  <TaskRecurrenceFields formData={formData} setFormData={setFormData} />
                </div>
              )}
            </>
          )}

          {activeTab === 'calendar' && (
            <>
              <FormField label="Title" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </FormField>
              <FormField label="For">
                <VisibilityToggle value={Boolean(formData.isPersonal)} onChange={(v) => setFormData({ ...formData, isPersonal: v })} />
              </FormField>
              <FormField label="Date" required>
                <DateInput value={formData.date || ''} onChange={(date) => setFormData({ ...formData, date })} required />
              </FormField>
              {!isCalendarMultiDay && (
                <FormField label="Time">
                  <select className={selectCls} onChange={(e) => setFormData({ ...formData, time: e.target.value })}>
                    <option value="">- none -</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </FormField>
              )}
              <button
                type="button"
                onClick={() => setShowCalendarOptions(open => !open)}
                className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-[#E1D8D4] bg-[#FFF8F5] px-3 py-2 text-sm font-bold text-[#000000] transition hover:border-[#FFB4A9] hover:bg-[#FFDAD4]/35"
                aria-expanded={showCalendarOptions}
              >
                <span>More options</span>
                <ChevronRightIcon size={18} className={`transition ${showCalendarOptions ? 'rotate-90' : ''}`} />
              </button>
              {showCalendarOptions && (
                <div className="space-y-4 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                  <FormField label="Colour">
                    <ColorPicker value={formData.color || DEFAULT_EVENT_COLOR} onChange={(color) => setFormData({ ...formData, color })} />
                  </FormField>
                  <FormField label="End date">
                    <DateInput
                      value={formData.endDate || ''}
                      onChange={(endDate) => setFormData({
                        ...formData,
                        endDate,
                        time: endDate && endDate > formData.date ? '' : formData.time
                      })}
                    />
                    {formData.endDate && formData.date && formData.endDate < formData.date && (
                      <p className="mt-1 text-xs font-semibold text-[#E63B2E]">End date must be on or after the start date.</p>
                    )}
                  </FormField>
                  <CalendarRecurrenceFields formData={formData} setFormData={setFormData} />
                  <FormField label="Description">
                    <textarea rows="3" className={inputCls} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </FormField>
                </div>
              )}
            </>
          )}

          {activeTab === 'trips' && (
            <>
              <FormField label="Destination" required>
                <input type="text" className={inputCls} value={formData.destination || ''} placeholder="e.g. Lisbon, Portugal" onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required autoFocus />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Start date">
                  <DateInput value={formData.startDate || ''} onChange={(startDate) => setFormData({ ...formData, startDate })} />
                </FormField>
                <FormField label="End date">
                  <DateInput value={formData.endDate || ''} onChange={(endDate) => setFormData({ ...formData, endDate })} />
                </FormField>
              </div>
              {formData.endDate && formData.startDate && formData.endDate < formData.startDate && (
                <p className="-mt-2 text-xs font-semibold text-[#E63B2E]">End date must be on or after the start date.</p>
              )}
              <FormField label="Flights">
                <textarea rows="2" placeholder="Airline company, hour for departure and arrival, terminal number, etc" className={inputCls} value={formData.flights || ''} onChange={(e) => setFormData({ ...formData, flights: e.target.value })} />
              </FormField>
              <FormField label="Accommodation">
                <input type="text" className={inputCls} placeholder="Address" value={formData.hotel || ''} onChange={(e) => setFormData({ ...formData, hotel: e.target.value })} />
              </FormField>
              <FormField label="Itinerary">
                <textarea rows="5" placeholder={`Day 1\n1. Eiffel Tower\n2. Louvre Museum\n...`} className={inputCls} value={formData.itineraryText || ''} onChange={(e) => setFormData({ ...formData, itineraryText: e.target.value })} />
              </FormField>
            </>
          )}

          {activeTab === 'recipes' && (
            <>
              <FormField label="Name" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
              </FormField>
              <FormField label="Ingredients">
                <textarea placeholder="One per line" rows="4" className={inputCls} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
              </FormField>
              <FormField label="Recipe Link">
                <input type="url" placeholder="Paste TikTok link, or something from the web..." className={inputCls} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
              </FormField>
              <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#000000]">
                <input type="checkbox" onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })} className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]" />
                Mark as favourite
              </label>
            </>
          )}

          {activeTab === 'dates' && (
            <>
              <FormField label="Place name" required>
                <input type="text" className={inputCls} value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="Location">
                <div className="relative">
                  <input
                    type="text"
                    className={inputCls}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    onFocus={() => setShowAddressSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 120)}
                    placeholder="Start typing an address..."
                  />
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-[#E1D8D4] bg-white shadow-lg">
                      {addressSuggestions.map((suggestion, idx) => (
                        <button
                          key={`${suggestion}-${idx}`}
                          type="button"
                          className="block w-full border-b border-[#F2E7E3] px-3 py-2 text-left text-sm text-[#000000] last:border-b-0 hover:bg-[#FFF8F5]"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, address: suggestion });
                            setShowAddressSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>
              <FormField label="Category">
                <select className={selectCls} value={formData.category || 'restaurant'} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {dateCategories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Status">
                <select className={selectCls} value={formData.status || 'want-to-go'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  {DATE_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Notes">
                <textarea rows="3" className={inputCls} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </FormField>
            </>
          )}

          <button type="submit" disabled={isSaving} className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] disabled:cursor-not-allowed disabled:bg-[#D8C2BE] disabled:shadow-none">
            {isSaving && activeTab === 'dates' ? 'Locating address...' : getModalTitle()}
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
        color: event.color || DEFAULT_EVENT_COLOR,
        isPersonal: Boolean(event.isPersonal),
        recurrenceFrequency: event.recurrence?.frequency || event.recurrence || 'none',
        recurrenceUntil: event.recurrence?.until || event.recurrenceUntil || ''
      });
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;
  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');
  const isCalendarMultiDay = isMultiDayCalendarEvent(formData);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.date) {
      if (formData.endDate && formData.endDate < formData.date) return;
      onSave({ ...event, ...buildCalendarEventPayload(formData) });
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[110]"
      ariaLabel="Edit activity"
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#000000]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#000000]">Edit activity</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close edit activity">
            <CloseIcon size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Title" required>
            <input type="text" className={inputCls} value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="For">
            <VisibilityToggle value={Boolean(formData.isPersonal)} onChange={(v) => setFormData({ ...formData, isPersonal: v })} />
          </FormField>
          <FormField label="Date" required>
            <DateInput value={formData.date || ''} onChange={(date) => setFormData({ ...formData, date })} required />
          </FormField>
          <FormField label="End date">
            <DateInput
              value={formData.endDate || ''}
              onChange={(endDate) => setFormData({
                ...formData,
                endDate,
                time: endDate && endDate > formData.date ? '' : formData.time
              })}
            />
            {formData.endDate && formData.date && formData.endDate < formData.date && (
              <p className="mt-1 text-xs font-semibold text-[#E63B2E]">End date must be on or after the start date.</p>
            )}
          </FormField>
          {!isCalendarMultiDay && (
            <FormField label="Time">
              <select className={selectCls} value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })}>
                <option value="">- none -</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
          )}
          <CalendarRecurrenceFields formData={formData} setFormData={setFormData} editing />
          <FormField label="Description">
            <textarea rows="3" className={inputCls} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </FormField>
          <FormField label="Colour">
            <ColorPicker value={formData.color || DEFAULT_EVENT_COLOR} onChange={(color) => setFormData({ ...formData, color })} />
          </FormField>

          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]">
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
        link: recipe.link || '',
        isFavourite: Boolean(recipe.isFavourite),
        ingredients: recipe.ingredients || '',
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
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#000000]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#000000]">Edit recipe</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close edit recipe">
            <CloseIcon size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Name" required>
            <input type="text" className={inputCls} value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Ingredients">
            <textarea placeholder="One per line" rows="4" className={inputCls} value={formData.ingredients || ''} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
          </FormField>
          <FormField label="Recipe Link">
            <input type="url" placeholder="Paste TikTok link, or something from the web..." className={inputCls} value={formData.link || ''} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
          </FormField>
          <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-[#000000]">
            <input type="checkbox" checked={Boolean(formData.isFavourite)} onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })} className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]" />
            Mark as favourite
          </label>
          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]">
            Save changes
          </button>
        </form>
    </ModalShell>
  );
};

Object.assign(window, { AddModal, EditEventModal, EditRecipeModal });
