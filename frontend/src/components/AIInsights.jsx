import React from 'react';
import { ShieldAlert, Compass, Users, CheckCircle, TrendingUp } from 'lucide-react';

export default function AIInsights({ hotspots, reports, onHotspotClick }) {
  // Aggregate statistics
  const activeReports = reports.filter(r => r.status !== 'resolved');
  const criticalCount = activeReports.filter(r => r.severity === 'critical').length;
  
  // Calculate resolution rate
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const resolutionRate = reports.length > 0 ? Math.round((resolvedCount / reports.length) * 100) : 0;

  return (
    <div className="glass-panel side-panel" style={{ maxHeight: '100%' }}>
      <div className="insights-header">
        <h3 className="form-title">AI Predictive Insights</h3>
        <p className="form-subtitle">Real-time hotspots and risk projections for Dombivli infrastructure.</p>
      </div>

      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.12)', padding: '12px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <ShieldAlert size={14} /> Critical Zones
          </div>
          <p style={{ fontSize: '22px', fontWeight: '800', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            {hotspots.filter(h => h.severity === 'critical' || h.severity === 'high').length}
          </p>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.12)', padding: '12px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a7f3d0', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
            <CheckCircle size={14} /> Resolution Rate
          </div>
          <p style={{ fontSize: '22px', fontWeight: '800', marginTop: '6px', fontFamily: 'var(--font-heading)' }}>
            {resolutionRate}%
          </p>
        </div>
      </div>

      <div className="insights-list">
        <h4 className="form-label" style={{ marginBottom: '-4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={14} style={{ color: '#3b82f6' }} /> Active Hotspot Predictions ({hotspots.length})
        </h4>

        {hotspots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border-light)', borderRadius: '10px' }}>
            No major hotspots detected. Run the simulation seeder or report multiple close-proximity issues to generate hotspots.
          </div>
        ) : (
          hotspots.map((hotspot) => {
            const isHigh = hotspot.severity === 'critical' || hotspot.severity === 'high';
            return (
              <div 
                key={hotspot.id} 
                onClick={() => onHotspotClick([hotspot.latitude, hotspot.longitude])}
                className={`insight-card ${hotspot.severity}`}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div className="insight-meta">
                  <span className="insight-title" style={{ color: isHigh ? '#fecaca' : '#f8fafc' }}>
                    {hotspot.primary_issue.toUpperCase()} HOTSPOT ({hotspot.issue_count} Issues)
                  </span>
                  <span className={`insight-badge badge badge-${hotspot.severity === 'critical' ? 'pending' : hotspot.severity === 'high' ? 'investigating' : 'inprogress'}`}>
                    {hotspot.severity} Risk
                  </span>
                </div>
                
                <p className="insight-desc">{hotspot.description}</p>
                
                <div className="insight-stats">
                  <span>Center: {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}</span>
                  <span>Radius: {hotspot.radius_meters}m</span>
                </div>
              </div>
            );
          })
        )}

        <h4 className="form-label" style={{ marginTop: '10px', marginBottom: '-4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={14} style={{ color: '#a855f7' }} /> AI Projections (Next 7 Days)
        </h4>

        <div style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '12px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '8px' }}>
            <span style={{ color: '#ec4899', fontWeight: '700' }}>Traffic Density Trend: </span>
            <span style={{ color: 'var(--text-secondary)' }}>Heavy congestion predicted near Shivaji Chowk between 6:30 PM - 8:30 PM due to highway overflow.</span>
          </div>
          <div>
            <span style={{ color: '#06b6d4', fontWeight: '700' }}>Flood Susceptibility: </span>
            <span style={{ color: 'var(--text-secondary)' }}>Waterlogging hazard on Kalyan-Shilphata Road is projected at "Critical" if rainfall exceeds 40mm. Clear drains immediately.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
