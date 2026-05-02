const React = window.React;
const { useState, useEffect, useMemo } = React;

// ============================================================================
// RECIPES VIEW COMPONENT
// ============================================================================

const getRecipeComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;
const getRecipeModalShell = () => window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;

const RecipeDetailModal = ({ recipe, onClose, onEdit }) => {
  if (!recipe) return null;
  const safeLink = window.safeExternalUrl?.(recipe.link) || '';
  const ModalShell = getRecipeModalShell();
  const Close = getRecipeComponent('Close');
  const ChefHat = getRecipeComponent('ChefHat');
  const LinkIcon = getRecipeComponent('LinkIcon');

  return (
    <ModalShell
      isOpen={Boolean(recipe)}
      onClose={onClose}
      ariaLabel={`Recipe details for ${recipe.name}`}
      dialogClassName="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#E1D8D4] bg-white shadow-2xl shadow-[#000000]/30"
    >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1D8D4] bg-white p-5">
          <h2 className="flex min-w-0 items-center gap-2 break-words text-xl font-extrabold text-[#000000]">
            <ChefHat size={20} className="shrink-0 text-[#E63B2E]" />
            <span className="truncate">{recipe.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            aria-label="Close recipe details"
          >
            <Close size={20} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {recipe.isFavourite && <p className="text-sm font-bold text-[#E63B2E]">★ Favourite</p>}
            </div>
          {onEdit && (
              <button
                onClick={() => { onEdit(recipe); onClose(); }}
                className="min-h-[44px] shrink-0 rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              >
                ✎ Edit
              </button>
            )}
          </div>

          {safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
            >
              <LinkIcon size={14} />
              View source
            </a>
          )}

          {recipe.ingredients && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Ingredients</h3>
              <p className="whitespace-pre-wrap rounded-xl bg-[#FFF8F5] p-4 text-sm leading-relaxed text-[#000000]">
                {recipe.ingredients}
              </p>
            </div>
          )}

          {recipe.instructions && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#E63B2E]">Instructions</h3>
              <p className="whitespace-pre-wrap rounded-xl bg-[#FFF8F5] p-4 text-sm leading-relaxed text-[#000000]">
                {recipe.instructions}
              </p>
            </div>
          )}

          {!recipe.ingredients && !recipe.instructions && (
            <p className="text-sm italic text-[#000000]">No details saved.</p>
          )}
        </div>
    </ModalShell>
  );
};

const RecipeCard = ({ recipe, onDelete, onEdit, onToggleFavourite, onViewDetails }) => {
  const safeLink = window.safeExternalUrl?.(recipe.link) || '';
  const ChefHat = getRecipeComponent('ChefHat');
  const LinkIcon = getRecipeComponent('LinkIcon');
  const Trash = getRecipeComponent('Trash');
  const Star = getRecipeComponent('Star');

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onViewDetails(recipe);
    }
  };

  return (
  <div
    role="button"
    tabIndex={0}
    aria-label={`Open recipe ${recipe.name}`}
    className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#FFB4A9] hover:shadow-lg hover:shadow-[#000000]/10"
    onClick={() => onViewDetails(recipe)}
    onKeyDown={handleKeyDown}
  >
    <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#FFDAD4] to-[#FFB4A9] text-[#A9372C]">
      <ChefHat size={36} aria-hidden="true" />
    </div>
    <div className="flex flex-1 flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-bold text-[#000000]">
            <span className="line-clamp-2 min-w-0" title={recipe.name}>{recipe.name}</span>
          </h4>
        </div>
        <div className="flex items-center gap-1">
          {onToggleFavourite && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavourite(recipe); }}
              className={`flex h-11 w-11 items-center justify-center rounded-lg transition ${recipe.isFavourite ? 'text-[#E63B2E] hover:bg-[#FFF1EE]' : 'text-[#000000] hover:bg-[#FFF8F5] hover:text-[#E63B2E]'}`}
              aria-label={recipe.isFavourite ? `Remove ${recipe.name} from favourites` : `Add ${recipe.name} to favourites`}
            >
              <Star size={16} fill={recipe.isFavourite ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              aria-label={`Edit recipe ${recipe.name}`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
            aria-label={`Delete recipe ${recipe.name}`}
          >
            <Trash size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {safeLink && (
        <a
          href={safeLink}
          target="_blank"
          rel="noreferrer noopener"
          onClick={e => e.stopPropagation()}
          className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]"
        >
          <LinkIcon size={14} aria-hidden="true" />
          Source
        </a>
      )}
    </div>
  </div>
  );
};

const RecipesView = ({ recipes, onDeleteRecipe, onEditRecipe, onToggleFavouriteRecipe, onAddClick }) => {
  const [query, setQuery] = useState('');
  const [detailRecipe, setDetailRecipe] = useState(null);

  const sorted = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    const filtered = trimmedQuery
      ? recipes.filter(r =>
        (r.name || '').toLowerCase().includes(trimmedQuery) ||
        (r.ingredients || '').toLowerCase().includes(trimmedQuery)
      )
      : recipes;
    return [...filtered].sort((a, b) => {
      if (Boolean(a.isFavourite) !== Boolean(b.isFavourite)) return a.isFavourite ? -1 : 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [recipes, query]);
  const Search = getRecipeComponent('Search');
  const ChefHat = getRecipeComponent('ChefHat');
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Recipes</h2>
          <p className="mt-1 text-sm text-[#000000]">A gallery of shared culinary inspirations.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#000000]">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes..."
            className="w-full rounded-xl border border-[#E1D8D4] bg-white py-2.5 pl-10 pr-4 text-sm text-[#000000] placeholder-[#000000] outline-none transition focus:border-[#E63B2E]"
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        query ? (
          <EmptyState
            title="No recipes match"
            message="Try another name or ingredient."
            icon={ChefHat}
            compact
          />
        ) : (
          <EmptyState
            title="No recipes yet"
            message="Save a shared favorite or something new to cook."
            actionLabel="Add recipe"
            icon={ChefHat}
            onAddClick={onAddClick}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={onDeleteRecipe}
              onEdit={onEditRecipe}
              onToggleFavourite={onToggleFavouriteRecipe}
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

Object.assign(window, { RecipeCard, RecipeDetailModal, RecipesView });
