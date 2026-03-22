import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const Navbar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'active' : '';
    const [showQR, setShowQR] = useState(false);
    const [lanIp, setLanIp] = useState('');

    useEffect(() => {
        fetch('http://localhost:5002/ip')
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
                        <button className="icon-btn" style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', fontSize: '1.2rem'}} onClick={() => setShowQR(true)}>
                            📱
                        </button>
                    )}
                </div>
            </div>

            {showQR && ReactDOM.createPortal(
                <div className="qr-modal-overlay" onClick={() => setShowQR(false)} style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999}}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()} style={{background: '#1a1a2e', padding: '2rem', borderRadius: '15px', textAlign: 'center'}}>
                        <h3 style={{color: 'white', marginBottom: '1rem'}}>LAN Access</h3>
                        <p style={{color: 'var(--text-dim)', marginBottom: '1.5rem'}}>Scan to open on your phone</p>
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
        </nav>
    );
};

export default Navbar;
