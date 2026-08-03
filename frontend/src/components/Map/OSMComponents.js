// OpenStreetMap React Components
// Provides map views with POI, routing, and boundaries

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Map Container Component ──
export const MapContainer = ({ center = [51.505, -0.09], zoom = 13, children, onMapReady }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Dynamic import for Leaflet
    import('leaflet').then((L) => {
      const m = L.map(mapRef.current).setView(center, zoom);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(m);

      setMap(m);
      if (onMapReady) onMapReady(m);
    });

    return () => {
      if (map) map.remove();
    };
  }, []);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '400px' }}>
      {map && children}
    </div>
  );
};

// ── POI Marker Component ──
export const POIMarker = ({ position, popup, icon, onClick }) => {
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (!position) return;

    import('leaflet').then((L) => {
      const options = {};
      if (icon) {
        options.icon = L.divIcon({
          className: 'poi-marker',
          html: `<div style="background: ${icon.color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">${icon.emoji}</div>`,
        });
      }

      const m = L.marker(position, options);
      if (popup) m.bindPopup(popup);
      if (onClick) m.on('click', onClick);

      setMarker(m);
    });

    return () => {
      if (marker) marker.remove();
    };
  }, [position]);

  return null;
};

// ── Route Polyline Component ──
export const RoutePolyline = ({ coordinates, color = '#3388ff', weight = 4 }) => {
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;

    import('leaflet').then((L) => {
      const p = L.polyline(coordinates, { color, weight }).addTo(L.map);
      setPolyline(p);
    });

    return () => {
      if (polyline) polyline.remove();
    };
  }, [coordinates]);

  return null;
};

// ── Garden Boundary Component ──
export const GardenBoundary = ({ geojson, style = {} }) => {
  const [layer, setLayer] = useState(null);

  useEffect(() => {
    if (!geojson) return;

    import('leaflet').then((L) => {
      const defaultStyle = {
        color: '#22863a',
        weight: 2,
        opacity: 0.7,
        fillColor: '#22863a',
        fillOpacity: 0.1,
        ...style,
      };

      const l = L.geoJSON(geojson, { style: defaultStyle }).addTo(L.map);
      setLayer(l);
    });

    return () => {
      if (layer) layer.remove();
    };
  }, [geojson]);

  return null;
};

// ── Search Box Component ──
export const SearchBox = ({ onSearch, placeholder = 'Search gardens...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/osm/geocode?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setResults(data.results || []);
      if (onSearch) onSearch(data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-box" style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        placeholder={placeholder}
        style={{ padding: '8px 12px', width: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{ marginLeft: '8px', padding: '8px 16px' }}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {results.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          width: '300px',
          background: 'white', 
          border: '1px solid #ccc',
          borderRadius: '4px',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => {
                setQuery(r.name);
                setResults([]);
                if (onSearch) onSearch([r], true);
              }}
              style={{ 
                padding: '8px 12px', 
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
              }}
            >
              <strong>{r.name}</strong>
              <br />
              <small style={{ color: '#666' }}>{r.displayName}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Route Planner Component ──
export const RoutePlanner = ({ onRoute }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [profile, setProfile] = useState('foot');
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  const planRoute = async () => {
    if (!from || !to) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/osm/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&profile=${profile}`
      );
      const data = await response.json();
      setRoute(data);
      if (onRoute) onRoute(data);
    } catch (error) {
      console.error('Route error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="route-planner" style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>Route Planner</h3>
      
      <div style={{ marginBottom: '8px' }}>
        <input
          type="text"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From (lat,lon or address)"
          style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
        />
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To (lat,lon or address)"
          style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={{ marginRight: '16px' }}>
          <input type="radio" name="profile" value="foot" checked={profile === 'foot'} onChange={() => setProfile('foot')} />
          🚶 Walking
        </label>
        <label style={{ marginRight: '16px' }}>
          <input type="radio" name="profile" value="bike" checked={profile === 'bike'} onChange={() => setProfile('bike')} />
          🚴 Cycling
        </label>
        <label>
          <input type="radio" name="profile" value="car" checked={profile === 'car'} onChange={() => setProfile('car')} />
          🚗 Driving
        </label>
      </div>

      <button onClick={planRoute} disabled={loading} style={{ width: '100%', padding: '10px' }}>
        {loading ? 'Planning...' : 'Get Route'}
      </button>

      {route && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'white', borderRadius: '4px' }}>
          <p><strong>Distance:</strong> {route.distanceKm} km</p>
          <p><strong>Duration:</strong> {route.durationMin} min</p>
        </div>
      )}
    </div>
  );
};

// ── POI Layer Component ──
export const POILayer = ({ bounds, category, tag }) => {
  const [pois, setPois] = useState([]);

  useEffect(() => {
    if (!bounds) return;

    const fetchPOIs = async () => {
      try {
        const [south, west, north, east] = bounds;
        const response = await fetch(
          `/api/osm/poi?category=${category}&tag=${tag}&south=${south}&west=${west}&north=${north}&east=${east}`
        );
        const data = await response.json();
        setPois(data.pois || []);
      } catch (error) {
        console.error('POI fetch error:', error);
      }
    };

    fetchPOIs();
  }, [bounds, category, tag]);

  return (
    <>
      {pois.map((poi, i) => (
        <POIMarker
          key={i}
          position={[poi.geometry.coordinates[1], poi.geometry.coordinates[0]]}
          popup={poi.properties.name || 'Unnamed'}
          icon={{ emoji: '🏪', color: '#ff6b6b' }}
        />
      ))}
    </>
  );
};

export default {
  MapContainer,
  POIMarker,
  RoutePolyline,
  GardenBoundary,
  SearchBox,
  RoutePlanner,
  POILayer,
};
