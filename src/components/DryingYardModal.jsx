import React, { useState } from 'react';
import { Sun, Wind, Map, Clock, X, CheckCircle2, Droplets, ThermometerSun } from 'lucide-react';

export default function DryingYardModal({ isOpen, onClose }) {
  const [selectedYard, setSelectedYard] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBook = () => {
    if (!selectedYard) return;
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="drying-yard-backdrop">
      <div className="drying-yard-modal">
        {/* Header */}
        <div className="drying-yard-header">
          <div>
            <h2>Reserve Drying Yard Space</h2>
            <p>Your crop moisture is <strong>19%</strong> (Limit: 17%). Sun-dry your crop before weighing.</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        {bookingSuccess ? (
          <div className="drying-yard-success">
            <CheckCircle2 size={64} color="#10b981" />
            <h3>Space Reserved Successfully!</h3>
            <p>Proceed to <strong>{selectedYard}</strong> immediately.</p>
            <div className="digital-token">Token: #DY-8829</div>
          </div>
        ) : (
          <div className="drying-yard-body">
            
            {/* Left Column: Metrics & Info */}
            <div className="drying-yard-info">
              <div className="info-card">
                <Droplets size={20} color="#3b82f6" />
                <div>
                  <span>Current Moisture</span>
                  <strong>19.2%</strong>
                </div>
              </div>
              <div className="info-card">
                <Sun size={20} color="#f59e0b" />
                <div>
                  <span>Est. Drying Time</span>
                  <strong>~3.5 Hours</strong>
                </div>
              </div>
              <div className="info-card">
                <ThermometerSun size={20} color="#ef4444" />
                <div>
                  <span>Current Weather</span>
                  <strong>32°C, Sunny</strong>
                </div>
              </div>

              <div className="advisory-box">
                <strong><Wind size={16}/> Best Practice:</strong> Spread grain in a thin layer (approx. 2-3 inches) and turn every 30 minutes for even drying.
              </div>
            </div>

            {/* Right Column: Yard Selection */}
            <div className="drying-yard-selection">
              <h3>Select Available Platform</h3>
              
              <div className="yard-grid">
                <div 
                  className={`yard-slot ${selectedYard === 'Platform A1' ? 'selected' : ''}`}
                  onClick={() => setSelectedYard('Platform A1')}
                >
                  <Map size={24} />
                  <strong>Platform A1</strong>
                  <span className="status available">Available Now</span>
                  <small>Capacity: 500kg</small>
                </div>

                <div className="yard-slot occupied">
                  <Map size={24} />
                  <strong>Platform A2</strong>
                  <span className="status">Occupied (1h left)</span>
                  <small>Capacity: 1000kg</small>
                </div>

                <div 
                  className={`yard-slot ${selectedYard === 'Platform B1' ? 'selected' : ''}`}
                  onClick={() => setSelectedYard('Platform B1')}
                >
                  <Map size={24} />
                  <strong>Platform B1</strong>
                  <span className="status available">Available Now</span>
                  <small>Capacity: 2000kg</small>
                </div>
                
                <div className="yard-slot occupied">
                  <Map size={24} />
                  <strong>Platform B2</strong>
                  <span className="status">Maintenance</span>
                  <small>Capacity: 500kg</small>
                </div>
              </div>

              <button 
                className="confirm-booking-btn" 
                disabled={!selectedYard}
                onClick={handleBook}
              >
                Confirm Reservation {selectedYard ? `(${selectedYard})` : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
