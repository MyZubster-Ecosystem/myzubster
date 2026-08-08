import React, { useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
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

const userIcon = L.divIcon({
  className: 'myzubster-user-location',
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px rgba(37,99,235,0.35);"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const searchIcon = L.divIcon({
  className: 'myzubster-search-center',
  html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 0 0 2px rgba(245,158,11,0.35);"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const getPoint = (plant) => {
  const source = plant.gps || plant.coordinates || {};
  const lat = Number(source.lat);
  const lng = Number(source.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const getCenterPoint = (point) => {
  if (!point) return null;

  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
};

// Componente per centrare la mappa
const MapController = ({ plants, searchCenter, userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    const bounds = (plants || [])
      .map(getPoint)
      .filter(Boolean)
      .map((point) => [point.lat, point.lng]);
    const center = getCenterPoint(searchCenter) || getCenterPoint(userLocation);

    if (center) {
      bounds.push([center.lat, center.lng]);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      return;
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], center ? 13 : 8);
    }
  }, [map, plants, searchCenter, userLocation]);
  
  return null;
};

const PlantMap = ({
  plants = [],
  onPlantClick,
  searchCenter,
  searchRadiusKm,
  userLocation,
}) => {
  const center = getCenterPoint(searchCenter);
  const userPoint = getCenterPoint(userLocation);
  const radiusMeters = Number(searchRadiusKm) > 0 ? Number(searchRadiusKm) * 1000 : 0;

  const handleMarkerClick = (plant) => {
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
        
        <MapController plants={plants} searchCenter={center} userLocation={userPoint} />

        {center && radiusMeters > 0 && (
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#fbbf24',
              fillOpacity: 0.12,
              weight: 2,
            }}
          />
        )}

        {center && (
          <Marker position={[center.lat, center.lng]} icon={searchIcon} zIndexOffset={800}>
            <Popup>
              <div>
                <strong>Search center</strong>
                <p style={{ margin: '4px 0' }}>
                  {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {userPoint && (
          <Marker position={[userPoint.lat, userPoint.lng]} icon={userIcon} zIndexOffset={900}>
            <Popup>
              <div>
                <strong>Your location</strong>
                <p style={{ margin: '4px 0' }}>
                  {userPoint.lat.toFixed(5)}, {userPoint.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {plants.map((plant) => {
          const point = getPoint(plant);
          if (!point) return null;
          
          return (
            <Marker
              key={plant._id || plant.id}
              position={[point.lat, point.lng]}
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
                  {plant.locationLabel && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Area:</strong> {plant.locationLabel}
                    </p>
                  )}
                  {plant.address && (
                    <p style={{ margin: '4px 0' }}>
                      <strong>Address:</strong> {plant.address}
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
