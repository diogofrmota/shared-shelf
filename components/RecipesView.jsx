const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// RECIPES VIEW COMPONENT
// ============================================================================

const RECIPE_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/1a1a2e/8b5cf6?text=Recipe';

const RecipeCard = ({ recipe, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-colors group">
      <div className="aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <img
          src={recipe.photo || RECIPE_PHOTO_PLACEHOLDER}
          alt={recipe.name}
          onError={(e) => { e.currentTarget.src = RECIPE_PHOTO_PLACEHOLDER; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <ChefHat size={18} className="text-purple-400 shrink-0" />
              <span className="truncate">{recipe.name}</span>
            </h4>
            {recipe.prepTime && <p className="text-sm text-slate-400 mt-1">⏱ {recipe.prepTime}</p>}
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button onClick={() => onEdit(recipe)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100" aria-label="Edit recipe">
                <span className="text-lg">✎</span>
              </button>
            )}
            <button onClick={() => onDelete(recipe.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100" aria-label="Delete recipe">
              <Trash size={16} />
            </button>
          </div>
        </div>

        {recipe.link && (
          <a href={recipe.link} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors break-all">
            <LinkIcon size={14} />
            Source
          </a>
        )}

        <button onClick={() => setExpanded(v => !v)} className="mt-3 text-sm text-slate-400 hover:text-white transition-colors">
          {expanded ? 'Hide details' : 'Show details'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            {recipe.ingredients && (
              <div>
                <h5 className="text-sm font-semibold text-purple-300 mb-1 uppercase tracking-wide">Ingredients</h5>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{recipe.ingredients}</p>
              </div>
            )}
            {recipe.instructions && (
              <div>
                <h5 className="text-sm font-semibold text-purple-300 mb-1 uppercase tracking-wide">Instructions</h5>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{recipe.instructions}</p>
              </div>
            )}
            {!recipe.ingredients && !recipe.instructions && (
              <p className="text-sm text-slate-500 italic">No details saved.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EditRecipeModal = ({ isOpen, onClose, recipe, onSave }) => {
  const [formData, setFormData] = useState(recipe || {});

  useEffect(() => {
    if (recipe) setFormData(recipe);
  }, [recipe]);

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
            <h2 className="text-2xl font-bold text-white">Edit Recipe</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white">
              <Close size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Recipe Name <span className="text-red-400">*</span></label>
              <input type="text" value={formData.name || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Prep Time</label>
              <input type="text" value={formData.prepTime || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Photo URL</label>
              <input type="text" value={formData.photo || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Recipe Link</label>
              <input type="url" value={formData.link || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Ingredients</label>
              <textarea value={formData.ingredients || ''} className={`${fieldCls} font-mono text-sm`} rows="4" onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Instructions</label>
              <textarea value={formData.instructions || ''} className={fieldCls} rows="4" onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
            </div>
            <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const RecipesView = ({ recipes, onDeleteRecipe, onEditRecipe }) => {
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? recipes.filter(r =>
        (r.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (r.ingredients || '').toLowerCase().includes(query.toLowerCase())
      )
    : recipes;
  const sorted = [...filtered].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes by name or ingredient…"
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
          {query ? 'No recipes match your search.' : 'No recipes yet. Add your first one above!'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sorted.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={onDeleteRecipe} onEdit={onEditRecipe} />
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RecipeCard, EditRecipeModal, RecipesView });
