import React from 'react';

export default function IndianFlag({ size = 48, className = '' }) {
  return (
    <div 
      className={`indian-flag-container ${className}`} 
      style={{ 
        width: size, 
        height: size * 0.66,
        position: 'relative',
        display: 'inline-flex',
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.06)',
        animation: 'flag-wave 3s ease-in-out infinite'
      }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 900 600" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
      >
        <rect width="900" height="200" fill="#FF9933" />
        <rect y="200" width="900" height="200" fill="#FFFFFF" />
        <rect y="400" width="900" height="200" fill="#138808" />
        
        {/* Ashoka Chakra */}
        <g transform="translate(450, 300)" style={{ transformOrigin: '450px 300px', animation: 'chakra-spin 15s linear infinite' }}>
          <circle r="80" fill="none" stroke="#000080" strokeWidth="12" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line 
              key={i}
              x1="0" 
              y1="0" 
              x2="0" 
              y2="-80" 
              stroke="#000080" 
              strokeWidth="4" 
              transform={`rotate(${i * 15})`} 
            />
          ))}
          <circle r="15" fill="#000080" />
        </g>
      </svg>
      
      <style>{`
        @keyframes flag-wave {
          0% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(1.5deg); }
          50% { transform: translateY(0px) rotate(0deg); }
          75% { transform: translateY(1px) rotate(-1deg); }
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
