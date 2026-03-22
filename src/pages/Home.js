import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconCloud, IconDownload, IconBox, IconLock, IconFile, IconKey, IconFolder } from '../components/Icons';

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
  }, []);

  const total = stats.encryptedFiles + stats.plainFiles;
  const encryptedPercent = total > 0 ? (stats.encryptedFiles / total) * 100 : 0;
  const plainPercent = total > 0 ? (stats.plainFiles / total) * 100 : 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
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

      <section style={{ display: 'flex', justifyContent: 'center' }}>
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
    </div>
  );
};

export default Home;

