const React = window.React;
const { useState, useEffect } = React;

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

  useEffect(() => {
    setDisplayValue(formatDateForInput(value));
  }, [value]);

  const handleChange = (e) => {
    const nextDisplayValue = formatDateDigits(e.target.value);
    const nextIsoValue = parseDateInput(nextDisplayValue);
    setDisplayValue(nextDisplayValue);
    onChange(nextIsoValue);
    e.target.setCustomValidity(
      nextDisplayValue && nextDisplayValue.length === 10 && !nextIsoValue
        ? 'Enter a valid date as dd/mm/yyyy.'
        : ''
    );
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/yyyy"
      className={inputCls}
      value={displayValue}
      onChange={handleChange}
      pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
      required={required}
      autoFocus={autoFocus}
    />
  );
};

const isMultiDayCalendarEvent = (formData = {}) => (
  Boolean(formData.date && formData.endDate && formData.endDate > formData.date)
);

const EXPENSE_CATEGORIES = window.EXPENSE_CATEGORIES || [
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' }
];

const buildExpensePayload = (formData = {}) => ({
  description: formData.description || '',
  amount: formData.amount != null && formData.amount !== '' ? Number(formData.amount) : null,
  category: formData.category || 'other',
  date: formData.date || '',
  paidBy: formData.paidBy || '',
  notes: formData.notes || ''
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
    recurrence: buildEventRecurrence(formData)
  };
};

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


const AddModal = ({ isOpen, onClose, activeTab, onAddMedia, onAddEvent, onAddExpense, onAddRecipe, onAddDate, onAddTask, profile }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  useEffect(() => {
    setFormData({});
    setIsSaving(false);
    setShowTaskOptions(false);
    setShowCalendarOptions(false);
  }, [isOpen, activeTab]);

  const getModalTitle = () => {
    const titles = {
      tasks: 'Add task', movies: 'Add movie', tvshows: 'Add TV show',
      books: 'Add book', calendar: 'Add activity', expenses: 'Add expense',
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
      case 'expenses':
        if (formData.description) {
          onAddExpense({ id: `expense-${uid()}`, ...buildExpensePayload(formData), createdAt: new Date().toISOString() });
          onClose();
        }
        break;
      case 'recipes':
        if (formData.name) {
          onAddRecipe({ id: `recipe-${uid()}`, name: formData.name, prepTime: formData.prepTime || '', link: formData.link || '', ingredients: formData.ingredients || '', instructions: formData.instructions || '', createdAt: new Date().toISOString() });
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
                <textarea rows="3" placeholder="Optional details…" className={inputCls} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
                  <FormField label="End date">
                    <DateInput
                      value={formData.endDate || ''}
                      onChange={(endDate) => setFormData({
                        ...formData,
                        endDate,
                        time: endDate && endDate > formData.date ? '' : formData.time
                      })}
                    />
                  </FormField>
                  <CalendarRecurrenceFields formData={formData} setFormData={setFormData} />
                  <FormField label="Description">
                    <textarea rows="3" className={inputCls} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </FormField>
                </div>
              )}
            </>
          )}

          {activeTab === 'expenses' && (
            <>
              <FormField label="Description" required>
                <input type="text" className={inputCls} placeholder="e.g. Dinner at restaurant" onChange={(e) => setFormData({ ...formData, description: e.target.value })} required autoFocus />
              </FormField>
              <FormField label="Amount" required>
                <input type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              </FormField>
              <FormField label="Category">
                <select className={selectCls} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Date">
                <DateInput value={formData.date || ''} onChange={(date) => setFormData({ ...formData, date })} />
              </FormField>
              {Array.isArray(profile?.users) && profile.users.length > 0 && (
                <FormField label="Paid by">
                  <select className={selectCls} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}>
                    <option value="">— select —</option>
                    {profile.users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </FormField>
              )}
              <FormField label="Notes">
                <textarea rows="3" placeholder="Optional details…" className={inputCls} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </FormField>
            </>
          )}

          {activeTab === 'recipes' && (
            <>
              <FormField label="Name" required>
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
              </FormField>
              <FormField label="Prep time">
                <input type="text" placeholder="e.g. 45 min" className={inputCls} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
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
                <label className="flex min-h-[44px] items-center gap-2 pt-1 text-sm font-medium text-[#000000]">
                  <input type="checkbox" onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })} className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]" />
                  Mark as favourite
                </label>
              </FormField>
            </>
          )}

          <button type="submit" disabled={isSaving} className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] disabled:cursor-not-allowed disabled:bg-[#D8C2BE] disabled:shadow-none">
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
  const isCalendarMultiDay = isMultiDayCalendarEvent(formData);

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
          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]">
            Save changes
          </button>
        </form>
    </ModalShell>
  );
};

// ============================================================================
// EDIT EXPENSE MODAL
// ============================================================================

const EditExpenseModal = ({ isOpen, onClose, expense, onSave, profile }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount != null ? expense.amount : '',
        category: expense.category || 'other',
        date: expense.date || '',
        paidBy: expense.paidBy || '',
        notes: expense.notes || ''
      });
    }
  }, [isOpen, expense]);

  if (!isOpen || !expense) return null;
  const ModalShell = getModalShell();
  const CloseIcon = getComponent('Close');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.description) {
      onSave({ ...expense, ...buildExpensePayload(formData) });
      onClose();
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      zClass="z-[130]"
      ariaLabel="Edit expense"
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#000000]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#000000]">Edit expense</h2>
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Close edit expense">
            <CloseIcon size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Description" required>
            <input type="text" className={inputCls} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Amount" required>
            <input type="number" min="0" step="0.01" className={inputCls} value={formData.amount ?? ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          </FormField>
          <FormField label="Category">
            <select className={selectCls} value={formData.category || 'other'} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Date">
            <DateInput value={formData.date || ''} onChange={(date) => setFormData({ ...formData, date })} />
          </FormField>
          {Array.isArray(profile?.users) && profile.users.length > 0 && (
            <FormField label="Paid by">
              <select className={selectCls} value={formData.paidBy || ''} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}>
                <option value="">— select —</option>
                {profile.users.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Notes">
            <textarea rows="3" className={inputCls} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </FormField>
          <button type="submit" className="mt-2 min-h-[44px] w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]">
            Save changes
          </button>
        </form>
    </ModalShell>
  );
};

Object.assign(window, { AddModal, EditEventModal, EditRecipeModal, EditExpenseModal });
