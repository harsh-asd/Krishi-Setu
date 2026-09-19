import { useState, useEffect } from "react";
import { Thermometer, Droplets, Bug, Sparkles, AlertTriangle, Radio, Search } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function IoTDashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch IoT data every 5 seconds to simulate real-time live updates
  useEffect(() => {
    let isMounted = true;
    
    const fetchIoTData = async () => {
      try {
        const response = await fetch(`${API_URL}/admin/iot/sensors`);
        const data = await response.json();
        
        if (data.success && isMounted) {
          setSensorData(data.data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch IoT data", err);
      }
    };

    fetchIoTData(); // Initial fetch
    const intervalId = setInterval(fetchIoTData, 5000); // Polling every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
        <Radio className="admin-refresh-spin" size={20} /> Connecting to IoT Sensors...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Radio size={24} color="#3b82f6" />
          <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 'bold' }}>
          Live IoT Storage Monitoring
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {sensorData.filter(center => center.centerName.toLowerCase().includes(searchQuery.toLowerCase()) || center.centerId.toLowerCase().includes(searchQuery.toLowerCase())).map((center) => (
          <div key={center.centerId} style={{ 
            background: 'white', 
            borderRadius: '12px', 
            border: `1px solid ${center.status === 'WARNING' ? '#fecdd3' : '#e2e8f0'}`,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              padding: '12px 16px', 
              background: center.status === 'WARNING' ? '#fff1f2' : '#f8fafc',
              borderBottom: `1px solid ${center.status === 'WARNING' ? '#fecdd3' : '#e2e8f0'}`,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}>
              <strong style={{ color: center.status === 'WARNING' ? '#9f1239' : '#334155' }}>{center.centerName}</strong>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 'bold', 
                padding: '2px 8px', 
                borderRadius: '999px',
                background: center.status === 'WARNING' ? '#e11d48' : '#10b981',
                color: 'white'
              }}>
                {center.status}
              </span>
            </div>
            
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* Temperature */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#fef08a', padding: '8px', borderRadius: '8px' }}><Thermometer size={18} color="#a16207" /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>TEMP</div>
                  <div style={{ fontWeight: 'bold', color: center.temperature >= 30 ? '#ef4444' : '#0f172a' }}>{center.temperature}°C</div>
                </div>
              </div>

              {/* Humidity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '8px' }}><Droplets size={18} color="#0369a1" /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>HUMIDITY</div>
                  <div style={{ fontWeight: 'bold', color: center.humidity >= 70 ? '#ef4444' : '#0f172a' }}>{center.humidity}%</div>
                </div>
              </div>

              {/* Quality */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#dcfce7', padding: '8px', borderRadius: '8px' }}><Sparkles size={18} color="#15803d" /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>QUALITY</div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{center.qualityScore}/100</div>
                </div>
              </div>

              {/* Pest Risk */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#fce7f3', padding: '8px', borderRadius: '8px' }}><Bug size={18} color="#be185d" /></div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>PEST RISK</div>
                  <div style={{ fontWeight: 'bold', color: center.pestRisk === 'HIGH' ? '#ef4444' : '#0f172a' }}>{center.pestRisk}</div>
                </div>
              </div>

            </div>

            {/* Alerts */}
            {center.alerts.length > 0 && (
              <div style={{ padding: '12px 16px', background: '#fef2f2', borderTop: '1px solid #fee2e2' }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {center.alerts.map((alert, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontSize: '0.875rem', fontWeight: '500' }}>
                      <AlertTriangle size={14} /> {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
