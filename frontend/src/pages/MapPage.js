import React, { useState, useEffect } from 'react';
import PlantMap from '../components/Map/PlantMap';
import { getPlants, searchPlantsByArea } from '../api/plants';

const MapPage = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    species: '',
    size: '',
    status: 'verified'
  });
  const [addressSearch, setAddressSearch] = useState('');
  const [searchMode, setSearchMode] = useState('filters'); // 'filters' | 'address'

  useEffect(() => {
    fetchPlants();
  }, [filters, addressSearch, searchMode]);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      let data;
      if (searchMode === 'address' && addressSearch.trim()) {
        data = await searchPlantsByArea(addressSearch.trim());
        setPlants(data.plants || []);
      } else {
        data = await getPlants(filters);
        setPlants(data.plants || []);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load plants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSearch = () => {
    if (addressSearch.trim()) {
      setSearchMode('address');
      // Trigger fetch via useEffect dependency
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      <h1>🌍 Global Plant Map</h1>
      <p>Showing {plants.length} plants worldwide</p>
      
      {/* Filtri */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Filter by species..."
          value={filters.species}
          onChange={(e) => handleFilterChange('species', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="text"
          placeholder="Cerca per indirizzo, quartiere o città..."
          value={addressSearch}
          onChange={(e) => { setAddressSearch(e.target.value); setSearchMode('address'); }}
          onKeyDown={(e) => e.key === 'Enter' && fetchPlants()}
          style={{ padding: '8px', border: '1px solid #4CAF50', borderRadius: '4px', flex: 1, minWidth: '200px' }}
        />
        <select
          value={filters.size}
          onChange={(e) => handleFilterChange('size', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">All Sizes</option>
          <option value="seedling">Seedling</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="ancient">Ancient</option>
        </select>
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
      
      {/* Mappa */}
      <PlantMap plants={plants} onPlantClick={handlePlantClick} />
      
      {/* Statistiche */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Total:</strong> {plants.length}
        </div>
        <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
          <strong>Verified:</strong> {plants.filter(p => p.status === 'verified').length}
        </div>
        <div style={{ padding: '10px', background: '#fff3e0', borderRadius: '4px' }}>
          <strong>Pending:</strong> {plants.filter(p => p.status === 'pending').length}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
