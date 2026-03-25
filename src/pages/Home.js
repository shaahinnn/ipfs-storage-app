import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconCloud, IconBox, IconLock, IconFile, IconKey, IconFolder } from '../components/Icons';

const Home = () => {
  const [stats, setStats] = useState({
    totalFiles: 0,
    encryptedFiles: 0,
    plainFiles: 0,
    vaultEntries: 0,
    folders: 0
  });

  useEffect(() => {
    const uploads = JSON.parse(localStorage.getItem('recentUploads') || '[]');
    const vault = JSON.parse(localStorage.getItem('vault_items') || '[]');
    const folders = JSON.parse(localStorage.getItem('folders') || '[]');
    
    // Check our new isEncrypted flag first, fallback to endsWith('.encrypted') for old records
    const encryptedCount = uploads.filter(f => f.isEncrypted || f.name.endsWith('.encrypted')).length;

    setStats({
      totalFiles: uploads.length,
      encryptedFiles: encryptedCount,
      plainFiles: uploads.length - encryptedCount,
      vaultEntries: vault.length,
      folders: folders.length
    });

    const storedMetrics = JSON.parse(localStorage.getItem('perf_metrics') || '[]');
    setPerfMetrics(storedMetrics);
  }, []);

  const [perfMetrics, setPerfMetrics] = useState([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const total = stats.encryptedFiles + stats.plainFiles;
  const encryptedPercent = total > 0 ? (stats.encryptedFiles / total) * 100 : 0;
  const plainPercent = total > 0 ? (stats.plainFiles / total) * 100 : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {showResetConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111114', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(255,77,77,0.3)', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            <h3 style={{ color: '#ff4d4d', fontSize: '1.4rem', margin: '0 0 1rem 0', letterSpacing: '1px' }}>RESET GRAPH?</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              This will permanently clear all your historical upload performance metrics. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('perf_metrics');
                  setPerfMetrics([]);
                  setShowResetConfirm(false);
                }}
                className="btn"
                style={{ flex: 1, padding: '0.8rem', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(255,77,77,0.4)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.2', margin: '0 0 1rem 0', letterSpacing: '2px' }}>
          DECENTRALIZED<br/>
          <span style={{ color: 'var(--primary-cyan)', textShadow: '0 0 20px rgba(0,243,255,0.4)' }}>STORAGE</span> FUTURE
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          Store your files permanently on the InterPlanetary File System. Secure, distributed, and immutable.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <Link to="/upload" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 2rem', fontSize: '1.1rem', letterSpacing: '1px' }}>
              <IconCloud size={20} /> UPLOAD FILE
            </button>
          </Link>
          <Link to="/retrieve" style={{ textDecoration: 'none' }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 2rem', fontSize: '1.1rem', letterSpacing: '1px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              RETRIEVE FILE
            </button>
          </Link>
        </div>
      </header>

      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ textAlign: 'center', color: 'var(--text-dim)', letterSpacing: '2px', fontSize: '1rem', marginBottom: '2rem', textTransform: 'uppercase' }}>
          Your Storage Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,243,255,0.15)'; e.currentTarget.style.borderColor = 'var(--primary-cyan)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ color: 'white', opacity: 0.8 }}><IconBox size={28} /></div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-cyan)', margin: '0', fontWeight: '600' }}>{stats.totalFiles}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Total Files</p>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(188,19,254,0.15)'; e.currentTarget.style.borderColor = 'var(--primary-purple)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ color: 'white', opacity: 0.8 }}><IconLock size={28} /></div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-purple)', margin: '0', fontWeight: '600' }}>{stats.encryptedFiles}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Encrypted</p>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ color: 'white', opacity: 0.8 }}><IconFile size={28} /></div>
            <h2 style={{ fontSize: '2.5rem', color: 'white', margin: '0', fontWeight: '600' }}>{stats.plainFiles}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Plain Files</p>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,189,58,0.15)'; e.currentTarget.style.borderColor = '#ffbd3a'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ color: 'white', opacity: 0.8 }}><IconKey size={28} /></div>
            <h2 style={{ fontSize: '2.5rem', color: '#ffbd3a', margin: '0', fontWeight: '600' }}>{stats.vaultEntries}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Vault Entries</p>
          </div>
          <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,230,118,0.15)'; e.currentTarget.style.borderColor = '#00e676'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ color: 'white', opacity: 0.8 }}><IconFolder size={28} /></div>
            <h2 style={{ fontSize: '2.5rem', color: '#00e676', margin: '0', fontWeight: '600' }}>{stats.folders}</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>Folders Created</p>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
        <div style={{ width: '400px', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,243,255,0.15)'; e.currentTarget.style.borderColor = 'var(--primary-cyan)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        >
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'white', fontWeight: '500' }}>Cryptographic Ratio</h3>
          
          {total > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ width: '100%', height: '24px', display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <div style={{ width: `${encryptedPercent}%`, background: 'var(--primary-cyan)', transition: 'width 1s ease' }}></div>
                 <div style={{ width: `${plainPercent}%`, background: 'var(--primary-purple)', transition: 'width 1s ease' }}></div>
               </div>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-cyan)' }}></div>
                   <span style={{ color: 'white' }}>Encrypted ({Math.round(encryptedPercent)}%)</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-purple)' }}></div>
                   <span style={{ color: 'white' }}>Plain-text ({Math.round(plainPercent)}%)</span>
                 </div>
               </div>
             </div>
          ) : (
             <p style={{textAlign: 'center', color: 'var(--text-dim)', padding: '1rem 0'}}>No data available yet.</p>
          )}
        </div>
      </section>

      {/* Custom Safe Performance Graph Section */}
      <section style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
        <div style={{ width: '800px', maxWidth: '100%', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--glass-border)', position: 'relative' }}>
          {perfMetrics.length > 0 && (
            <button 
              onClick={() => setShowResetConfirm(true)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.3s ease', letterSpacing: '0.5px' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ff4d4d'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#ff4d4d'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.1)'; e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)'; }}
            >
              Reset Graph
            </button>
          )}
          <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'white', fontWeight: '500' }}>Local Upload Performance Profiling</h3>
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Processing Time vs. File Size (Encrypted vs Plain-text)</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'white' }}><div style={{ width: '10px', height: '10px', background: 'var(--primary-cyan)', borderRadius: '2px' }}></div> Encrypted Upload</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'white' }}><div style={{ width: '10px', height: '10px', background: 'var(--primary-purple)', borderRadius: '2px' }}></div> Plain-Text Upload</span>
          </div>

          {perfMetrics.length > 0 ? (
            (() => {
              const recentMetrics = perfMetrics.slice(-20);
              const maxTime = Math.max(...recentMetrics.map(x => x.timeMs));
              return (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '250px', borderLeft: '1px solid rgba(255,255,255,0.2)', borderBottom: '1px solid rgba(255,255,255,0.2)', padding: '10px 10px 30px 10px', marginTop: '1rem' }}>
                  {recentMetrics.map((m, i) => {
                    const heightPct = maxTime === 0 ? 5 : (m.timeMs / maxTime) * 100;
                    const sizeMb = (m.sizeBytes / 1048576).toFixed(2);
                    const barColor = m.isEncrypted ? 'var(--primary-cyan)' : 'var(--primary-purple)';
                    const typeLabel = m.isEncrypted ? 'Encrypted' : 'Plain Text';
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} title={`Type: ${typeLabel}\nSize: ${sizeMb} MB\nTime: ${(m.timeMs / 1000).toFixed(2)} s`}>
                        <div style={{ width: '100%', height: `${heightPct}%`, background: barColor, borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.5s', cursor: 'pointer' }}
                             onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 10px #fff'; }} 
                             onMouseLeave={e => { e.currentTarget.style.background = barColor; e.currentTarget.style.boxShadow = 'none'; }}>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                          {sizeMb}MB
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
             <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
               Upload files to generate performance data.
             </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

