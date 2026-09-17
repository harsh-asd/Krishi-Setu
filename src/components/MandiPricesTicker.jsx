import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '../translations/LanguageContext';

const API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

export default function MandiPricesTicker() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    fetch(`${API_URL}/market/prices`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPrices(data.prices);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch mandi prices:", err);
        setLoading(false);
      });
  }, []);

  if (loading || prices.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      padding: '8px 0',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '4px 12px',
        fontWeight: 'bold',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        position: 'absolute',
        left: 0,
        zIndex: 2,
        height: '100%',
        borderRight: '2px solid #059669'
      }}>
        <TrendingUp size={14} /> 
        {language === 'hi' ? 'लाइव मंडी भाव' : language === 'te' ? 'లైవ్ మార్కెట్ ధరలు' : 'LIVE MANDI PRICES'}
      </div>
      
      <div style={{
        display: 'flex',
        whiteSpace: 'nowrap',
        animation: 'ticker 25s linear infinite',
        paddingLeft: '180px'
      }}>
        {prices.map((p, i) => (
          <div key={i} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            marginRight: '32px',
            fontSize: '14px',
            color: '#334155'
          }}>
            <span style={{ fontWeight: '600', marginRight: '8px' }}>{p.crop}:</span>
            <span style={{ color: p.trend === 'up' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
              ₹{p.price}/Qtl
            </span>
          </div>
        ))}
        {/* Duplicate for infinite seamless scroll */}
        {prices.map((p, i) => (
          <div key={`dup-${i}`} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            marginRight: '32px',
            fontSize: '14px',
            color: '#334155'
          }}>
            <span style={{ fontWeight: '600', marginRight: '8px' }}>{p.crop}:</span>
            <span style={{ color: p.trend === 'up' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
              ₹{p.price}/Qtl
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
