const React = window.React;
const { useState, useEffect } = React;

const { CheckSquare, CalendarIcon, Utensils, MapPin, ChefHat, Tv, Film, Book, Close } = window;

// ============================================================================
// GLOBAL ADD MODAL COMPONENT
// ============================================================================

const GlobalAddModal = ({ isOpen, onClose, onSelect, enabledSections }) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'tasks',    label: 'Task',      icon: CheckSquare },
    { id: 'calendar', label: 'Activity',  icon: CalendarIcon },
    { id: 'locations', label: 'Location', icon: Utensils },
    { id: 'trips',    label: 'Trip',      icon: MapPin },
    { id: 'recipes',  label: 'Recipe',    icon: ChefHat },
    { id: 'tvshows',  label: 'TV Show',   icon: Tv },
    { id: 'movies',   label: 'Movie',     icon: Film },
    { id: 'books',    label: 'Book',      icon: Book },
  ];
  const enabledSet = new Set(Array.isArray(enabledSections) && enabledSections.length
    ? enabledSections
    : ['calendar', 'tasks', 'locations', 'trips', 'recipes', 'watchlist']);
  const visibleCategories = categories.filter(category => {
    if (['movies', 'tvshows', 'books'].includes(category.id)) return enabledSet.has('watchlist');
    return enabledSet.has(category.id);
  });

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E1D8D4] p-5">
          <h2 className="text-lg font-extrabold text-[#410001]">What are you adding?</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
          >
            <Close size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4">
          {visibleCategories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#FFB4A9] hover:bg-[#FFF8F5] hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFDAD4] text-[#E63B2E] transition group-hover:bg-[#E63B2E] group-hover:text-white">
                <Icon size={20} />
              </span>
              <span className="text-sm font-bold text-[#410001]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
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

const inputCls = "w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";
const selectCls = inputCls;

const AddModal = ({ isOpen, onClose, activeTab, onAddMedia, onAddEvent, onAddTrip, onAddRecipe, onAddDate, onAddTask, profile }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isOpen) setFormData({});
  }, [isOpen]);

  const getModalTitle = () => {
    const titles = {
      tasks: 'Add task', movies: 'Add movie', tvshows: 'Add TV show',
      books: 'Add book', calendar: 'Add activity', trips: 'Add trip',
      locations: 'Add location', recipes: 'Add recipe'
    };
    return titles[activeTab] || 'Add item';
  };

  const isMediaType = ['movies', 'tvshows', 'books'].includes(activeTab);

  const handleSubmit = (e) => {
    e.preventDefault();
    const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    switch (activeTab) {
      case 'tasks':
        if (formData.title) {
          onAddTask({ id: `task-${uid()}`, title: formData.title, description: formData.description || '', assignedTo: formData.assignedTo || null, dueDate: formData.dueDate || null, completed: false, createdAt: new Date().toISOString() });
          onClose();
        }
        break;
      case 'calendar':
        if (formData.title && formData.date) {
          onAddEvent({ id: `event-${uid()}`, title: formData.title, date: formData.date, startDate: formData.date, endDate: formData.endDate || formData.date, time: formData.time || '', description: formData.description || '' });
          onClose();
        }
        break;
      case 'trips':
        if (formData.destination) {
          onAddTrip({ id: `trip-${uid()}`, destination: formData.destination, year: formData.year || new Date().getFullYear(), tripType: formData.tripType || 'next', photo: formData.photo || '', accommodation: formData.accommodation || '' });
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
          onAddDate({ id: `location-${uid()}`, name: formData.name, category: formData.category || 'restaurant', address: formData.address || '', lat: null, lng: null, notes: formData.notes || '', link: formData.link || '', isFavourite: formData.isFavourite || false, createdAt: new Date().toISOString() });
          onClose();
        }
        break;
    }
  };

  if (!isOpen) return null;

  if (isMediaType) {
    return (
      <SearchModal
        isOpen={isOpen}
        onClose={onClose}
        category={activeTab}
        onAdd={(item) => { onAddMedia(item); onClose(); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">{getModalTitle()}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
            <Close size={22} />
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
                <div className="flex gap-2">
                  {(profile?.users || [{ id: 'user-1', name: 'User 1', color: '#E63B2E' }, { id: 'user-2', name: 'User 2', color: '#8C4F45' }]).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedTo: formData.assignedTo === u.id ? null : u.id })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                        formData.assignedTo === u.id
                          ? 'border-transparent text-white'
                          : 'border-[#E1D8D4] bg-white text-[#534340] hover:bg-[#FFF8F5] hover:text-[#410001]'
                      }`}
                      style={formData.assignedTo === u.id ? { backgroundColor: u.color, borderColor: u.color } : {}}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: u.color }}>
                        {u.name.charAt(0)}
                      </span>
                      {u.name}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Due date">
                <input type="date" className={inputCls} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </FormField>
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
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition ${
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
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="coffee">Coffee</option>
                  <option value="brunch">Brunch</option>
                  <option value="other">Other</option>
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
                <label className="flex items-center gap-2 pt-1 text-sm font-medium text-[#534340]">
                  <input type="checkbox" onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })} className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]" />
                  Mark as favourite
                </label>
              </FormField>
            </>
          )}

          <button type="submit" className="mt-2 w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            {getModalTitle()}
          </button>
        </form>
      </div>
    </div>
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
        description: event.description || ''
      });
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.date) {
      onSave({
        ...event,
        title: formData.title,
        date: formData.date,
        startDate: formData.date,
        endDate: formData.endDate || formData.date,
        time: formData.time || '',
        description: formData.description || ''
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit activity</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
            <Close size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Title" required>
            <input type="text" className={inputCls} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Date" required>
            <input type="date" className={inputCls} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </FormField>
          <FormField label="End date">
            <input type="date" className={inputCls} value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
          </FormField>
          <FormField label="Time">
            <select className={selectCls} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })}>
              <option value="">— none —</option>
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Description">
            <textarea rows="3" className={inputCls} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </FormField>

          <button type="submit" className="mt-2 w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            Save changes
          </button>
        </form>
      </div>
    </div>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name) {
      onSave({ ...recipe, ...formData });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit recipe</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
            <Close size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Name" required>
            <input type="text" className={inputCls} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Photo URL">
            <input type="text" className={inputCls} value={formData.photo} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
          </FormField>
          <FormField label="Prep time">
            <input type="text" className={inputCls} value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
          </FormField>
          <FormField label="Recipe link">
            <input type="url" className={inputCls} value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
          </FormField>
          <FormField label="Ingredients">
            <textarea rows="4" className={inputCls} value={formData.ingredients} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
          </FormField>
          <FormField label="Instructions">
            <textarea rows="5" className={inputCls} value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
          </FormField>
          <button type="submit" className="mt-2 w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            Save changes
          </button>
        </form>
      </div>
    </div>
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
        photo: trip.photo || '',
        accommodation: trip.accommodation || '',
      });
    }
  }, [isOpen, trip]);

  if (!isOpen || !trip) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.destination) {
      onSave({ ...trip, ...formData });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit trip</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
            <Close size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <FormField label="Destination" required>
            <input type="text" className={inputCls} value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} required autoFocus />
          </FormField>
          <FormField label="Year">
            <input type="number" className={inputCls} value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} />
          </FormField>
          <FormField label="Trip type">
            <div className="flex gap-2">
              {['past', 'next'].map(type => (
                <button key={type} type="button" onClick={() => setFormData({ ...formData, tripType: type })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition ${
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
            <input type="text" className={inputCls} value={formData.photo} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
          </FormField>
          <FormField label="Accommodation URL">
            <input type="url" className={inputCls} value={formData.accommodation} onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })} />
          </FormField>
          <button type="submit" className="mt-2 w-full rounded-xl bg-[#E63B2E] py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]">
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
};

Object.assign(window, { GlobalAddModal, AddModal, EditEventModal, EditRecipeModal, EditTripModal });
