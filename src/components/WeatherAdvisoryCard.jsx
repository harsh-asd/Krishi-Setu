import React, { useEffect, useState } from 'react';
import { CloudRain, Sun, Cloud, Thermometer, Wind, AlertTriangle, Droplets } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';

// Helper to interpret WMO weather codes
const getWeatherDetails = (code) => {
  if (code === 0) return { label: 'Clear sky', icon: <Sun size={24} color="#f59e0b" />, advisory: 'Perfect weather for harvesting and transporting crops.' };
  if (code >= 1 && code <= 3) return { label: 'Partly cloudy', icon: <Cloud size={24} color="#64748b" />, advisory: 'Good conditions for outdoor farm work.' };
  if (code >= 45 && code <= 48) return { label: 'Foggy', icon: <Cloud size={24} color="#94a3b8" />, advisory: 'Low visibility. Be careful if transporting crops today.' };
  if (code >= 51 && code <= 67) return { label: 'Rain expected', icon: <CloudRain size={24} color="#3b82f6" />, advisory: 'Delay harvesting. Ensure harvested crops are covered and stored dry.' };
  if (code >= 71 && code <= 82) return { label: 'Heavy showers', icon: <CloudRain size={24} color="#2563eb" />, advisory: 'Transport not recommended. Protect sensitive crops.' };
  if (code >= 95) return { label: 'Thunderstorm', icon: <AlertTriangle size={24} color="#ef4444" />, advisory: 'Stay indoors. Secure farm equipment and covered storage.' };
  return { label: 'Variable', icon: <Cloud size={24} color="#64748b" />, advisory: 'Monitor local conditions.' };
};

export default function WeatherAdvisoryCard({ lat, lng }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    // Default to Hyderabad, India if lat/lng are missing
    const latitude = lat || 17.3850;
    const longitude = lng || 78.4867;

    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
        const data = await res.json();
        
        if (data.current_weather) {
          const details = getWeatherDetails(data.current_weather.weathercode);
          setWeather({
            temp: data.current_weather.temperature,
            wind: data.current_weather.windspeed,
            ...details
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng]);

  if (loading) return (
    <div className="home-dashboard-card" style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
      <div className="loading-spin"><Sun size={24} /></div>
    </div>
  );

  if (!weather) return null;

  return (
    <div className="home-dashboard-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderLeft: '4px solid #0ea5e9', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {weather.icon}
            {language === 'hi' ? 'स्थानीय मौसम' : language === 'te' ? 'స్థానిక వాతావరణం' : 'Local Weather'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#475569' }}>
            {lat && lng ? 'Based on your farm location' : 'Based on default region'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{weather.temp}°C</div>
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <Wind size={12} /> {weather.wind} km/h
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px' }}>
          {language === 'hi' ? 'कृषि सलाह' : language === 'te' ? 'పంట సలహా' : 'Crop Advisory'}
        </div>
        <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.4' }}>
          <strong>{weather.label}:</strong> {weather.advisory}
        </p>
      </div>
    </div>
  );
}
