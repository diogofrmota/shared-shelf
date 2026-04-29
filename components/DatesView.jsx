const React = window.React;
const { useState, useEffect, useMemo, useRef } = React;

const DATE_CATEGORIES = window.DATE_CATEGORIES || [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'brunch', label: 'Brunch' },
  { value: 'viewpoint', label: 'Viewpoint' },
  { value: 'other', label: 'Other' },
];

const DATE_CATEGORY_STYLES = window.DATE_CATEGORY_STYLES || {
  restaurant: 'bg-[#FFDAD4] text-[#410001] border-[#FFB4A9]',
  bar: 'bg-[#FFDAD4] text-[#410001] border-[#FFB4A9]',
  brunch: 'bg-[#FFDAD4] text-[#410001] border-[#FFB4A9]',
  viewpoint: 'bg-[#FFDAD4] text-[#410001] border-[#FFB4A9]',
  other: 'bg-[#FFDAD4] text-[#410001] border-[#FFB4A9]',
};

const getDateComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

// ============================================================================
// DATES VIEW COMPONENT
// ============================================================================

const getDateCategoryLabel = (value) => {
  const found = DATE_CATEGORIES.find(c => c.value === value);
  return found ? found.label : 'Other';
};

const hasLocationCoordinates = (place) => {
  const lat = Number(place?.lat);
  const lng = Number(place?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const DatesLeafletMap = ({ places, focusedId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [leafletReady, setLeafletReady] = useState(typeof window.L !== 'undefined');
  const [mapError, setMapError] = useState('');
  const unresolvedCount = places.filter(place => place.address && !hasLocationCoordinates(place)).length;
  const markerCount = places.filter(hasLocationCoordinates).length;

  useEffect(() => {
    if (leafletReady) return;
    let cancelled = false;

    const loadLeaflet = window.loadLeafletAssets || (() => Promise.resolve(window.L));
    loadLeaflet()
      .then((L) => {
        if (cancelled) return;
        if (L) setLeafletReady(true);
        else setMapError('Map unavailable');
      })
      .catch((error) => {
        console.error('Leaflet loading error:', error);
        if (!cancelled) setMapError('Map unavailable');
      });

    return () => { cancelled = true; };
  }, [leafletReady]);

  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;

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
  }, [leafletReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          mapInstanceRef.current.invalidateSize();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [mapReady]);

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
      if (hasLocationCoordinates(place)) {
        const lat = Number(place.lat);
        const lng = Number(place.lng);
        const latLng = L.latLng(lat, lng);
        bounds.extend(latLng);
        hasMarkers = true;
        const safeName = window.escapeHtml?.(place.name || '') || '';
        const safeCategory = window.escapeHtml?.(getDateCategoryLabel(place.category)) || 'Other';
        const safeAddress = window.escapeHtml?.(place.address || '') || '';
        const safeLink = window.safeExternalUrl?.(place.link) || '';
        const popupContent = `
          <div style="min-width:180px;">
            <strong>${safeName}</strong><br/>
            <span style="text-transform:capitalize;">${safeCategory}</span><br/>
            ${safeAddress ? `<span>${safeAddress}</span><br/>` : ''}
            ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noreferrer noopener" style="color:#E63B2E;">Open link</a>` : ''}
          </div>
        `;
        const marker = L.marker(latLng).bindPopup(popupContent).addTo(layerGroup);
        markersRef.current.set(place.id, marker);
      }
    });

    if (hasMarkers) {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }
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
    <div className="mb-5 overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white shadow-sm" style={{ zIndex: 1 }}>
      <div ref={mapRef} className="h-[320px] w-full bg-[#FFDAD4] sm:h-[420px]" style={{ zIndex: 1 }}>
        {!mapReady && (
          <div className="flex h-full items-center justify-center text-sm font-medium text-[#534340]">
            {mapError || 'Loading map...'}
          </div>
        )}
      </div>
      {unresolvedCount > 0 && (
        <div className="border-t border-[#E1D8D4] bg-[#FFF8F5] px-4 py-2 text-xs font-semibold text-[#A9372C]">
          {markerCount > 0
            ? `${unresolvedCount} saved address${unresolvedCount === 1 ? '' : 'es'} could not be placed on the map.`
            : 'No saved addresses could be placed on the map yet.'}
        </div>
      )}
      <div className="border-t border-[#E1D8D4] px-4 py-2 text-xs text-[#857370]">© OpenStreetMap contributors</div>
    </div>
  );
};

const StableStarRating = ({ rating = 0, onRate }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(rating === n ? 0 : n)}
          className={`flex h-11 w-11 items-center justify-center text-base transition ${n <= (hover || rating) ? 'text-[#FFB300]' : 'text-[#D8C2BE] hover:text-[#FBD08A]'}`}
          aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
        >{'\u2605'}</button>
      ))}
    </div>
  );
};

const DateCard = ({ place, onDelete, onFocus, onToggleFavourite, isFocused, onUpdateDate }) => {
  const photoInputRef = useRef(null);
  const Star = getDateComponent('Star');
  const Trash = getDateComponent('Trash');
  const MapPin = getDateComponent('MapPin');
  const LinkIcon = getDateComponent('LinkIcon');
  const categoryStyle = DATE_CATEGORY_STYLES[place.category] || DATE_CATEGORY_STYLES.other;
  const safeLink = window.safeExternalUrl?.(place.link) || '';
  const safePhoto = window.safeImageUrl?.(place.photo) || '';
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  const hasCoordinates = hasLocationCoordinates(place);
  const hasUnresolvedAddress = Boolean(place.address && !hasCoordinates);
  const mapsLink = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`
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

  return (
    <div
      className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        isFocused
          ? 'border-[#E63B2E] shadow-md shadow-[#E63B2E]/15'
          : 'border-[#E1D8D4] hover:border-[#FFB4A9] hover:shadow-md'
      }`}
      onClick={() => onFocus(place.id)}
    >
      {safePhoto ? (
        <div className="relative h-36 w-full overflow-hidden bg-[#FFDAD4]">
          <img src={safePhoto} alt={place.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <button
            onClick={e => { e.stopPropagation(); onUpdateDate?.(place.id, { photo: null }); }}
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#410001] opacity-100 shadow-sm transition sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Remove photo"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); photoInputRef.current?.click(); }}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 border-b border-[#E1D8D4] text-xs font-semibold text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Add photo
        </button>
      )}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="min-w-0 flex-1 truncate text-base font-bold text-[#410001]" title={place.name}>{place.name}</h4>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavourite(place.id); }}
                className={`flex h-11 w-11 items-center justify-center rounded transition ${place.isFavourite ? 'text-[#FFB300]' : 'text-[#857370] hover:text-[#FFB300]'}`}
                aria-label={place.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Star size={16} filled={place.isFavourite} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateDate?.(place.id, { beenThere: !place.beenThere }); }}
                className={`flex h-11 w-11 items-center justify-center rounded text-base transition ${place.beenThere ? 'text-[#2F855A]' : 'text-[#857370] hover:text-[#2F855A]'}`}
                aria-label={place.beenThere ? 'Mark as not visited' : 'Mark as visited'}
                title={place.beenThere ? 'Visited' : 'Mark as visited'}
              >✅</button>
            </div>

            <div className="mt-1.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold capitalize ${categoryStyle}`}>
                {getDateCategoryLabel(place.category)}
              </span>
            </div>

            <div className="mt-2">
              <StableStarRating
                rating={place.starRating || 0}
                onRate={(starRating) => onUpdateDate?.(place.id, { starRating })}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(place.id); }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
              aria-label="Delete place"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>

        {place.address && <p className="mt-2 line-clamp-2 break-words text-sm text-[#534340]" title={place.address}>{place.address}</p>}
        {hasUnresolvedAddress && (
          <p className="mt-2 rounded-lg border border-[#FFB4A9] bg-[#FFF8F5] px-3 py-2 text-xs font-semibold text-[#A9372C]">
            {place.geocodingStatus === 'failed'
              ? 'Address lookup failed. The map link opens a search instead.'
              : 'Address not found on the map. The map link opens a search instead.'}
          </p>
        )}
        {place.notes && <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-[#534340]" title={place.notes}>{place.notes}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {safeLink && (
            <a href={safeLink} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]">
              <LinkIcon size={14} /> Link
            </a>
          )}
          {mapsLink && (
            <a href={mapsLink} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]">
              <MapPin size={14} /> Map
            </a>
          )}
          {safePhoto && (
            <button onClick={e => { e.stopPropagation(); photoInputRef.current?.click(); }} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#534340] transition hover:text-[#410001]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Change photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const DatesView = ({ places, onDeletePlace, onToggleFavourite, onUpdateDate, onAddClick }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [focusedId, setFocusedId] = useState(null);

  const filtered = useMemo(() => places.filter(p => {
    if (onlyFavourites && !p.isFavourite) return false;
    if (onlyVisited && !p.beenThere) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  }), [places, onlyFavourites, onlyVisited, categoryFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if ((b.isFavourite ? 1 : 0) !== (a.isFavourite ? 1 : 0)) return (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  }), [filtered]);
  const FilterBar = window.getWindowComponent?.('FilterBar', window.MissingComponent) || window.MissingComponent;
  const FilterButton = window.getWindowComponent?.('FilterButton', window.MissingComponent) || window.MissingComponent;
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;
  const MapPin = getDateComponent('MapPin');

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-[#410001] sm:text-3xl">Locations</h2>
        <p className="mt-1 text-sm text-[#534340]">Restaurants, bars, viewpoints, and places worth saving.</p>
      </div>

      <DatesLeafletMap places={filtered} focusedId={focusedId} />

      <FilterBar label="Filter:">
        <FilterButton label="All" isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
        {DATE_CATEGORIES.map(c => (
          <FilterButton key={c.value} label={c.label} isActive={categoryFilter === c.value} onClick={() => setCategoryFilter(c.value)} />
        ))}
        <FilterButton label="★ Favourites" isActive={onlyFavourites} onClick={() => setOnlyFavourites(v => !v)} />
        <FilterButton label="✅ Visited" isActive={onlyVisited} onClick={() => setOnlyVisited(v => !v)} />
      </FilterBar>

      {sorted.length === 0 ? (
        places.length === 0 ? (
          <EmptyState
            title="No locations yet"
            message="Save restaurants, views, and places to try."
            actionLabel="Add location"
            icon={MapPin}
            onAddClick={onAddClick}
          />
        ) : (
          <EmptyState
            title="No locations match"
            message="Adjust the filters to see more saved places."
            icon={MapPin}
            compact
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
