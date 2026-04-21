# Coding Guidelines

## Naming

- Components: `PascalCase` — `MediaCard`, `SearchModal`
- Functions and variables: `camelCase` — `handleStatusChange`, `filteredItems`
- Constants: `UPPER_SNAKE_CASE` — `API_KEY`, `STORAGE_CONFIG`

---

## Component structure

```jsx
export const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // side effects
  }, [dependency]);

  const handleEvent = () => {};

  return <div>{/* JSX */}</div>;
};
```

---

## State

Keep state minimal. Derive values from existing state rather than storing duplicates.

```jsx
// good — derive from state
const resultCount = results.length;

// bad — unnecessary duplicate state
const [resultCount, setResultCount] = useState(0);
```

Always include all dependencies in `useEffect`. Clean up timers.

```jsx
useEffect(() => {
  const timer = setTimeout(() => search(), 300);
  return () => clearTimeout(timer);
}, [query]);
```

---

## Error handling

Always `try/catch` async operations. Return a sensible default on error — don't throw to the caller.

```javascript
export const searchMovies = async (query) => {
  try {
    const data = await fetch(...);
    return data;
  } catch (error) {
    console.error('Movie search error:', error);
    return [];
  }
};
```

---

## Tailwind

Mobile-first. Add responsive modifiers in order: default → `sm:` → `md:` → `lg:` → `xl:`.

```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
<div className="p-2 sm:p-3 md:p-4" />
<h1 className="text-lg sm:text-xl md:text-2xl" />
```

State-based classes:

```jsx
<button className={`px-4 py-2 rounded ${
  isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
}`} />
```

---

## Comments

Only comment the **why**, not the what. Skip comments on obvious code.

```javascript
// debounce to avoid hammering the API on every keystroke
const timer = setTimeout(() => search(), 300);
```

---

## Security

- API keys go in environment variables, never in committed code
- Never commit `.env` or `.env.local`
- Don't store sensitive data in localStorage

---

## Commit messages

Format: `type: short description`

Types: `feat`, `fix`, `refactor`, `docs`, `style`

```
feat: add anime search via Jikan API
fix: prevent status dropdown from clipping on card edge
docs: update deployment steps in INSTALLATION.md
```

---

## Pre-push checklist

- [ ] Naming follows conventions above
- [ ] All async operations have `try/catch`
- [ ] New UI uses responsive Tailwind classes
- [ ] No `console.log` left in code
- [ ] No hardcoded secrets or magic strings
