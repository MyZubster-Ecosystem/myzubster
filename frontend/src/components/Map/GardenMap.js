import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker default
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icona personalizzata per gli orti
const gardenIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Icona verde per evidenziare
const gardenIconActive = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Componente per centrare la mappa
const MapController = ({ gardens, centerOn }) => {
  const map = useMap();

  useEffect(() => {
    if (centerOn && centerOn.lat && centerOn.lng) {
      map.setView([centerOn.lat, centerOn.lng], 13);
      return;
    }

    if (gardens && gardens.length > 0) {
      const bounds = gardens
        .filter((g) => g.gps && g.gps.lat && g.gps.lng)
        .map((g) => [g.gps.lat, g.gps.lng]);

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, gardens, centerOn]);

  return null;
};

const GardenMap = ({ gardens = [], onGardenClick, centerOn }) => {
  const handleMarkerClick = (garden) => {
    if (onGardenClick) onGardenClick(garden);
  };

  // Mappa centrata al centro della ricerca o globale
  const defaultCenter = centerOn && centerOn.lat && centerOn.lng
    ? [centerOn.lat, centerOn.lng]
    : [41.9, 12.5]; // Italia
  const defaultZoom = centerOn ? 13 : 5;

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController gardens={gardens} centerOn={centerOn} />

        {gardens.map((garden) => {
          if (!garden.gps || !garden.gps.lat || !garden.gps.lng) return null;

          const isActive = garden.status === 'active';

          return (
            <Marker
              key={garden._id || garden.id}
              position={[garden.gps.lat, garden.gps.lng]}
              icon={isActive ? gardenIconActive : gardenIcon}
              eventHandlers={{
                click: () => handleMarkerClick(garden),
              }}
            >
              <Popup>
                <div style={{ maxWidth: '220px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>
                    🌱 {garden.name}
                  </h3>
                  {garden.address && (
                    <p style={{ margin: '4px 0', fontSize: '13px' }}>
                      📍 {garden.address}
                    </p>
                  )}
                  {garden.description && (
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                      {garden.description.substring(0, 120)}
                    </p>
                  )}
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>
                    <strong>Stato:</strong>{' '}
                    <span style={{
                      color: garden.status === 'active' ? 'green' :
                             garden.status === 'pending' ? 'orange' : 'red',
                    }}>
                      {garden.status}
                    </span>
                    {' | '}
                    <strong>Dimensione:</strong> {garden.size}
                  </p>
                  {garden.geocoding && garden.geocoding.displayName && (
                    <p style={{ margin: '4px 0', fontSize: '11px', color: '#999' }}>
                      OSM: {garden.geocoding.displayName.substring(0, 80)}
                    </p>
                  )}
                  <button
                    onClick={() => window.open(`/gardens/${garden._id || garden.id}`, '_blank')}
                    style={{
                      marginTop: '8px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                    }}
                  >
                    Dettagli
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default GardenMap;
