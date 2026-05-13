import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import SettingsModal from './SettingsModal';

const Navbar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'active' : '';
    const [showQR, setShowQR] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [lanIp, setLanIp] = useState('');

    useEffect(() => {
        const portStr = window.location.port ? ':5002' : '';
        const apiBase = `http://${window.location.hostname}${portStr}`;
        fetch(`${apiBase}/ip`)
            .then(res => res.json())
            .then(data => setLanIp(`http://${data.ip}:3000`))
            .catch(() => setLanIp(''));
    }, []);

    return (
        <nav className="navbar">
            <div className="nav-content">
                <Link to="/" className="logo">IPFS<span>.Store</span></Link>
                <div className="nav-links">
                    <Link to="/" className={isActive('/')}>Home</Link>
                    <Link to="/upload" className={isActive('/upload')}>Upload</Link>
                    <Link to="/gallery" className={isActive('/gallery')}>Gallery</Link>
                    <Link to="/retrieve" className={isActive('/retrieve')}>Retrieve</Link>
                    <Link to="/vault" className={isActive('/vault')}>Secure Vault</Link>
                    {lanIp && (
                        <button title="LAN Access QR" className="icon-btn" style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem', display: 'flex', alignItems: 'center'}} onClick={() => setShowQR(true)}>
                            📱
                        </button>
                    )}
                    <button 
                        title="Settings" 
                        className="icon-btn" 
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 0.5rem', transition: 'color 0.3s' }} 
                        onClick={() => setShowSettings(true)}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-cyan)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                </div>
            </div>

            {showQR && ReactDOM.createPortal(
                <div className="qr-modal-overlay" onClick={() => setShowQR(false)} style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999}}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()} style={{background: '#1a1a2e', padding: '2rem', borderRadius: '15px', textAlign: 'center'}}>
                        <h3 style={{color: 'white', marginBottom: '1rem'}}>LAN Access</h3>
                        <p style={{color: 'var(--text-dim)', marginBottom: '1.5rem'}}>
                            Scan to open on your phone<br/>
                            <span style={{ color: '#ffbd3a', fontSize: '0.8rem' }}>(Ensure both devices are on the same Wi-Fi network)</span><br/>
                            <span style={{ color: 'var(--primary-cyan)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'inline-block' }}>Default PIN: 1234</span>
                        </p>
                        <div style={{background: 'white', padding: '1rem', borderRadius: '10px', display: 'inline-block'}}>
                            <QRCodeSVG value={lanIp} size={200} />
                        </div>
                        <p style={{marginTop: '1rem', color: 'var(--primary-cyan)'}}>{lanIp}</p>
                        <button onClick={() => setShowQR(false)} className="btn btn-secondary" style={{ marginTop: '1.5rem', padding: '0.6rem 2rem', fontSize: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem auto 0' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            CLOSE
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </nav>
    );
};

export default Navbar;
