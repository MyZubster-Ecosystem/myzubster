import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per i marker di Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icona personalizzata per le piante
const plantIcon = new L.Icon({
  iconUrl: '/plant-icon.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Componente per centrare la mappa
const MapController = ({ plants }) => {
  const map = useMap();
  
  useEffect(() => {
    if (plants && plants.length > 0) {
      const bounds = plants
        .filter(p => p.gps && p.gps.lat && p.gps.lng)
        .map(p => [p.gps.lat, p.gps.lng]);
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, plants]);
  
  return null;
};

const PlantMap = ({ plants = [], onPlantClick }) => {
  const [selectedPlant, setSelectedPlant] = useState(null);

  const handleMarkerClick = (plant) => {
    setSelectedPlant(plant);
    if (onPlantClick) onPlantClick(plant);
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController plants={plants} />
        
        {plants.map((plant) => {
          if (!plant.gps || !plant.gps.lat || !plant.gps.lng) return null;
          
          return (
            <Marker
              key={plant._id || plant.id}
              position={[plant.gps.lat, plant.gps.lng]}
              icon={plantIcon}
              eventHandlers={{
                click: () => handleMarkerClick(plant)
              }}
            >
              <Popup>
                <div style={{ maxWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>
                    {plant.commonName || plant.species || 'Unknown Plant'}
                  </h3>
                  <p style={{ margin: '4px 0' }}>
                    <strong>Species:</strong> {plant.species || 'Unknown'}
                  </p>
                  {plant.commonName && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Common Name:</strong> {plant.commonName}
                    </p>
                  )}
                  {plant.age && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Age:</strong> {plant.age} years
                    </p>
                  )}
                  {plant.size && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Size:</strong> {plant.size}
                    </p>
                  )}
                  <p style={{ margin: '4px 0' }}>
                    <strong>Status:</strong>{' '}
                    <span style={{
                      color: plant.status === 'verified' ? 'green' : 
                              plant.status === 'pending' ? 'orange' : 'red'
                    }}>
                      {plant.status || 'pending'}
                    </span>
                  </p>
                  {plant.photos && plant.photos.length > 0 && (
                    <img 
                      src={plant.photos[0]} 
                      alt={plant.species}
                      style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  )}
                  <button 
                    onClick={() => window.open(`/plants/${plant._id}`, '_blank')}
                    style={{ marginTop: '8px', padding: '4px 12px', cursor: 'pointer' }}
                  >
                    View Details
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

export default PlantMap;
