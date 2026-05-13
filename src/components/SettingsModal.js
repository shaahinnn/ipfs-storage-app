import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useToast } from './Toast';

const SettingsModal = ({ onClose }) => {
    // PIN Change State
    const [pinCurrentInput, setPinCurrentInput] = useState('');
    const [pinNewInput, setPinNewInput] = useState('');
    const [pinConfirmInput, setPinConfirmInput] = useState('');
    const [pinMessage, setPinMessage] = useState(null);
    
    const [showToast, ToastContainer] = useToast();

    const handleChangePin = (e) => {
        if (e) e.preventDefault();
        const storedPin = localStorage.getItem('app_pin') || '1234';
        
        if (pinCurrentInput !== storedPin) {
            setPinMessage({ type: 'error', text: 'Current PIN is incorrect.' });
            return;
        }
        if (!/^\d{4}$/.test(pinNewInput)) {
            setPinMessage({ type: 'error', text: 'New PIN must be exactly 4 digits.' });
            return;
        }
        if (pinNewInput !== pinConfirmInput) {
            setPinMessage({ type: 'error', text: 'New PINs do not match.' });
            return;
        }
        
        localStorage.setItem('app_pin', pinNewInput);
        setPinMessage({ type: 'success', text: 'PIN updated successfully!' });
        showToast('PIN updated successfully!', 'success');
        
        setTimeout(() => {
            setPinCurrentInput('');
            setPinNewInput('');
            setPinConfirmInput('');
            setPinMessage(null);
        }, 1500);
    };

    const handleClearData = () => {
        const confirmClear = window.confirm(
            "WARNING: This will permanently delete all your local application data including your Virtual File System, folders, and vault.\n\nFiles already pinned to IPFS will remain on the network but you will lose your local references to them.\n\nAre you sure you want to proceed?"
        );
        
        if (confirmClear) {
            localStorage.clear();
            sessionStorage.removeItem('unlocked');
            showToast('All local data cleared. Redirecting...', 'warn');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }
    };

    return ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ background: '#1c1c1e', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '420px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'white', margin: 0, fontSize: '1.2rem', textTransform: 'uppercase' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Settings
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* PIN Management Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter your current PIN to set a new 4-digit PIN.</p>
                    
                    <form onSubmit={handleChangePin}>
                        {[
                            { label: 'Current PIN', value: pinCurrentInput, setter: setPinCurrentInput, placeholder: '••••' },
                            { label: 'New PIN (4 digits)', value: pinNewInput, setter: setPinNewInput, placeholder: '••••' },
                            { label: 'Confirm New PIN', value: pinConfirmInput, setter: setPinConfirmInput, placeholder: '••••' },
                        ].map((field, i) => (
                            <div key={i} style={{ marginBottom: '0.8rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>{field.label}</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    placeholder={field.placeholder}
                                    value={field.value}
                                    onChange={e => field.setter(e.target.value.replace(/\D/g, '').slice(0,4))}
                                    style={{ width: '100%', padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '1.1rem', letterSpacing: '0.3rem', transition: 'border-color 0.3s' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--primary-cyan)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                                />
                            </div>
                        ))}

                        {pinMessage && (
                            <p style={{ color: pinMessage.type === 'error' ? '#ff4d4d' : '#00e676', marginBottom: '0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {pinMessage.type === 'success' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                {pinMessage.text}
                            </p>
                        )}

                        <button type="submit" className="btn" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                            UPDATE PIN
                        </button>
                    </form>
                </div>

                {/* Data Management Section */}
                <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ff4d4d', marginBottom: '0.5rem', fontSize: '1rem', textTransform: 'uppercase' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Danger Zone
                    </h3>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Wipe all local data stored in your browser. This will remove your upload history, folders, and vault items.
                    </p>
                    
                    <button 
                        onClick={handleClearData} 
                        className="btn" 
                        style={{ 
                            background: 'rgba(255, 77, 77, 0.1)', 
                            border: '1px solid rgba(255, 77, 77, 0.4)',
                            color: '#ff4d4d',
                            width: '100%',
                            padding: '0.8rem', 
                            borderRadius: '8px'
                        }}
                        onMouseOver={(e) => { e.target.style.background = 'rgba(255, 77, 77, 0.2)'; }}
                        onMouseOut={(e) => { e.target.style.background = 'rgba(255, 77, 77, 0.1)'; }}
                    >
                        CLEAR ALL LOCAL DATA
                    </button>
                </div>
            </div>
            <ToastContainer />
        </div>,
        document.body
    );
};

export default SettingsModal;
