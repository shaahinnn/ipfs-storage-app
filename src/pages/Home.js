import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(0,243,255,0.3)' }}>
        Decentralized <br />
        <span style={{ color: 'var(--primary-cyan)' }}>Storage</span> Future
      </h1>

      <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto 3rem' }}>
        Store your files permanently on the InterPlanetary File System.
        Secure, distributed, and immutable.
      </p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        <Link to="/upload">
          <button className="btn">Start Uploading</button>
        </Link>
        <Link to="/retrieve">
          <button className="btn btn-secondary">Retrieve File</button>
        </Link>
      </div>

      <div style={{ marginTop: '4rem', opacity: 0.5 }}>
        <div style={{
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, var(--primary-purple) 0%, transparent 70%)',
          borderRadius: '50%',
          margin: '0 auto',
          filter: 'blur(40px)',
          animation: 'pulse 3s infinite'
        }}></div>
      </div>
    </div>
  );
};

export default Home;

