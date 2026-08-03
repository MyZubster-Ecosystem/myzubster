import React, { useState, useEffect } from 'react';
import './PhotoGallery.css';

const PhotoGallery = ({ gardenId }) => {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, [gardenId, page]);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/photos/garden/${gardenId}?page=${page}&limit=12`);
      const data = await res.json();
      if (data.success) {
        setPhotos(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Errore caricamento galleria:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Eliminare questa foto?')) return;
    try {
      await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      fetchPhotos();
      setSelectedPhoto(null);
    } catch (err) {
      alert('Errore eliminazione');
    }
  };

  if (loading) return <div className="gallery-loading">Caricamento...</div>;

  if (photos.length === 0) {
    return (
      <div className="gallery-empty">
        <span>📷</span>
        <p>Nessuna foto ancora. Carica la prima!</p>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-grid">
        {photos.map(photo => (
          <div key={photo.id} className="gallery-item" onClick={() => setSelectedPhoto(photo)}>
            <img src={photo.thumbnailPath || photo.path} alt={photo.caption || photo.originalName} loading="lazy" />
            {photo.caption && <div className="photo-caption">{photo.caption}</div>}
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="gallery-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Precedente</button>
          <span>Pagina {page} di {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Successiva →</button>
        </div>
      )}

      {selectedPhoto && (
        <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPhoto(null)}>×</button>
            <img src={selectedPhoto.path} alt={selectedPhoto.caption || selectedPhoto.originalName} />
            {selectedPhoto.caption && <p className="modal-caption">{selectedPhoto.caption}</p>}
            <p className="modal-meta">
              Caricata da {selectedPhoto.uploadedBy} • {new Date(selectedPhoto.createdAt).toLocaleDateString()}
            </p>
            <button className="delete-btn" onClick={() => handleDelete(selectedPhoto.id)}>
              🗑 Elimina foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
