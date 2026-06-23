import React, { useState } from 'react';
import { Play, Check, AlertCircle } from 'lucide-react';

export default function Simulator({ onSimulationComplete }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const handleSimulate = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
      });
      if (response.ok) {
        setStatus('success');
        if (onSimulationComplete) {
          onSimulationComplete();
        }
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Failed to run simulation seeding:', err);
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="glass-panel simulation-panel">
      <div className="simulation-details">
        <h4>Kalyan-Dombivli Civic Simulator</h4>
        <p>Seed the database with 12 realistic potholes, flooding, and traffic reports across Dombivli East & West.</p>
      </div>
      
      <button 
        onClick={handleSimulate} 
        disabled={loading} 
        className="simulate-btn"
      >
        {loading ? (
          <div className="spinner"></div>
        ) : status === 'success' ? (
          <Check size={18} />
        ) : status === 'error' ? (
          <AlertCircle size={18} />
        ) : (
          <Play size={18} />
        )}
        {loading ? 'Seeding...' : status === 'success' ? 'Seeded!' : status === 'error' ? 'Failed' : 'Simulate Cities'}
      </button>
    </div>
  );
}
