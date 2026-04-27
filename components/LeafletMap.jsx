import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const LeafletMap = ({ center, markers = [], onMapClick, height = '400px' }) => {
  const { useEffect, useRef } = React;
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Only create map if it doesn't exist
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(
        [center?.lat || 38.7223, center?.lng || -9.1393],
        center?.zoom || 13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);

      if (onMapClick) {
        mapInstance.current.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayer.current = null;
      }
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!markersLayer.current || !mapInstance.current) return;

    markersLayer.current.clearLayers();
    markers.forEach((marker) => {
      const lat = Number(marker.lat);
      const lng = Number(marker.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const m = L.marker([lat, lng]).addTo(markersLayer.current);
        if (marker.popup) m.bindPopup(window.escapeHtml?.(marker.popup) || '');
      }
    });
  }, [markers]);

  // Update view when center changes
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setView(
      [center.lat, center.lng], 
      center.zoom || mapInstance.current.getZoom()
    );
  }, [center]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }} 
      className="rounded-xl overflow-hidden border border-slate-700 bg-slate-800"
    />
  );
};
