import React, { useEffect, useState } from 'react';
import PlantMap from '../components/Map/PlantMap';
import { getPlants, searchPlantsByArea } from '../api/plants';

const parseCoordinateQuery = (value) => {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const MapPage = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    query: '',
    city: '',
    status: 'verified',
  });
  const [areaQuery, setAreaQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState('10');
  const [searchCenter, setSearchCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [activeAreaLabel, setActiveAreaLabel] = useState('');

  useEffect(() => {
    fetchPlants();
  }, [filters]);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const data = await getPlants(filters);
      setPlants(data.plants || []);
      setSearchCenter(null);
      setActiveAreaLabel('');
      setError(null);
    } catch (err) {
      setError('Failed to load plants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const runAreaSearch = async (criteria, label) => {
    setSearching(true);
    setError(null);

    try {
      const data = await searchPlantsByArea({
        ...criteria,
        radius: radiusKm,
      });

      setPlants(data.plants || []);
      setSearchCenter(data.searchCenter || criteria);
      setActiveAreaLabel(label);
    } catch (err) {
      setError('Failed to search this area');
      console.error(err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleAreaSearch = async (event) => {
    event.preventDefault();

    const query = areaQuery.trim();
    if (!query) {
      fetchPlants();
      return;
    }

    const coordinates = parseCoordinateQuery(query);
    if (coordinates) {
      await runAreaSearch(coordinates, `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
      return;
    }

    await runAreaSearch({ query }, query);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not available in this browser.');
      return;
    }

    setSearching(true);
    setLocationStatus('Requesting your location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserLocation(current);
        setAreaQuery(`${current.lat.toFixed(5)}, ${current.lng.toFixed(5)}`);
        setLocationStatus('Location found.');
        await runAreaSearch(current, 'Current location');
      },
      (err) => {
        setSearching(false);
        setLocationStatus(err.message || 'Location permission denied.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60000,
        timeout: 10000,
      }
    );
  };

  const handleClearArea = () => {
    setAreaQuery('');
    setSearchCenter(null);
    setUserLocation(null);
    setLocationStatus('');
    fetchPlants();
  };

  const handlePlantClick = (plant) => {
    console.log('Selected plant:', plant);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div>Loading plants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Global Plant Map</h1>
      <p>
        Showing {plants.length} plants{activeAreaLabel ? ` near ${activeAreaLabel}` : ' worldwide'}
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Filter by name or description..."
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="text"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="verified">Verified Only</option>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          onClick={fetchPlants}
          style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleAreaSearch}
        style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}
      >
        <input
          type="text"
          placeholder="Search city, region, or lat,lng..."
          value={areaQuery}
          onChange={(e) => setAreaQuery(e.target.value)}
          style={{ flex: '1 1 260px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <label style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span>Radius</span>
          <input
            type="number"
            min="1"
            max="100"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <span>km</span>
        </label>
        <button
          type="submit"
          disabled={searching}
          style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {searching ? 'Searching...' : 'Search Area'}
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={searching}
          style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Use My Location
        </button>
        <button
          type="button"
          onClick={handleClearArea}
          style={{ padding: '8px 16px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Clear Area
        </button>
      </form>

      {locationStatus && (
        <div style={{ marginBottom: '16px', color: '#374151' }}>
          {locationStatus}
        </div>
      )}

      <PlantMap
        plants={plants}
        onPlantClick={handlePlantClick}
        searchCenter={searchCenter}
        searchRadiusKm={radiusKm}
        userLocation={userLocation}
      />

      <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Total:</strong> {plants.length}
        </div>
        <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
          <strong>Verified:</strong> {plants.filter((p) => p.status === 'verified').length}
        </div>
        <div style={{ padding: '10px', background: '#fff3e0', borderRadius: '4px' }}>
          <strong>Pending:</strong> {plants.filter((p) => p.status === 'pending').length}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
