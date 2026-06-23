import React, { useState } from 'react';
import { Eye, ShieldAlert, Sparkles, User, Calendar, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

export default function AuthorityPanel({ reports, onStatusUpdated }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const response = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        onStatusUpdated(reportId, newStatus);
        // If we are currently viewing the detail drawer, update its status too
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error connecting to server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = reports.filter(report => {
    const term = searchTerm.toLowerCase();
    return (
      report.title.toLowerCase().includes(term) ||
      report.category.toLowerCase().includes(term) ||
      (report.reporter_name && report.reporter_name.toLowerCase().includes(term))
    );
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'investigating': return 'badge-investigating';
      case 'in_progress': return 'badge-inprogress';
      case 'resolved': return 'badge-resolved';
      default: return 'badge-other';
    }
  };

  return (
    <div className="glass-panel authority-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 className="form-title">Municipal Authority Dashboard</h3>
          <p className="form-subtitle">Track, investigate, and resolve urban issues reported by citizens.</p>
        </div>
        
        {/* Search Input */}
        <input 
          type="text" 
          placeholder="Search by title, category, reporter..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ maxWidth: '300px', width: '100%' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '7fr 5fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Main Table */}
        <div className="table-wrapper">
          <table className="issues-table">
            <thead>
              <tr>
                <th>Title & Category</th>
                <th>Severity</th>
                <th>Reporter</th>
                <th>Date Reported</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No reports match your search query.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} style={{ background: report.severity === 'critical' && report.status !== 'resolved' ? 'rgba(239, 68, 68, 0.02)' : 'none' }}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{report.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '2px' }}>
                        {report.category}
                      </div>
                    </td>
                    <td>
                      <span className={`status-indicator`} style={{ color: report.severity === 'critical' ? '#ef4444' : report.severity === 'high' ? '#f59e0b' : '#3b82f6' }}>
                        {report.severity === 'critical' && <ShieldAlert size={12} />}
                        {report.severity}
                      </span>
                    </td>
                    <td>{report.reporter_name}</td>
                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                    <td>
                      {updatingId === report.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <RefreshCw size={12} className="spinner" /> Updating...
                        </div>
                      ) : (
                        <select 
                          value={report.status} 
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="investigating">Investigating</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="nav-btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* AI detail drawer */}
        {selectedReport && (
          <div className="detail-drawer">
            <div className="detail-header">
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{selectedReport.title}</h4>
                <div className="detail-tag-row">
                  <span className={`badge ${getStatusClass(selectedReport.status)}`}>{selectedReport.status}</span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    Severity: {selectedReport.severity}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)} 
                className="remove-image-btn" 
                style={{ position: 'relative', top: '0', right: '0' }}
              >
                <Eye size={14} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            {selectedReport.image_url ? (
              <img src={selectedReport.image_url} alt="Report attachment" className="detail-img" />
            ) : (
              <div style={{ height: '140px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No image file uploaded
              </div>
            )}

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong>Citizen Description:</strong> {selectedReport.description || 'No description provided.'}
            </div>

            {/* AI analysis outputs */}
            {selectedReport.ai_analysis && (
              <div className="ai-analysis-box">
                <div className="ai-header-row">
                  <Sparkles size={16} />
                  <span>AI Diagnostics & Visual Log</span>
                </div>
                
                <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  <strong>AI Explanation:</strong> {selectedReport.ai_analysis.explanation}
                </p>

                {selectedReport.ai_analysis.detected_details && selectedReport.ai_analysis.detected_details.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Visual Clues Identified:</strong>
                    <ul className="ai-details-list" style={{ marginTop: '6px' }}>
                      {selectedReport.ai_analysis.detected_details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedReport.ai_analysis.yolo_objects && selectedReport.ai_analysis.yolo_objects.length > 0 && (
                  <div>
                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>YOLOv8 Local Detections:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {selectedReport.ai_analysis.yolo_objects.map((obj, idx) => (
                        <span key={idx} style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                          {obj.label} ({(obj.confidence * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReport.ai_analysis.action_recommendation && (
                  <div style={{ marginTop: '4px', borderTop: '1px solid rgba(59, 130, 246, 0.12)', paddingTop: '10px', fontSize: '12.5px' }}>
                    <span style={{ color: '#93c5fd', fontWeight: '700' }}>Recommended Action: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedReport.ai_analysis.action_recommendation}</span>
                  </div>
                )}
              </div>
            )}

            {/* Reporter Meta */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {selectedReport.reporter_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(selectedReport.created_at).toLocaleString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
