import React from 'react';

export default function IndianFlag({ size = 48, className = '' }) {
  return (
    <div 
      className={`indian-flag-container ${className}`} 
      style={{ 
        width: size, 
        height: size * 0.66,
        position: 'relative',
        display: 'inline-block',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
        animation: 'flag-wave 3s ease-in-out infinite'
      }}
    >
      <div style={{ background: '#FF9933', height: '33.34%', width: '100%' }} />
      <div style={{ background: '#FFFFFF', height: '33.33%', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          height: '85%', 
          aspectRatio: '1/1', 
          border: '1.5px solid #000080', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'chakra-spin 15s linear infinite'
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: '1px',
              height: '100%',
              background: '#000080',
              transform: `rotate(${i * 15}deg)`
            }} />
          ))}
        </div>
      </div>
      <div style={{ background: '#138808', height: '33.33%', width: '100%' }} />
      <style>{`
        @keyframes flag-wave {
          0% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(2px) rotate(-1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes chakra-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
