import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <div className="page-container">
                {children}
            </div>
        </>
    );
};

export default Layout;


