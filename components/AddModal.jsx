const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// GLOBAL ADD MODAL COMPONENT
// ============================================================================

const GlobalAddModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const categories = [
    { id: 'tasks',    label: 'Task',      icon: CheckSquare, bg: 'from-violet-500/20 to-violet-600/5',    border: 'border-violet-500/30',  text: 'text-violet-400'  },
    { id: 'calendar', label: 'Activity',  icon: CalendarIcon, bg: 'from-blue-500/20 to-blue-600/5',       border: 'border-blue-500/30',    text: 'text-blue-400'    },
    { id: 'dates',    label: 'Date Spot', icon: Utensils,     bg: 'from-pink-500/20 to-pink-600/5',       border: 'border-pink-500/30',    text: 'text-pink-400'    },
    { id: 'trips',    label: 'Trip',      icon: MapPin,       bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    { id: 'recipes',  label: 'Recipe',    icon: ChefHat,      bg: 'from-orange-500/20 to-orange-600/5',   border: 'border-orange-500/30',  text: 'text-orange-400'  },
    { id: 'tvshows',  label: 'TV Show',   icon: Tv,           bg: 'from-cyan-500/20 to-cyan-600/5',       border: 'border-cyan-500/30',    text: 'text-cyan-400'    },
    { id: 'movies',   label: 'Movie',     icon: Film,         bg: 'from-yellow-500/20 to-yellow-600/5',   border: 'border-yellow-500/30',  text: 'text-yellow-400'  },
    { id: 'books',    label: 'Book',      icon: Book,         bg: 'from-red-500/20 to-red-600/5',         border: 'border-red-500/30',     text: 'text-red-400'     },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">What are you adding?</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Close size={20} />
          </button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2.5">
          {categories.map(({ id, label, icon: Icon, bg, border, text }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`bg-gradient-to-br ${bg} border ${border} rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200 hover:shadow-lg`}
            >
              <Icon size={22} className={text} />
              <span className="text-white font-semibold text-sm">{label}</span>
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
  <div className="space-y-1">
    <label className="block text-sm font-medium text-slate-300">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const AddModal = ({ isOpen, onClose, activeTab, onAddMedia, onAddEvent, onAddTrip, onAddRecipe, onAddDate, onAddTask, profile }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isOpen) setFormData({});
  }, [isOpen]);

  const getModalTitle = () => {
    const titles = {
      tasks: 'Add Task', movies: 'Add Movie', tvshows: 'Add TV Show',
      books: 'Add Book', calendar: 'Add Activity', trips: 'Add Trip',
      dates: 'Add Place', recipes: 'Add Recipe'
    };
    return titles[activeTab] || 'Add Item';
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
      case 'dates':
        if (formData.name) {
          onAddDate({ id: `date-${uid()}`, name: formData.name, category: formData.category || 'restaurant', address: formData.address || '', lat: null, lng: null, notes: formData.notes || '', link: formData.link || '', isFavourite: formData.isFavourite || false, createdAt: new Date().toISOString() });
          onClose();
        }
        break;
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500";
  const selectCls = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500";

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700/50 sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{getModalTitle()}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
              <Close size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  {(profile?.users || [{ id: 'user-1', name: 'User 1', color: '#8b5cf6' }, { id: 'user-2', name: 'User 2', color: '#ec4899' }]).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, assignedTo: formData.assignedTo === u.id ? null : u.id })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border flex items-center justify-center gap-2 ${formData.assignedTo === u.id ? 'text-white border-transparent' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white'}`}
                      style={formData.assignedTo === u.id ? { backgroundColor: u.color, borderColor: u.color } : {}}
                    >
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: u.color }}>
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
              <FormField label="End Date">
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
              <FormField label="Trip Type">
                <div className="flex gap-2">
                  {['past', 'next'].map(type => (
                    <button key={type} type="button" onClick={() => setFormData({ ...formData, tripType: type })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${(formData.tripType || 'next') === type ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-white'}`}>
                      {type === 'past' ? 'Past Trip' : 'Next Trip'}
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
              <FormField label="Prep Time">
                <input type="text" placeholder="e.g. 45 min" className={inputCls} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
              </FormField>
              <FormField label="Photo URL">
                <input type="text" className={inputCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
              </FormField>
              <FormField label="Recipe Link">
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

          {activeTab === 'dates' && (
            <>
              <FormField label="Place Name" required>
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
                <label className="flex items-center gap-2 text-slate-300 pt-1">
                  <input type="checkbox" onChange={(e) => setFormData({ ...formData, isFavourite: e.target.checked })} className="accent-purple-500" />
                  Mark as favourite
                </label>
              </FormField>
            </>
          )}

          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold mt-2">
            {getModalTitle()}
          </button>
        </form>
      </div>
    </div>
  );
};

Object.assign(window, { GlobalAddModal, AddModal });
