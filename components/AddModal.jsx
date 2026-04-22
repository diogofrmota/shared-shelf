const React = window.React;
const { useState, useEffect } = React;

import { Close, CalendarIcon } from './Icons.jsx';
import { SearchModal } from './SearchModal.jsx';

/** * Helper: Formats string input into DD/MM/YYYY 
 */
const formatDateInput = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

/**
 * FormRenderer Component
 * This replaces 'renderFormByType'. By making it a component, 
 * we follow the "Rules of Hooks" properly.
 */
const FormRenderer = ({ type, onAdd, onClose }) => {
  const [formData, setFormData] = useState({});
  const [dateInput, setDateInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...formData, id: Date.now() });
    onClose();
  };

  switch (type) {
    case 'tasks':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, title: e.target.value, completed: false })}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              placeholder="Enter task description"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="3"
              onChange={(e) => setFormData({ ...formData, description: e.target.value, completed: false })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
            Add Task
          </button>
        </form>
      );

    case 'calendar':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Movie Night"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={dateInput}
                className="w-full px-3 py-2 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value);
                  setDateInput(formatted);
                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split('/');
                    setFormData({ ...formData, date: `${year}-${month}-${day}` });
                  }
                }}
                maxLength={10}
                required
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" size={16} />
            </div>
            <p className="text-xs text-slate-500">Format: DD/MM/YYYY</p>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Time</label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-600 rounded-lg text-black focus:outline-none focus:border-purple-500 cursor-pointer"
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            >
              <option value="none">None</option>
              {Array.from({ length: 24 }).map((_, i) => {
                const hour = `${i.toString().padStart(2, '0')}:00`;
                return <option key={hour} value={hour}>{hour}</option>;
              })}
            </select>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              placeholder="Add details about the activity"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="3"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
            Add Activity
          </button>
        </form>
      );

    case 'trips':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Destination <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Paris, France"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Start Date <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={startDateInput}
                className="w-full px-3 py-2 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value);
                  setStartDateInput(formatted);
                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split('/');
                    setFormData({ ...formData, startDate: `${year}-${month}-${day}` });
                  }
                }}
                maxLength={10}
                required
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" size={16} />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">End Date</label>
            <div className="relative">
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                value={endDateInput}
                className="w-full px-3 py-2 pl-10 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                onChange={(e) => {
                  const formatted = formatDateInput(e.target.value);
                  setEndDateInput(formatted);
                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split('/');
                    setFormData({ ...formData, endDate: `${year}-${month}-${day}` });
                  }
                }}
                maxLength={10}
              />
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" size={16} />
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
            Add Trip
          </button>
        </form>
      );

    case 'dates':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              className="w-full px-3 py-2 bg-white border border-slate-600 rounded-lg text-black focus:outline-none focus:border-purple-500 cursor-pointer"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="cafe">☕ Café</option>
              <option value="park">🌳 Park</option>
              <option value="museum">🏛️ Museum</option>
              <option value="beach">🏖️ Beach</option>
              <option value="viewpoint">🌅 Viewpoint</option>
              <option value="entertainment">🎭 Entertainment</option>
              <option value="other">📍 Other</option>
            </select>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Place Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Romantic Restaurant"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Address</label>
            <input
              type="text"
              placeholder="Full address"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Notes</label>
            <textarea
              placeholder="Why is this place special?"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="3"
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
            Add Date Spot
          </button>
        </form>
      );

    case 'recipes':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Recipe Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Spaghetti Carbonara"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Prep Time</label>
            <input
              type="text"
              placeholder="e.g., 30 minutes"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Photo URL</label>
            <input
              type="text"
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Recipe Link</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Ingredients</label>
            <textarea
              placeholder="• 200g spaghetti&#10;• 2 eggs&#10;• 100g pancetta"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono text-sm"
              rows="4"
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-slate-300">Instructions</label>
            <textarea
              placeholder="Step by step cooking instructions"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="4"
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
            Add Recipe
          </button>
        </form>
      );

    default:
      return <p className="text-slate-400">Form coming soon...</p>;
  }
};

/**
 * Main AddModal Component
 */
export const AddModal = ({ isOpen, onClose, activeTab, onAdd }) => {
  useEffect(() => {
    // If you need specific logic when modal opens/closes
  }, [isOpen]);

  const isMediaType = ['movies', 'tvshows', 'books', 'movie', 'tvshow', 'book'].includes(activeTab?.toLowerCase());

  if (!isOpen) return null;

  if (isMediaType) {
    return (
      <SearchModal
        isOpen={isOpen}
        onClose={onClose}
        category={activeTab}
        onAdd={(item) => {
          onAdd(item);
          onClose();
        }}
      />
    );
  }

  const getAddTypeLabel = (tab) => {
    const labels = {
      tasks: 'Task',
      calendar: 'Activity',
      trips: 'Trip',
      dates: 'Date Spot',
      recipes: 'Recipe'
    };
    return labels[tab] || 'Item';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50 sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Add New {getAddTypeLabel(activeTab)}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <Close size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <FormRenderer type={activeTab} onAdd={onAdd} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};