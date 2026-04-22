/**
 * Header and Navigation Components
 */

const React = window.React;

import { Search, Plus, Film, Tv, Book } from './Icons.jsx';
import { TAB_CONFIG } from '../config.js';

/**
 * Navigation Tabs Component
 */
export const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto">
    {tabs.map(tab => {
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base rounded-t-xl transition-all duration-300 whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-slate-900/50 text-white border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
          }`}
        >
          <Icon size={16} />
          {tab.label}
        </button>
      );
    })}
  </div>
);

/**
 * Application Header Component
 */
export const Header = ({
  activeTab,
  onTabChange,
  onSearchClick,
  onAddClick,
  tabs
}) => (
  <div className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-40">
    <div className="max-w-8xl mx-auto px-3 sm:px-4 lg:px-8">
      {/* Title and Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Diogo & Mónica's Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onSearchClick}
            className="flex-1 sm:flex-none px-3 sm:px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:gap-2 gap-1 text-sm sm:text-base shadow-lg shadow-slate-900/30 hover:shadow-xl hover:shadow-slate-900/40 hover:scale-105"
          >
            <Search size={18} />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={onAddClick}
            className="flex-1 sm:flex-none px-3 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center sm:gap-2 gap-1 text-sm sm:text-base shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 hover:scale-105"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add New</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  </div>
);

/**
 * Get default tab configuration
 */
export const getDefaultTabs = () => [
  { id: TAB_CONFIG.MOVIES.id, label: TAB_CONFIG.MOVIES.label, icon: Film },
  { id: TAB_CONFIG.TV_SHOWS.id, label: TAB_CONFIG.TV_SHOWS.label, icon: Tv },
  { id: TAB_CONFIG.BOOKS.id, label: TAB_CONFIG.BOOKS.label, icon: Book }
];
