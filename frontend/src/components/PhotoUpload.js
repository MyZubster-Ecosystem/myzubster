import React, { useState, useCallback } from 'react';
import './PhotoUpload.css';

const PhotoUpload = ({ gardenId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (dropped.length > 0) {
      setFiles(prev => [...prev, ...dropped]);
    }
  }, []);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    if (caption) formData.append('caption', caption);

    try {
      const res = await fetch(`/api/photos/garden/${gardenId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setFiles([]);
        setCaption('');
        onUploadComplete?.();
      } else {
        alert(data.message || 'Upload fallito');
      }
    } catch (err) {
      alert('Errore di rete: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload">
      <div
        className={`dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="photo-input"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="photo-input" className="dropzone-label">
          <span className="dropzone-icon">📷</span>
          <span>Trascina le foto qui oppure clicca per selezionare</span>
          <span className="dropzone-hint">Max 10 foto, max 10 MB ciascuna</span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="preview-grid">
          {files.map((file, i) => (
            <div key={i} className="preview-item">
              <img src={URL.createObjectURL(file)} alt={file.name} />
              <button type="button" onClick={() => removeFile(i)} className="remove-btn">×</button>
              <span className="file-name">{file.name}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="upload-controls">
          <input
            type="text"
            placeholder="Didascalia (opzionale)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="caption-input"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? 'Caricamento...' : `Carica ${files.length} foto`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
