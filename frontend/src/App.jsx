import React, { useState, useEffect } from 'react';
import { Shield, MapPin, Sparkles, ClipboardList, Database, AlertCircle, Landmark, HelpCircle } from 'lucide-react';
import InteractiveMap from './components/InteractiveMap';
import ReportForm from './components/ReportForm';
import AIInsights from './components/AIInsights';
import AuthorityPanel from './components/AuthorityPanel';
import Simulator from './components/Simulator';
import GovtOffices from './components/GovtOffices';
import SupportPanel from './components/SupportPanel';

export default function App() {
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'report' | 'insights' | 'authority'
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.2183, 73.0867]); // Dombivli center
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  // Load reports and hotspots
  const fetchData = async () => {
    try {
      const reportsRes = await fetch('/api/reports');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }
      
      const hotspotsRes = await fetch('/api/hotspots');
      if (hotspotsRes.ok) {
        const hotspotsData = await hotspotsRes.json();
        setHotspots(hotspotsData);
      }
    } catch (err) {
      console.error('Error fetching data from API:', err);
      showToast('Backend connection offline. Falling back to mock states.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleReportSubmitted = (newReport) => {
    showToast('Report submitted! AI successfully analyzed the image.', 'success');
    fetchData();
    setSelectedCoords(null);
    setActiveTab('monitor'); // switch to live map to view the pin
    if (newReport) {
      setMapCenter([newReport.latitude, newReport.longitude]);
    }
  };

  const handleStatusUpdated = (reportId, newStatus) => {
    showToast(`Status updated to ${newStatus}`, 'success');
    fetchData();
  };

  const handleSimulationComplete = () => {
    showToast('Simulation data seeded for Kalyan-Dombivli region!', 'success');
    fetchData();
    setMapCenter([19.2183, 73.0867]); // Reset map center
  };

  const handleHotspotClick = (coords) => {
    setMapCenter(coords);
    showToast('Centering map on AI Hotspot cluster...', 'success');
  };

  // Calculate statistics
  const totalReports = reports.length;
  const activeReports = reports.filter(r => r.status !== 'resolved').length;
  const inProgress = reports.filter(r => r.status === 'in_progress').length;
  const resolved = reports.filter(r => r.status === 'resolved').length;

  return (
    <div>
      {/* App Header */}
      <header className="app-header">
        <div className="brand-container">
          <Shield className="brand-logo" size={28} />
          <div className="brand-title">
            <h1>Smart Civic Guardian</h1>
            <p>Dombivli AI Urban Management</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button 
            className={`nav-btn ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            <MapPin size={16} /> Live Monitor
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('report');
              showToast('Click anywhere on the map to pin the issue location.', 'success');
            }}
          >
            <AlertCircle size={16} /> Report Issue
          </button>

          <button 
            className={`nav-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <Sparkles size={16} /> AI Predictions
          </button>

          <button 
            className={`nav-btn ${activeTab === 'offices' ? 'active' : ''}`}
            onClick={() => setActiveTab('offices')}
          >
            <Landmark size={16} /> Govt Offices
          </button>

          <button 
            className={`nav-btn ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <HelpCircle size={16} /> FAQ & Support
          </button>

          <button 
            className={`nav-btn ${activeTab === 'authority' ? 'active' : ''}`}
            onClick={() => setActiveTab('authority')}
          >
            <ClipboardList size={16} /> Authority Panel
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="dashboard-container">
        
        {/* Quick Stats Grid - Only shown in general modes */}
        {activeTab !== 'authority' && activeTab !== 'support' && (
          <div className="stats-grid">
            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                <Database size={24} />
              </div>
              <div className="stat-details">
                <h3>Total Reports</h3>
                <p>{totalReports}</p>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <AlertCircle size={24} />
              </div>
              <div className="stat-details">
                <h3>Active Issues</h3>
                <p>{activeReports}</p>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <ClipboardList size={24} />
              </div>
              <div className="stat-details">
                <h3>In Progress</h3>
                <p>{inProgress}</p>
              </div>
            </div>

            <div className="glass-panel stat-card">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Sparkles size={24} />
              </div>
              <div className="stat-details">
                <h3>Resolved</h3>
                <p>{resolved}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Navigation Views */}
        {activeTab === 'authority' ? (
          <AuthorityPanel 
            reports={reports} 
            onStatusUpdated={handleStatusUpdated}
          />
        ) : activeTab === 'support' ? (
          <SupportPanel />
        ) : (
          <div className="interactive-grid">
            {/* Interactive Map on Left */}
            <InteractiveMap 
              reports={reports}
              hotspots={hotspots}
              activeMode={activeTab}
              selectedCoords={selectedCoords}
              setSelectedCoords={setSelectedCoords}
              mapCenter={mapCenter}
            />

            {/* Sidebar content on Right */}
            {activeTab === 'monitor' && (
              <div className="side-panel">
                <Simulator onSimulationComplete={handleSimulationComplete} />
                
                {/* Active Issues List */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    Recent Reports Feed
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '360px', overflowY: 'auto' }}>
                    {reports.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '20px 0' }}>
                        No reports filed yet. Click "Simulate Cities" to seed data!
                      </p>
                    ) : (
                      reports.slice(0, 5).map((r) => (
                        <div 
                          key={r.id} 
                          onClick={() => setMapCenter([r.latitude, r.longitude])}
                          style={{ 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid var(--border-light)', 
                            padding: '10px 14px', 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12.5px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700' }}>{r.title}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                              {r.category} • {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span 
                            style={{ 
                              fontSize: '10px', 
                              fontWeight: '700',
                              color: r.status === 'resolved' ? '#10b981' : 
                                     r.status === 'in_progress' ? '#3b82f6' : 
                                     r.status === 'investigating' ? '#f59e0b' : '#ef4444'
                            }}
                          >
                            {r.status.toUpperCase()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'report' && (
              <ReportForm 
                selectedCoords={selectedCoords}
                onReportSubmitted={handleReportSubmitted}
              />
            )}

            {activeTab === 'insights' && (
              <AIInsights 
                hotspots={hotspots}
                reports={reports}
                onHotspotClick={handleHotspotClick}
              />
            )}

            {activeTab === 'offices' && (
              <GovtOffices onOfficeClick={handleHotspotClick} />
            )}
          </div>
        )}
      </main>

      {/* Global Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div style={{ fontWeight: '600' }}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}
