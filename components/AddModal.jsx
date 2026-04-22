// FILE: components/AddModal.jsx

const React = window.React;
const { useState, useEffect } = React;

import { Close } from './Icons.jsx';
import { SearchModal } from './SearchModal.jsx';

export const AddModal = ({ isOpen, onClose, activeTab, onAdd }) => {
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowSearchModal(false);
    }
  }, [isOpen]);

  // For media types (movies, tvshows, books) - show search modal
  const handleAddMedia = () => {
    setShowSearchModal(true);
  };

  // For other types (calendar, trips, places, recipes) - show form modal
  const handleAddOther = () => {
    console.log('Open form for:', activeTab);
  };

  if (!isOpen) return null;

  // Determine if current tab is a media type
  const isMediaType = ['movies', 'tvshows', 'books'].includes(activeTab);

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50">
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
            {isMediaType ? (
              <button
                onClick={handleAddMedia}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                Search & Add {getAddTypeLabel(activeTab)}
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400">
                  Add a new {getAddTypeLabel(activeTab).toLowerCase()}:
                </p>
                {/* Form fields for different types */}
                {renderFormByType(activeTab, onAdd, onClose)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal for media types */}
      {showSearchModal && (
        <SearchModal
          isOpen={showSearchModal}
          onClose={() => {
            setShowSearchModal(false);
            onClose();
          }}
          category={activeTab}
          onAdd={(item) => {
            onAdd(item);
            setShowSearchModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

// Helper function to get label based on tab
const getAddTypeLabel = (tab) => {
  const labels = {
    movies: 'Movie',
    tvshows: 'TV Show',
    books: 'Book',
    calendar: 'Activity',
    trips: 'Trip',
    dates: 'Date Spot',
    places: 'Place',
    recipes: 'Recipe'
  };
  return labels[tab] || 'Item';
};

// Helper function to format date input
const formatDateInput = (value) => {
  // Remove any non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Format as DD/MM/YYYY
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

// Render specific form based on type
const renderFormByType = (type, onAdd, onClose) => {
  const [formData, setFormData] = React.useState({});
  const [dateInput, setDateInput] = React.useState('');
  const [startDateInput, setStartDateInput] = React.useState('');
  const [endDateInput, setEndDateInput] = React.useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...formData, id: Date.now() });
    onClose();
  };

  switch(type) {
    case 'calendar':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Activity Name
            </label>
            <input
              type="text"
              placeholder="e.g., Movie Night"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date (DD/MM/YYYY)
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={dateInput}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => {
                const formatted = formatDateInput(e.target.value);
                setDateInput(formatted);
                
                // Convert to YYYY-MM-DD for storage when complete
                if (formatted.length === 10) {
                  const [day, month, year] = formatted.split('/');
                  setFormData({ ...formData, date: `${year}-${month}-${day}` });
                }
              }}
              maxLength={10}
              required
            />
            <p className="text-xs text-slate-500 mt-1">Format: DD/MM/YYYY</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              placeholder="Add details about the activity"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="3"
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Add Activity
          </button>
        </form>
      );
    
    case 'trips':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Destination
            </label>
            <input
              type="text"
              placeholder="e.g., Paris, France"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Start Date (DD/MM/YYYY)
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={startDateInput}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              End Date (DD/MM/YYYY)
            </label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={endDateInput}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
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
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Add Trip
          </button>
        </form>
      );
    
    case 'dates':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Place Name
            </label>
            <input
              type="text"
              placeholder="e.g., Romantic Restaurant"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Address
            </label>
            <input
              type="text"
              placeholder="Full address"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              placeholder="Why is this place special?"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="3"
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Add Date Spot
          </button>
        </form>
      );
    
    case 'recipes':
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Recipe Name
            </label>
            <input
              type="text"
              placeholder="e.g., Spaghetti Carbonara"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ingredients
            </label>
            <textarea
              placeholder="• 200g spaghetti&#10;• 2 eggs&#10;• 100g pancetta"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono text-sm"
              rows="4"
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Instructions
            </label>
            <textarea
              placeholder="Step by step cooking instructions"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              rows="4"
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Add Recipe
          </button>
        </form>
      );
    
    default:
      return <p className="text-slate-400">Form coming soon...</p>;
  }
};