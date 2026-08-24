import React, { useState, useEffect, useCallback } from 'react';
import GardenMap from '../components/Map/GardenMap';
import { getGardens, searchGardens, nearbyGardens } from '../api/gardens';

const SEARCH_MODES = {
  NONE: 'none',
  TEXT: 'text',
  NEARBY: 'nearby',
  GEOCODED: 'geocoded_fallback',
};

const GardensPage = () => {
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(SEARCH_MODES.NONE);
  const [searchMeta, setSearchMeta] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyRadius, setNearbyRadius] = useState(5000);
  const [filters, setFilters] = useState({ status: 'active', size: '' });

  const fetchAllGardens = useCallback(async (nextFilters = {}) => {
    setLoading(true);
    setSearchMode(SEARCH_MODES.NONE);
    setSearchMeta(null);
    try {
      const data = await getGardens(nextFilters);
      setGardens(data.gardens || []);
      setError(null);
    } catch (err) {
      setError('Impossibile caricare gli orti');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllGardens(filters);
  }, [fetchAllGardens, filters]);

  // Ricerca testuale
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      fetchAllGardens(filters);
      return;
    }

    setLoading(true);
    try {
      const data = await searchGardens(q);
      setGardens(data.gardens || []);
      setSearchMode(data.mode || SEARCH_MODES.TEXT);
      setSearchMeta(data.geocoding || null);

      if (data.total === 0) {
        setError(`Nessun orto trovato per "${q}".`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Errore durante la ricerca');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Ricerca per coordinate (geolocalizzazione browser)
  const handleNearbyMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata dal browser');
      return;
    }

    setLoading(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = pos.coords;
      setUserLocation({ lat: latitude, lng: longitude });

      const data = await nearbyGardens(latitude, longitude, nearbyRadius);
      setGardens(data.gardens || []);
      setSearchMode(SEARCH_MODES.NEARBY);
      setSearchMeta({ locationName: data.locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
      setError(data.total === 0 ? 'Nessun orto trovato nelle vicinanze.' : null);
    } catch (err) {
      if (err.code === 1) {
        setError('Permesso di geolocalizzazione negato.');
      } else {
        setError('Errore nel recupero della posizione.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [nearbyRadius]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleGardenClick = (garden) => {
    console.log('Selected garden:', garden);
  };

  // Breadcrumb per capire in che modalità di ricerca siamo
  const renderSearchInfo = () => {
    if (searchMode === SEARCH_MODES.NONE) return null;

    let label = '';
    if (searchMode === SEARCH_MODES.TEXT) {
      label = `Ricerca testuale: "${searchQuery}"`;
    } else if (searchMode === SEARCH_MODES.GEOCODED) {
      label = `Ricerca per luogo: "${searchQuery}" → ${searchMeta?.displayName || ''}`;
    } else if (searchMode === SEARCH_MODES.NEARBY) {
      label = `Vicino a: ${searchMeta?.locationName || 'posizione attuale'} (raggio ${nearbyRadius}m)`;
    }

    return (
      <div style={{
        background: '#e3f2fd',
        padding: '8px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>📍 {label} — <strong>{gardens.length}</strong> orti trovati</span>
        <button
          onClick={() => fetchAllGardens(filters)}
          style={{
            padding: '4px 12px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          × Cancella ricerca
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🌱 Orti & Giardini</h1>
      <p>Esplora orti e giardini, cercali per indirizzo o posizione</p>

      {/* Barra di ricerca */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Cerca per indirizzo, quartiere o città (es. Piazza Roma)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '10px 14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '15px',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 'bold',
          }}
        >
          🔍 Cerca
        </button>

        <button
          type="button"
          onClick={handleNearbyMe}
          style={{
            padding: '10px 20px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 'bold',
          }}
        >
          📍 Orti vicino a me
        </button>

        {/* Raggio per nearby */}
        <label style={{ fontSize: '13px', color: '#666' }}>
          Raggio:
          <select
            value={nearbyRadius}
            onChange={(e) => setNearbyRadius(parseInt(e.target.value))}
            style={{ marginLeft: '6px', padding: '6px' }}
          >
            <option value={1000}>1 km</option>
            <option value={3000}>3 km</option>
            <option value={5000}>5 km</option>
            <option value={10000}>10 km</option>
            <option value={25000}>25 km</option>
          </select>
        </label>
      </form>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">Tutti gli stati</option>
          <option value="active">Attivi</option>
          <option value="dormant">Dormienti</option>
          <option value="harvested">Raccolti</option>
          <option value="abandoned">Abbandonati</option>
        </select>
        <select
          value={filters.size}
          onChange={(e) => handleFilterChange('size', e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">Tutte le dimensioni</option>
          <option value="small">Piccolo</option>
          <option value="medium">Medio</option>
          <option value="large">Grande</option>
        </select>
      </div>

      {renderSearchInfo()}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div>Caricamento orti...</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ color: '#d32f2f', textAlign: 'center', padding: '16px', background: '#ffebee', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Mappa */}
      {!loading && (
        <GardenMap
          gardens={gardens}
          onGardenClick={handleGardenClick}
          centerOn={userLocation || (searchMeta ? { lat: searchMeta.lat, lng: searchMeta.lng } : null)}
        />
      )}

      {/* Statistiche */}
      {!loading && gardens.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
            <strong>Totale:</strong> {gardens.length}
          </div>
          <div style={{ padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
            <strong>Attivi:</strong> {gardens.filter((g) => g.status === 'active').length}
          </div>
          <div style={{ padding: '10px', background: '#fff3e0', borderRadius: '4px' }}>
            <strong>Grandi:</strong> {gardens.filter((g) => g.size === 'large').length}
          </div>
        </div>
      )}

      {/* Lista orti */}
      {!loading && gardens.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3>Elenco orti</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {gardens.map((garden) => (
              <div
                key={garden._id || garden.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '12px',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <h4 style={{ margin: '0 0 6px 0' }}>{garden.name}</h4>
                {garden.address && (
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                    📍 {garden.address}
                  </p>
                )}
                {garden.description && (
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#555' }}>
                    {garden.description.substring(0, 100)}
                    {garden.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: garden.status === 'active' ? '#e8f5e9' : garden.status === 'pending' ? '#fff3e0' : '#f5f5f5',
                    color: garden.status === 'active' ? '#2e7d32' : garden.status === 'pending' ? '#e65100' : '#666',
                  }}>
                    {garden.status}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: '#e3f2fd', color: '#1565c0' }}>
                    {garden.size}
                  </span>
                </div>
                {garden.gps && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#999' }}>
                    {garden.gps.lat.toFixed(4)}, {garden.gps.lng.toFixed(4)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GardensPage;
