const React = window.React;
const { useState, useMemo } = React;

// ============================================================================
// RECIPES VIEW COMPONENT
// ============================================================================

const getRecipeComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

const getRecipeIngredients = (ingredients) => {
  if (Array.isArray(ingredients)) return ingredients.map(item => String(item || '').trim()).filter(Boolean);
  return String(ingredients || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
};

const RecipeCard = ({ recipe, onDelete, onEdit }) => {
  const safeLink = window.safeExternalUrl?.(recipe.link) || '';
  const LinkIcon = getRecipeComponent('LinkIcon');
  const Trash = getRecipeComponent('Trash');
  const Star = getRecipeComponent('Star');
  const PencilIcon = getRecipeComponent('PencilIcon');
  const ingredients = getRecipeIngredients(recipe.ingredients);

  return (
    <article className="rounded-xl border border-[#E1D8D4] bg-white p-4 shadow-sm transition hover:border-[#FFB4A9] hover:shadow-md hover:shadow-[#000000]/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold text-[#000000]">
            <span className="break-words">{recipe.name}</span>
            {recipe.isFavourite && (
              <span className="shrink-0 text-[#E63B2E]" aria-label="Favourite" title="Favourite">
                <Star size={16} filled />
              </span>
            )}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(recipe)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
              aria-label={`Edit recipe ${recipe.name}`}
              title="Edit recipe"
            >
              <PencilIcon size={16} aria-hidden="true" />
            </button>
          )}
          <button
            onClick={() => onDelete(recipe.id)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
            aria-label={`Delete recipe ${recipe.name}`}
            title="Delete recipe"
          >
            <Trash size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {ingredients.length > 0 && (
        <p className="mt-1 w-full break-words text-sm leading-relaxed text-[#000000]">
          {ingredients.join(', ')}
        </p>
      )}

      {safeLink && (
        <a
          href={safeLink}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex min-h-[44px] max-w-full items-center gap-1.5 text-sm font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
        >
          <LinkIcon size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">Source</span>
        </a>
      )}
    </article>
  );
};

const RecipesView = ({ recipes, onDeleteRecipe, onEditRecipe, onAddClick }) => {
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    const filtered = trimmedQuery
      ? recipes.filter(r =>
        (r.name || '').toLowerCase().includes(trimmedQuery) ||
        String(r.ingredients || '').toLowerCase().includes(trimmedQuery) ||
        (r.link || '').toLowerCase().includes(trimmedQuery)
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

  const Plus = getRecipeComponent('Plus');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Our Recipes</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
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
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
          >
            <Plus size={16} />
            Add recipe
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        query ? (
          <EmptyState
            title="No recipes match"
            message="Try another name, ingredient, or source."
            icon={ChefHat}
            compact
          />
        ) : (
          <EmptyState
            title="No recipes yet"
            message="Save a shared favorite or something new to cook."
            icon={ChefHat}
          />
        )
      ) : (
        <div className="space-y-3">
          {sorted.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onDelete={onDeleteRecipe}
              onEdit={onEditRecipe}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { RecipeCard, RecipesView });
