import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'active' : '';

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
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
