import React from 'react';

const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1rem'
  }}>
    <div className="spinner" style={{
      width: size,
      height: size,
      border: '3px solid rgba(0, 243, 255, 0.1)',
      borderTop: '3px solid var(--primary-cyan)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    {message && <p style={{ color: 'var(--primary-cyan)', fontSize: '0.9rem', fontWeight: '500' }}>{message}</p>}
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;
