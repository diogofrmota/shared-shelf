const React = window.React;
const { useState, useEffect, useRef } = React;

// ============================================================================
// DATES VIEW COMPONENT
// ============================================================================

const getDateCategoryLabel = (value) => {
  const found = DATE_CATEGORIES.find(c => c.value === value);
  return found ? found.label : 'Other';
};

const DatesLeafletMap = ({ places, focusedId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    if (typeof window.L === 'undefined') { console.warn('Leaflet not loaded'); return; }

    const L = window.L;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([38.7223, -9.1393], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      setMapReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        markersRef.current.clear();
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;

    layerGroup.clearLayers();
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let hasMarkers = false;

    places.forEach(place => {
      if (place.lat != null && place.lng != null) {
        const latLng = L.latLng(place.lat, place.lng);
        bounds.extend(latLng);
        hasMarkers = true;
        const popupContent = `
          <div style="min-width:180px;">
            <strong>${place.name}</strong><br/>
            <span style="text-transform:capitalize;">${getDateCategoryLabel(place.category)}</span><br/>
            ${place.address ? `<span>${place.address}</span><br/>` : ''}
            ${place.link ? `<a href="${place.link}" target="_blank" rel="noreferrer noopener" style="color:#c4b5fd;">Open link</a>` : ''}
          </div>
        `;
        const marker = L.marker(latLng).bindPopup(popupContent).addTo(layerGroup);
        markersRef.current.set(place.id, marker);
      }
    });

    if (hasMarkers) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }, [places, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !focusedId) return;
    const marker = markersRef.current.get(focusedId);
    if (marker) {
      mapInstanceRef.current.setView(marker.getLatLng(), 15);
      marker.openPopup();
    }
  }, [focusedId, mapReady]);

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl overflow-hidden mb-6" style={{ zIndex: 1 }}>
      <div ref={mapRef} className="w-full h-[320px] sm:h-[420px] bg-slate-900" style={{ zIndex: 1 }} />
      <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-700">© OpenStreetMap contributors</div>
    </div>
  );
};

const NominatimAddressSearch = ({ onSelect, placeholder = "Search for an address..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }

    const fetchPlaces = debounce(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nominatim?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowResults(true);
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
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
      />
      {loading && (
        <div className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg p-2 mt-1 w-full text-slate-400 text-sm">Searching...</div>
      )}
      {showResults && results.length > 0 && (
        <ul className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-60 overflow-auto w-full shadow-lg">
          {results.map((place) => (
            <li
              key={place.place_id}
              className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm border-b border-slate-700 last:border-b-0 transition-colors"
              onClick={() => {
                onSelect({ lat: parseFloat(place.lat), lng: parseFloat(place.lon), displayName: place.display_name, address: place.display_name });
                setQuery('');
                setResults([]);
                setShowResults(false);
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

const DateCard = ({ place, onDelete, onFocus, onToggleFavourite, isFocused, onUpdateDate }) => {
  const photoInputRef = useRef(null);
  const categoryStyle = DATE_CATEGORY_STYLES[place.category] || DATE_CATEGORY_STYLES.other;
  const mapsLink = (place.lat != null && place.lng != null)
    ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}&zoom=15`
    : place.address
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(place.address)}`
      : null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        onUpdateDate?.(place.id, { photo: canvas.toDataURL('image/jpeg', 0.75) });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const StarRating = () => (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onUpdateDate?.(place.id, { starRating: place.starRating === n ? 0 : n })}
          className={`text-base transition-colors ${n <= (place.starRating || 0) ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-300'}`}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );

  return (
    <div
      className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition-colors cursor-pointer group ${isFocused ? 'border-purple-500 shadow-lg shadow-purple-900/30' : 'border-slate-700 hover:border-purple-500/50'}`}
      onClick={() => onFocus(place.id)}
    >
      {place.photo ? (
        <div className="relative w-full h-36 overflow-hidden bg-slate-800">
          <img src={place.photo} alt={place.name} className="w-full h-full object-cover" />
          <button
            onClick={e => { e.stopPropagation(); onUpdateDate?.(place.id, { photo: null }); }}
            className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove photo"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); photoInputRef.current?.click(); }}
          className="w-full h-10 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors border-b border-slate-800"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Add photo
        </button>
      )}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-lg font-bold text-white truncate">{place.name}</h4>
              {place.isFavourite && <Star size={16} filled className="text-yellow-300 shrink-0" />}
              {place.beenThere && <span className="text-xs text-emerald-400 font-medium">✓ Been there</span>}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${categoryStyle}`}>
                {getDateCategoryLabel(place.category)}
              </span>
              {place.lat != null && place.lng != null && (
                <span className="inline-flex items-center gap-1 text-xs text-purple-300">
                  <MapPin size={12} /> pinned
                </span>
              )}
            </div>
            <div className="mt-2"><StarRating /></div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onUpdateDate?.(place.id, { beenThere: !place.beenThere }); }}
              className={`p-2 rounded-lg transition-colors text-sm ${place.beenThere ? 'text-emerald-400 hover:bg-slate-700/50' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50'}`}
              aria-label={place.beenThere ? 'Mark as not visited' : 'Mark as visited'}
              title={place.beenThere ? 'Been there' : 'Mark as visited'}
            >✓</button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavourite(place.id); }}
              className={`p-2 rounded-lg transition-colors ${place.isFavourite ? 'text-yellow-300 hover:bg-slate-700/50' : 'text-slate-400 hover:text-yellow-300 hover:bg-slate-700/50'}`}
              aria-label={place.isFavourite ? 'Unmark favourite' : 'Mark favourite'}
            >
              <Star size={16} filled={place.isFavourite} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(place.id); }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Delete place"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>

        {place.address && <p className="text-sm text-slate-300 mt-2">{place.address}</p>}
        {place.notes && <p className="text-sm text-slate-400 mt-2 whitespace-pre-wrap">{place.notes}</p>}

        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {place.link && (
            <a href={place.link} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors break-all">
              <LinkIcon size={14} /> Link
            </a>
          )}
          {mapsLink && (
            <a href={mapsLink} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-sm text-purple-300 hover:text-purple-200 transition-colors">
              <MapPin size={14} /> Open in OpenStreetMap
            </a>
          )}
          {place.photo && (
            <button onClick={e => { e.stopPropagation(); photoInputRef.current?.click(); }} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Change photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DatesView = ({ places, onDeletePlace, onToggleFavourite, onUpdateDate }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [onlyBeenThere, setOnlyBeenThere] = useState(false);
  const [focusedId, setFocusedId] = useState(null);

  const filtered = places.filter(p => {
    if (onlyFavourites && !p.isFavourite) return false;
    if (onlyBeenThere && !p.beenThere) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if ((b.isFavourite ? 1 : 0) !== (a.isFavourite ? 1 : 0)) return (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return (
    <div>
      <DatesLeafletMap places={filtered} focusedId={focusedId} />

      <FilterBar label="Filter:">
        <FilterButton label="All" isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
        {DATE_CATEGORIES.map(c => (
          <FilterButton key={c.value} label={c.label} isActive={categoryFilter === c.value} onClick={() => setCategoryFilter(c.value)} />
        ))}
        <FilterButton label="★ Favourites" isActive={onlyFavourites} onClick={() => setOnlyFavourites(v => !v)} />
        <FilterButton label="✓ Been There" isActive={onlyBeenThere} onClick={() => setOnlyBeenThere(v => !v)} />
      </FilterBar>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
          {places.length === 0
            ? 'No places yet. Add a restaurant, bar, coffee spot, or brunch place above!'
            : 'No places match the current filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(place => (
            <DateCard
              key={place.id}
              place={place}
              isFocused={focusedId === place.id}
              onDelete={onDeletePlace}
              onFocus={setFocusedId}
              onToggleFavourite={onToggleFavourite}
              onUpdateDate={onUpdateDate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { DatesView });
