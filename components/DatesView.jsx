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
  restaurant: 'bg-[#FFDAD4] text-[#000000] border-[#FFB4A9]',
  bar: 'bg-[#FFDAD4] text-[#000000] border-[#FFB4A9]',
  brunch: 'bg-[#FFDAD4] text-[#000000] border-[#FFB4A9]',
  viewpoint: 'bg-[#FFDAD4] text-[#000000] border-[#FFB4A9]',
  other: 'bg-[#FFDAD4] text-[#000000] border-[#FFB4A9]',
};

const DATE_STATUS_OPTIONS = window.DATE_STATUS_OPTIONS || [
  { value: 'want-to-go', label: 'Want to go' },
  { value: 'visited', label: 'Visited' }
];

const getDateComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

// ============================================================================
// DATES VIEW COMPONENT
// ============================================================================

const getDateCategoryLabel = (value) => {
  const found = DATE_CATEGORIES.find(c => c.value === value);
  return found ? found.label : 'Other';
};

const getDateStatusLabel = (value) => {
  const found = DATE_STATUS_OPTIONS.find(s => s.value === value);
  return found ? found.label : 'Want to go';
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

    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

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
        const safeStatus = window.escapeHtml?.(getDateStatusLabel(place.status)) || 'Want to go';
        const safeAddress = window.escapeHtml?.(place.address || '') || '';
        const safeLink = window.safeExternalUrl?.(place.link) || '';
        const popupContent = `
          <div style="min-width:180px;">
            <strong>${safeName}</strong><br/>
            <span style="text-transform:capitalize;">${safeCategory}</span> · <span>${safeStatus}</span><br/>
            ${safeAddress ? `<span>${safeAddress}</span><br/>` : ''}
            ${safeLink ? `<a href="${safeLink}" target="_blank" rel="noreferrer noopener" style="color:#E63B2E;">Open link</a>` : ''}
          </div>
        `;
        const marker = L.marker(latLng, { icon: customIcon }).bindPopup(popupContent).addTo(layerGroup);
        markersRef.current.set(place.id, marker);
      }
    });

    if (hasMarkers) {
      setTimeout(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      }, 150);
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
          <div className="flex h-full items-center justify-center text-sm font-medium text-[#000000]">
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
      <div className="border-t border-[#E1D8D4] px-4 py-2 text-xs text-[#000000]">© OpenStreetMap contributors</div>
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
        >{'★'}</button>
      ))}
    </div>
  );
};

const DateCard = ({ place, onDelete, onFocus, onToggleFavourite, isFocused, onUpdateDate }) => {
  const Star = getDateComponent('Star');
  const Trash = getDateComponent('Trash');
  const LinkIcon = getDateComponent('LinkIcon');
  const categoryStyle = DATE_CATEGORY_STYLES[place.category] || DATE_CATEGORY_STYLES.other;
  const safeLink = window.safeExternalUrl?.(place.link) || '';
  const hasCoordinates = hasLocationCoordinates(place);
  const hasUnresolvedAddress = Boolean(place.address && !hasCoordinates);
  const isVisited = place.status === 'visited';

  const cycleStatus = () => {
    const nextStatus = isVisited ? 'want-to-go' : 'visited';
    onUpdateDate?.(place.id, { status: nextStatus, beenThere: nextStatus === 'visited' });
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
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="min-w-0 flex-1 truncate text-base font-bold text-[#000000]" title={place.name}>{place.name}</h4>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavourite(place.id); }}
                className={`flex h-11 w-11 items-center justify-center rounded transition ${place.isFavourite ? 'text-[#FFB300]' : 'text-[#000000] hover:text-[#FFB300]'}`}
                aria-label={place.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Star size={16} filled={place.isFavourite} />
              </button>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold capitalize ${categoryStyle}`}>
                {getDateCategoryLabel(place.category)}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); cycleStatus(); }}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold transition ${
                  isVisited
                    ? 'border-[#91D7BF] bg-[#E1F5EE] text-[#0E5A40] hover:bg-[#CCEFE0]'
                    : 'border-[#FFB4A9] bg-[#FFDAD4] text-[#A9372C] hover:bg-[#FFC7BD]'
                }`}
                aria-label={isVisited ? 'Mark as want to go' : 'Mark as visited'}
                title="Toggle status"
              >
                {isVisited ? '✅ Visited' : '★ Want to go'}
              </button>
            </div>

          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(place.id); }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
              aria-label="Delete date"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>

        {place.address && <p className="mt-2 line-clamp-2 break-words text-sm text-[#000000]" title={place.address}>{place.address}</p>}
        {hasUnresolvedAddress && (
          <p className="mt-2 rounded-lg border border-[#FFB4A9] bg-[#FFF8F5] px-3 py-2 text-xs font-semibold text-[#A9372C]">
            {place.geocodingStatus === 'failed'
              ? 'Address lookup failed. It may not appear on the map.'
              : 'Address not found on the map.'}
          </p>
        )}
        {place.notes && <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-[#000000]" title={place.notes}>{place.notes}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {safeLink && (
            <a href={safeLink} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#E63B2E] transition hover:text-[#A9372C]">
              <LinkIcon size={14} /> Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const DatesView = ({ places, onDeletePlace, onToggleFavourite, onUpdateDate, onAddClick }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyFavourites, setOnlyFavourites] = useState(false);
  const [focusedId, setFocusedId] = useState(null);

  const filtered = useMemo(() => places.filter(p => {
    if (onlyFavourites && !p.isFavourite) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  }), [places, onlyFavourites, categoryFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if ((b.isFavourite ? 1 : 0) !== (a.isFavourite ? 1 : 0)) return (b.isFavourite ? 1 : 0) - (a.isFavourite ? 1 : 0);
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  }), [filtered]);
  const FilterBar = window.getWindowComponent?.('FilterBar', window.MissingComponent) || window.MissingComponent;
  const FilterButton = window.getWindowComponent?.('FilterButton', window.MissingComponent) || window.MissingComponent;
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;
  const MapPin = getDateComponent('MapPin');

  const Plus = getDateComponent('Plus');

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Locations for Dates</h2>
          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
          >
            <Plus size={16} />
            Add date
          </button>
        </div>
        <p className="mt-1 text-sm text-[#000000]">Restaurants, bars, viewpoints, and places worth saving.</p>
      </div>

      <FilterBar label="Filter:">
        <FilterButton label="All" isActive={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
        {DATE_CATEGORIES.map(c => (
          <FilterButton key={c.value} label={c.label} isActive={categoryFilter === c.value} onClick={() => setCategoryFilter(c.value)} />
        ))}
        <FilterButton label="★ Favourites" isActive={onlyFavourites} onClick={() => setOnlyFavourites(v => !v)} />
      </FilterBar>

      {sorted.length === 0 ? (
        places.length === 0 ? (
          <EmptyState
            title="No dates yet"
            message="Save restaurants, views, and places to try."
            icon={MapPin}
          />
        ) : (
          <EmptyState
            title="No dates match"
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

      <DatesLeafletMap places={filtered} focusedId={focusedId} />
    </div>
  );
};

Object.assign(window, { DatesView });
