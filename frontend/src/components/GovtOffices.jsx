import React, { useState } from 'react';
import { Building, MapPin, Phone, User, Landmark, Search } from 'lucide-react';

export const GOVT_OFFICES_DATA = [
  {
    id: "office_1",
    name: "KDMC Headquarters (Head Office)",
    address: "Admin Building, Shivaji Chowk, Kalyan West - 421301",
    officer: "Municipal Commissioner, KDMC",
    phone: "1800 233 7383",
    lat: 19.2435,
    lng: 73.1293,
    type: "headquarters",
    focus: "Central administrative approvals, planning grievances, and overall municipal policies."
  },
  {
    id: "office_2",
    name: "KDMC Ward Office F (Dombivli East)",
    address: "Station Road, Near Patkar School, Dombivli East - 421201",
    officer: "Assistant Commissioner (Ward F)",
    phone: "0251-2470357",
    lat: 19.2178,
    lng: 73.0862,
    type: "ward",
    focus: "Waste disposal management, public parks maintenance, and streetlight reports in Dombivli East."
  },
  {
    id: "office_3",
    name: "KDMC Ward Office H (Dombivli West)",
    address: "Gupte Road, near Garibachawada, Dombivli West - 421202",
    officer: "Assistant Commissioner (Ward H)",
    phone: "0251-2481073",
    lat: 19.2132,
    lng: 73.0789,
    type: "ward",
    focus: "Local drain cleaning, monsoon flood mitigation, and street potholes maintenance in Dombivli West."
  },
  {
    id: "office_4",
    name: "KDMC Ward Office D (Kalyan East)",
    address: "Near Kalyan Railway Station, Kalyan East - 421306",
    officer: "Ward Coordinator (Ward D)",
    phone: "0251-2315101",
    lat: 19.2290,
    lng: 73.1360,
    type: "ward",
    focus: "Footpath clearance, garbage dump clearing, and local water supply lines in Kalyan East."
  },
  {
    id: "office_5",
    name: "KDMC Ward Office G (Thakurli Corridor)",
    address: "Near Railway Crossing, Thakurli East - 421201",
    officer: "Ward Officer (Ward G)",
    phone: "0251-2480445",
    lat: 19.2240,
    lng: 73.0910,
    type: "ward",
    focus: "Railway boundary cleanliness, road widening, and illegal dumping mitigation near Thakurli."
  }
];

export default function GovtOffices({ onOfficeClick }) {
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOffices = GOVT_OFFICES_DATA.filter(office => {
    const term = searchTerm.toLowerCase();
    return (
      office.name.toLowerCase().includes(term) ||
      office.address.toLowerCase().includes(term) ||
      office.officer.toLowerCase().includes(term)
    );
  });

  const handleSelectOffice = (office) => {
    setSelectedOfficeId(office.id);
    onOfficeClick([office.lat, office.lng]);
  };

  return (
    <div className="glass-panel side-panel" style={{ maxHeight: '100%' }}>
      
      <div>
        <h3 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={20} style={{ color: '#10b981' }} /> Government Offices Tracker
        </h3>
        <p className="form-subtitle">Find contact coordinates and departments of local civic authorities near you.</p>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Search government offices..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{ width: '100%', paddingLeft: '36px' }}
        />
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
        {filteredOffices.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
            No offices found matching search criteria.
          </div>
        ) : (
          filteredOffices.map((office) => {
            const isSelected = selectedOfficeId === office.id;
            return (
              <div 
                key={office.id}
                onClick={() => handleSelectOffice(office)}
                style={{
                  background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                  border: isSelected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-light)',
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '800', 
                    textTransform: 'uppercase', 
                    color: office.type === 'headquarters' ? '#10b981' : '#3b82f6',
                    background: office.type === 'headquarters' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {office.type}
                  </span>
                  
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={10} /> {office.lat.toFixed(3)}, {office.lng.toFixed(3)}
                  </span>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {office.name}
                </h4>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  <strong>Address:</strong> {office.address}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={12} /> Officer: <strong>{office.officer}</strong></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> Contact: <strong>{office.phone}</strong></span>
                </div>

                {isSelected && (
                  <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #10b981', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                    <strong>Focus Area:</strong> {office.focus}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
