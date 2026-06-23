import React, { useState, useRef } from 'react';
import { Upload, X, MapPin, Sparkles, Send } from 'lucide-react';

export default function ReportForm({ selectedCoords, onReportSubmitted }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoords) {
      alert('Please click on the map to set the issue location coordinates.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('latitude', selectedCoords.lat);
    formData.append('longitude', selectedCoords.lng);
    formData.append('reporter_name', reporterName || 'Anonymous Citizen');
    formData.append('severity', severity);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Reset form
        setTitle('');
        setCategory('pothole');
        setDescription('');
        setReporterName('');
        setSeverity('medium');
        removeImage();
        
        if (onReportSubmitted) {
          onReportSubmitted(result);
        }
      } else {
        alert('Failed to submit report. Please check API connection.');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel side-panel">
      <div>
        <h3 className="form-title">Report Urban Issue</h3>
        <p className="form-subtitle">Help improve Dombivli. Pin the location on the map, upload a photo, and submit.</p>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label className="form-label">Issue Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., Clogged storm drain on Gupte Road" 
            className="form-input" 
            required 
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            className="form-select"
            disabled={loading}
          >
            <option value="pothole">Pothole / Damaged Road</option>
            <option value="garbage">Garbage Pile / Dump</option>
            <option value="streetlight">Broken Streetlight</option>
            <option value="waterlogging">Waterlogging / Flooding</option>
            <option value="traffic">Traffic Congestion</option>
            <option value="illegal_dumping">Illegal Dumping (Debris)</option>
            <option value="other">Other Infrastructure Issue</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Describe the issue size, impact, and how long it has been here..." 
            className="form-textarea"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location Pin</label>
          {selectedCoords ? (
            <div className="location-indicator location-indicator-active">
              <MapPin size={14} />
              <span>Lat: {selectedCoords.lat.toFixed(5)}, Lng: {selectedCoords.lng.toFixed(5)} (Dombivli)</span>
            </div>
          ) : (
            <div className="location-indicator">
              <MapPin size={14} />
              <span>Click any spot on the map to place a pin</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Photo Upload</label>
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Upload preview" className="image-preview" />
              <button type="button" onClick={removeImage} className="remove-image-btn" disabled={loading}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div 
              onDragOver={handleDragOver} 
              onDrop={handleDrop} 
              onClick={() => fileInputRef.current?.click()} 
              className="file-upload-zone"
            >
              <Upload className="file-upload-icon" size={24} />
              <div className="file-upload-text">
                <span>Click to upload</span> or drag and drop
              </div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PNG, JPG or JPEG</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Severity</label>
            <select 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)} 
              className="form-select"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reporter Name</label>
            <input 
              type="text" 
              value={reporterName} 
              onChange={(e) => setReporterName(e.target.value)} 
              placeholder="Your Name (Optional)" 
              className="form-input"
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" disabled={loading || !selectedCoords} className="form-submit-btn">
          {loading ? (
            <>
              <div className="spinner"></div>
              <Sparkles size={16} style={{ color: '#93c5fd' }} />
              <span>AI Classifying Photo...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Submit Report</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
