const React = window.React;
const { useState, useEffect } = React;

// ============================================================================
// RECIPES VIEW COMPONENT
// ============================================================================

const RECIPE_PHOTO_PLACEHOLDER = 'https://via.placeholder.com/800x500/FFDAD4/E63B2E?text=Recipe';

const RecipeDetailModal = ({ recipe, onClose, onEdit }) => {
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#FFDAD4]">
          <img
            src={recipe.photo || RECIPE_PHOTO_PLACEHOLDER}
            alt={recipe.name}
            onError={(e) => { e.currentTarget.src = RECIPE_PHOTO_PLACEHOLDER; }}
            decoding="async"
            className="h-full w-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-[#410001] shadow-md backdrop-blur transition hover:bg-white"
            aria-label="Close"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold text-[#410001]">
                <ChefHat size={22} className="shrink-0 text-[#E63B2E]" />
                <span>{recipe.name}</span>
              </h2>
              {recipe.prepTime && (
                <p className="mt-1 text-sm font-medium text-[#534340]">⏱ {recipe.prepTime}</p>
              )}
            </div>
            {onEdit && (
              <button
                onClick={() => { onEdit(recipe); onClose(); }}
                className="shrink-0 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              >
                ✎ Edit
              </button>
            )}
          </div>

          {recipe.link && (
            <a
              href={recipe.link}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
            >
              <LinkIcon size={14} />
              View source
            </a>
          )}

          {recipe.ingredients && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Ingredients</h3>
              <p className="whitespace-pre-wrap rounded-xl bg-[#FFF8F5] p-4 text-sm leading-relaxed text-[#241A18]">
                {recipe.ingredients}
              </p>
            </div>
          )}

          {recipe.instructions && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Instructions</h3>
              <p className="whitespace-pre-wrap rounded-xl bg-[#FFF8F5] p-4 text-sm leading-relaxed text-[#241A18]">
                {recipe.instructions}
              </p>
            </div>
          )}

          {!recipe.ingredients && !recipe.instructions && (
            <p className="text-sm italic text-[#857370]">No details saved.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const RecipeCard = ({ recipe, onDelete, onEdit, onViewDetails }) => (
  <div
    className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#410001]/10"
    onClick={() => onViewDetails(recipe)}
  >
    <div className="aspect-[4/3] overflow-hidden bg-[#FFDAD4]">
      <img
        src={recipe.photo || RECIPE_PHOTO_PLACEHOLDER}
        alt={recipe.name}
        onError={(e) => { e.currentTarget.src = RECIPE_PHOTO_PLACEHOLDER; }}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="flex items-center gap-2 text-base font-bold text-[#410001]">
            <ChefHat size={16} className="shrink-0 text-[#E63B2E]" />
            <span className="truncate">{recipe.name}</span>
          </h4>
          {recipe.prepTime && <p className="mt-1 text-sm font-medium text-[#534340]">⏱ {recipe.prepTime}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
              className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              aria-label="Edit recipe"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
            aria-label="Delete recipe"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {recipe.link && (
        <a
          href={recipe.link}
          target="_blank"
          rel="noreferrer noopener"
          onClick={e => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]"
        >
          <LinkIcon size={13} />
          Source
        </a>
      )}
    </div>
  </div>
);

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

  const fieldCls = "w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(36,26,24,0.55)] p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#410001]/30">
        <div className="flex items-center justify-between border-b border-[#E1D8D4] p-5">
          <h2 className="text-xl font-extrabold text-[#410001]">Edit recipe</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">
            <Close size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Recipe name *</label>
            <input type="text" value={formData.name || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Prep time</label>
            <input type="text" value={formData.prepTime || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Photo URL</label>
            <input type="text" value={formData.photo || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, photo: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Recipe link</label>
            <input type="url" value={formData.link || ''} className={fieldCls} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Ingredients</label>
            <textarea value={formData.ingredients || ''} className={`${fieldCls} font-mono text-sm`} rows="4" onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#534340]">Instructions</label>
            <textarea value={formData.instructions || ''} className={fieldCls} rows="4" onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#A9372C]">Save changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RecipesView = ({ recipes, onDeleteRecipe, onEditRecipe }) => {
  const [query, setQuery] = useState('');
  const [detailRecipe, setDetailRecipe] = useState(null);

  const filtered = query.trim()
    ? recipes.filter(r =>
        (r.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (r.ingredients || '').toLowerCase().includes(query.toLowerCase())
      )
    : recipes;
  const sorted = [...filtered].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#410001] sm:text-3xl">Recipes</h2>
          <p className="mt-1 text-sm text-[#534340]">A gallery of shared culinary inspirations.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#857370]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full rounded-xl border border-[#E1D8D4] bg-white py-2.5 pl-10 pr-4 text-sm text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]"
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-12 text-center text-sm text-[#534340]">
          {query ? 'No recipes match your search.' : 'No recipes yet. Add your first one above.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={onDeleteRecipe}
              onEdit={onEditRecipe}
              onViewDetails={setDetailRecipe}
            />
          ))}
        </div>
      )}

      <RecipeDetailModal
        recipe={detailRecipe}
        onClose={() => setDetailRecipe(null)}
        onEdit={onEditRecipe}
      />
    </div>
  );
};

Object.assign(window, { RecipeCard, RecipeDetailModal, EditRecipeModal, RecipesView });
