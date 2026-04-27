const { useState, useEffect } = window.React;
import { LeafletMap } from './LeafletMap.jsx';
import { NominatimSearch } from './NominatimSearch.jsx';

export const DatesSection = ({ locations = [], onAddLocation }) => {
  const [dateLocations, setDateLocations] = useState(locations);
  // Default map center set to Lisbon
  const [mapCenter, setMapCenter] = useState({ lat: 38.7223, lng: -9.1393, zoom: 13 });
  
  // Keep internal state synced when new locations are passed down via props
  useEffect(() => {
    setDateLocations(locations);
  }, [locations]);

  const handleSelectLocation = (place) => {
    const newLocation = {
      id: Date.now(),
      name: place.displayName.split(',')[0],
      lat: place.lat,
      lng: place.lng,
      fullAddress: place.displayName
    };
    setDateLocations([...dateLocations, newLocation]);
    
    // Center map on new location
    if (place.lat && place.lng) {
      setMapCenter({ lat: place.lat, lng: place.lng, zoom: 15 });
    }
    
    onAddLocation?.(newLocation);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Locations</h2>
      
      <NominatimSearch onSelect={handleSelectLocation} />
      
      <LeafletMap
        center={mapCenter}
        markers={dateLocations.map(loc => ({
          lat: loc.lat,
          lng: loc.lng,
          popup: loc.name
        }))}
        height="500px"
      />
      
      {/* List of saved locations */}
      <div className="space-y-2">
        {dateLocations.map(loc => {
          const lat = Number(loc.lat);
          const lng = Number(loc.lng);
          const mapUrl = Number.isFinite(lat) && Number.isFinite(lng)
            ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
            : '';
          return (
          <div key={loc.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
            <div>
              <span className="text-white">{loc.name}</span>
              {loc.fullAddress && (
                <p className="text-xs text-slate-400 mt-1">{loc.fullAddress}</p>
              )}
            </div>
            {mapUrl && <a 
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              View Map ↗
            </a>}
          </div>
          );
        })}
      </div>
    </div>
  );
};
