import React, { useState } from 'react';
import { HelpCircle, Mail, Phone, Check, ChevronDown, ChevronUp, Send } from 'lucide-react';

export default function SupportPanel() {
  const [activeFaq, setActiveFaq] = useState(null);
  
  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feedback');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const faqs = [
    {
      q: "How does the AI auto-classification work?",
      a: "When you upload an issue picture, our AI (YOLOv8 + Gemini API) scans it to detect objects and structural damage. It extracts key details and automatically places the report into the correct category with a severity rating."
    },
    {
      q: "What is an AI Hotspot?",
      a: "Our backend clusters active issues within a 600m radius using a Haversine spatial algorithm. Clusters with 2 or more reports are flagged as Hotspots, indicating high infrastructure strain that needs municipal attention."
    },
    {
      q: "How can I track the resolution of my reported issue?",
      a: "Once reported, you can view the status (Pending, Investigating, In Progress, Resolved) on the Live Monitor. Authorities update these statuses through the Authority Panel as they dispatch repair crews."
    },
    {
      q: "Are reports anonymous?",
      a: "Yes. Citizens can choose to submit reports anonymously, or provide their names if they wish to receive official credit or correspondence."
    },
    {
      q: "How do I report an issue?",
      a: "Click the 'Report Issue' tab, click anywhere on the Dombivli map to set the pin, fill in the details, attach a photo, and click Submit. The AI will do the rest!"
    }
  ];

  const helplines = [
    { name: "KDMC Toll-Free Helpline", number: "1800 233 7383", dept: "General Grievances" },
    { name: "KDMC Disaster Cell", number: "0251-2206206", dept: "Flooding & Hazards" },
    { name: "Dombivli Fire Station", number: "0251-2470357", dept: "Fire Emergencies" },
    { name: "Kalyan Fire Station", number: "0251-2315101", dept: "Fire Emergencies" },
    { name: "Shastri Nagar Hospital (Dombivli)", number: "0251-2480445", dept: "Medical Emergencies" },
    { name: "Kalyan Police Control", number: "0251-2315480", dept: "Law & Order" },
    { name: "KDMC Administrative Desk", number: "commissionerkdmc@gmail.com", dept: "Email Support" }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      
      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  const toggleFaq = (idx) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  return (
    <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div>
        <h3 className="form-title" style={{ fontSize: '22px' }}>FAQ & Civilian Support Hub</h3>
        <p className="form-subtitle">Find answers to civic questions, contact city administration, or find local helpline contacts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 4fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Left Column: FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={16} style={{ color: '#3b82f6' }} /> Frequently Asked Questions
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '12px',
                    background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'rgba(8, 12, 20, 0.2)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontSize: '14.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} style={{ color: '#3b82f6' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />}
                  </button>
                  
                  {isOpen && (
                    <div style={{ 
                      padding: '0 20px 16px 20px', 
                      fontSize: '13px', 
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6',
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                      paddingTop: '12px'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Helpline directory */}
          <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            <Phone size={16} style={{ color: '#10b981' }} /> Kalyan-Dombivli Emergency Helplines
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {helplines.map((help, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-light)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
                  {help.dept}
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {help.name}
                </span>
                <a 
                  href={help.number.includes('@') ? `mailto:${help.number}` : `tel:${help.number}`}
                  style={{ fontSize: '13.5px', color: '#3b82f6', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}
                >
                  {help.number.includes('@') ? <Mail size={12} /> : <Phone size={12} />} {help.number}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="glass-panel" style={{ background: 'rgba(8, 12, 20, 0.3)', width: '100%' }}>
          <h4 className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Mail size={16} style={{ color: '#ec4899' }} /> Send Direct Message to KDMC
          </h4>

          {isSuccess ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '14px' 
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto', display: 'inline-flex', justifyContent: 'center' }}>
                <Check size={24} />
              </div>
              <h5 style={{ fontSize: '16px', fontWeight: '700' }}>Message Dispatched!</h5>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Your feedback/grievance has been recorded in the KDMC system. A municipal support representative will review and coordinate resolution details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g., Atharva Patil" 
                  className="form-input" 
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="e.g., atharva@gmail.com" 
                  className="form-input" 
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  className="form-select"
                  disabled={isSubmitting}
                >
                  <option value="Feedback">General Feedback</option>
                  <option value="Inquiry">General Civic Inquiry</option>
                  <option value="Urgent">Urgent Civic Grievance</option>
                  <option value="AppIssue">Report Application Bug</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Grievance/Message Details</label>
                <textarea 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Provide precise details of your grievance, suggestions, or question..." 
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="form-submit-btn" style={{ background: '#ec4899' }}>
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
