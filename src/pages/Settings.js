import React, { useState } from 'react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const [pinInput, setPinInput] = useState('');
    const [showToast, ToastContainer] = useToast();
    const navigate = useNavigate();

    const handlePinChange = (e) => {
        e.preventDefault();
        if (!/^\d{4}$/.test(pinInput)) {
            showToast('New PIN must be exactly 4 digits.', 'error');
            return;
        }
        localStorage.setItem('app_pin', pinInput);
        setPinInput('');
        showToast('PIN successfully updated!', 'success');
    };

    const handleClearData = () => {
        const confirmClear = window.confirm(
            "WARNING: This will permanently delete all your local application data including your Virtual File System, folders, and vault.\n\nFiles already pinned to IPFS will remain on the network but you will lose your local references to them.\n\nAre you sure you want to proceed?"
        );
        
        if (confirmClear) {
            // Keep only the PIN and dark mode settings if needed, but the plan was to clear everything.
            localStorage.clear();
            sessionStorage.removeItem('unlocked');
            showToast('All local data cleared. Redirecting...', 'warn');
            
            // Redirect to lock screen after a short delay
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }
    };

    return (
        <div className="page-container">
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    Application Settings
                </h2>

                {/* PIN Management Section */}
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ color: 'var(--primary-cyan)', marginBottom: '1rem', fontSize: '1.2rem' }}>
                        Security
                    </h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Change your 4-digit master PIN used to unlock this application.
                    </p>
                    
                    <form onSubmit={handlePinChange} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="password"
                            placeholder="Enter new 4-digit PIN"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            maxLength={4}
                            className="input-field"
                            style={{ flex: 1, letterSpacing: '3px', fontSize: '1.2rem' }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                            Update PIN
                        </button>
                    </form>
                </div>

                {/* Data Management Section */}
                <div>
                    <h3 style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '1.2rem' }}>
                        Danger Zone
                    </h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Wipe all local data stored in your browser. This will remove your upload history, folders, vault items, and performance metrics.
                    </p>
                    
                    <button 
                        onClick={handleClearData} 
                        className="btn" 
                        style={{ 
                            background: 'rgba(255, 77, 77, 0.1)', 
                            border: '1px solid rgba(255, 77, 77, 0.4)',
                            color: '#ff4d4d',
                            width: '100%'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = 'rgba(255, 77, 77, 0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(255, 77, 77, 0.1)';
                        }}
                    >
                        Clear All Local Data
                    </button>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Settings;
