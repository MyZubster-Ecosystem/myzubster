import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PlantMap = ({ plants }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && plants && plants.length > 0) {
      const bounds = plants.map(p => [p.gps.lat, p.gps.lng]);
      map.fitBounds(bounds);
    }
  }, [map, plants]);

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: '600px', width: '100%' }}
      ref={setMap}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {plants && plants.map(plant => (
        <Marker key={plant._id} position={[plant.gps.lat, plant.gps.lng]}>
          <Popup>
            <h3>{plant.commonName || plant.species}</h3>
            <p>Species: {plant.species}</p>
            <p>Status: {plant.status}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default PlantMap;
