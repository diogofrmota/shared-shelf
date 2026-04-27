import { debounce } from '../utils/helpers'; // reuse your existing debounce

export const NominatimSearch = ({ onSelect }) => {
  const React = window.React;
  const { useState, useEffect } = React;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const fetchPlaces = debounce(async () => {
      setLoading(true);
      try {
        // Call your Vercel API endpoint instead of Nominatim directly
        const token = window.getAuthToken?.();
        const res = await fetch(`/api/nominatim?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Nominatim search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    fetchPlaces();
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a place..."
        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
      />
      {loading && (
        <div className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 w-full text-slate-400">
          Searching...
        </div>
      )}
      {results.length > 0 && (
        <ul className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-60 overflow-auto w-full shadow-lg">
          {results.map((place) => (
            <li
              key={place.place_id}
              className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm border-b border-slate-700 last:border-b-0 transition-colors"
              onClick={() => {
                onSelect({
                  lat: parseFloat(place.lat),
                  lng: parseFloat(place.lon),
                  displayName: place.display_name,
                  address: place.display_name
                });
                setQuery('');
                setResults([]);
              }}
            >
              {place.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NominatimSearch;
