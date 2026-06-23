import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Flame, Layers, MapPin } from 'lucide-react';
import { GOVT_OFFICES_DATA } from './GovtOffices';

// Import leaflet styles
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths which break in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Color-coded CSS variables mapping based on category
const CATEGORY_COLORS = {
  pothole: '#ef4444',
  garbage: '#f59e0b',
  streetlight: '#3b82f6',
  waterlogging: '#06b6d4',
  traffic: '#ec4899',
  illegal_dumping: '#a855f7',
  other: '#64748b',
};

// Custom Leaflet DivIcon creator for modern glowing map pins
const createOfficeIcon = () => {
  const html = `
    <div style="
      position: relative;
      width: 26px;
      height: 26px;
      background-color: #10b981;
      border: 2px solid #ffffff;
      border-radius: 6px;
      box-shadow: 0 0 10px #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"></path>
        <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 0V3h6v4m0 0a3 3 0 0 0 6 0v-1m-12 5v10m6-10v10"></path>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'office-leaflet-marker',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

// Custom Leaflet DivIcon creator for modern glowing map pins
const createCustomIcon = (category, status) => {
  const color = CATEGORY_COLORS[category] || '#64748b';
  
  // Outer pulse border color based on status
  let pulseColor = 'rgba(255, 255, 255, 0.4)';
  if (status === 'resolved') pulseColor = 'rgba(16, 185, 129, 0.3)';
  else if (status === 'in_progress') pulseColor = 'rgba(59, 130, 246, 0.4)';
  else if (status === 'pending') pulseColor = 'rgba(239, 68, 68, 0.4)';
  
  const html = `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      background-color: ${color};
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 10px ${color}, 0 0 0 4px ${pulseColor};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease-in-out;
    ">
      <div style="
        width: 6px;
        height: 6px;
        background-color: #ffffff;
        border-radius: 50%;
      "></div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Component to handle map centering and panning
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

// Component to handle map clicks for placing issue report pins
function MapClickEvents({ onMapClick, activeMode }) {
  useMapEvents({
    click(e) {
      if (activeMode === 'report') {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

export default function InteractiveMap({ reports, hotspots, activeMode, selectedCoords, setSelectedCoords, mapCenter }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  // Fallback map center (Dombivli)
  const defaultCenter = [19.2183, 73.0867];

  const handleMapClick = (latlng) => {
    setSelectedCoords(latlng);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      pothole: 'Pothole',
      garbage: 'Garbage Dump',
      streetlight: 'Streetlight',
      waterlogging: 'Flooding',
      traffic: 'Traffic',
      illegal_dumping: 'Illegal Dumping',
      other: 'Other Issue',
    };
    return labels[category] || 'Civic Issue';
  };

  return (
    <div className="glass-panel map-container-panel">
      <div className="map-header">
        <div className="brand-title">
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Live Dombivli Map</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
            {activeMode === 'report' ? 'CLICK ON THE MAP TO CHOOSE COORDINATES' : 'ACTIVE ISSUES MONITOR'}
          </p>
        </div>

        {/* Layer Controls */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`nav-btn ${showHeatmap ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Toggle Heatmap Overlay"
          >
            <Flame size={14} />
            <span>Heatmap</span>
          </button>
          
          <button 
            onClick={() => setShowHotspots(!showHotspots)}
            className={`nav-btn ${showHotspots ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Toggle Hotspot Zones"
          >
            <Layers size={14} />
            <span>AI Hotspots</span>
          </button>
        </div>
      </div>

      {/* Map Body */}
      <div className="map-wrapper">
        <MapContainer 
          center={defaultCenter} 
          zoom={14} 
          scrollWheelZoom={true} 
          style={{ width: '100%', height: '100%', borderRadius: '12px' }}
        >
          {/* Dark Mode Basemap Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapController center={mapCenter} />
          <MapClickEvents onMapClick={handleMapClick} activeMode={activeMode} />

          {/* Render User Selected reporting coordinate pin */}
          {activeMode === 'report' && selectedCoords && (
            <Marker 
              position={[selectedCoords.lat, selectedCoords.lng]}
              icon={L.divIcon({
                html: `
                  <div style="color: #3b82f6; filter: drop-shadow(0 0 6px #3b82f6); animation: bounce 0.5s infinite alternate;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                `,
                className: 'temp-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
              })}
            >
              <Popup>
                <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600' }}>
                  New Report Pin Location
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render Hotspot Circles (AI Predictions) */}
          {showHotspots && hotspots.map((hotspot) => {
            const isHigh = hotspot.severity === 'critical' || hotspot.severity === 'high';
            return (
              <Circle
                key={hotspot.id}
                center={[hotspot.latitude, hotspot.longitude]}
                radius={hotspot.radius_meters}
                pathOptions={{
                  fillColor: isHigh ? '#ef4444' : '#f59e0b',
                  color: isHigh ? '#ef4444' : '#f59e0b',
                  weight: 1.5,
                  fillOpacity: 0.12,
                  dashArray: '5, 5',
                }}
              />
            );
          })}

          {/* Render Issue Markers / Heatmap circles */}
          {reports.map((report) => {
            const color = CATEGORY_COLORS[report.category] || '#64748b';
            
            // If Heatmap Mode is enabled, draw big blurred circles instead of standard markers
            if (showHeatmap) {
              if (report.status === 'resolved') return null; // resolved issues aren't hot
              
              const radius = report.severity === 'critical' ? 220 : report.severity === 'high' ? 170 : 120;
              return (
                <Circle
                  key={`heat_${report.id}`}
                  center={[report.latitude, report.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    color: 'transparent',
                    fillOpacity: 0.28,
                  }}
                />
              );
            }

            // Normal Pin Markers Mode
            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createCustomIcon(report.category, report.status)}
              >
                <Popup>
                  <div className="map-popup-card">
                    <div className="map-popup-header">
                      <span className="map-popup-title">{report.title}</span>
                      <span 
                        className="map-popup-category" 
                        style={{ 
                          backgroundColor: `${color}15`, 
                          color: color,
                          border: `1px solid ${color}30` 
                        }}
                      >
                        {getCategoryLabel(report.category)}
                      </span>
                    </div>

                    <p className="map-popup-desc">
                      {report.description ? (
                        report.description.length > 70 
                          ? `${report.description.substring(0, 70)}...` 
                          : report.description
                      ) : 'No description provided.'}
                    </p>

                    {report.image_url && (
                      <img src={report.image_url} alt={report.title} className="map-popup-img" />
                    )}

                    <div className="map-popup-footer">
                      <span>Reporter: {report.reporter_name}</span>
                      <span 
                        className="map-popup-status"
                        style={{
                          color: report.status === 'resolved' ? '#10b981' : 
                                 report.status === 'in_progress' ? '#3b82f6' : 
                                 report.status === 'investigating' ? '#f59e0b' : '#ef4444'
                        }}
                      >
                        {report.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render Government Office Markers */}
          {activeMode === 'offices' && GOVT_OFFICES_DATA.map((office) => (
            <Marker
              key={office.id}
              position={[office.lat, office.lng]}
              icon={createOfficeIcon()}
            >
              <Popup>
                <div className="map-popup-card">
                  <div className="map-popup-header">
                    <span className="map-popup-title" style={{ fontSize: '13px', fontWeight: '700' }}>{office.name}</span>
                    <span 
                      className="map-popup-category" 
                      style={{ 
                        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '9px'
                      }}
                    >
                      Govt Office
                    </span>
                  </div>
                  <p className="map-popup-desc" style={{ fontSize: '11.5px', marginTop: '6px', lineHeight: '1.4' }}>
                    <strong>Ward Head:</strong> {office.officer}<br />
                    <strong>Address:</strong> {office.address}
                  </p>
                  <div className="map-popup-footer" style={{ fontSize: '10px', marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                    <span>Phone: {office.phone}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Legend */}
      {!showHeatmap && (
        <div className="map-legend" style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          {Object.entries(CATEGORY_COLORS).map(([cat, col]) => (
            <div key={cat} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: col }}></span>
              <span style={{ textTransform: 'capitalize' }}>
                {cat === 'illegal_dumping' ? 'Illegal Dumping' : cat}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
