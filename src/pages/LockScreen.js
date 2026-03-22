// src/pages/LockScreen.js
import React, { useState } from 'react';
import { IconLock } from '../components/Icons';

const PIN_KEY = 'app_unlocked';
const SAVED_PIN_KEY = 'app_saved_pin';

const LockScreen = ({ onUnlock }) => {
    const savedPin = localStorage.getItem(SAVED_PIN_KEY);
    const isSetup = !savedPin;

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (pin.length !== 4) {
             setError('PIN must be exactly 4 digits.');
             return;
        }

        if (isSetup) {
             localStorage.setItem(SAVED_PIN_KEY, pin);
             sessionStorage.setItem(PIN_KEY, 'true');
             onUnlock();
        } else {
             if (pin === savedPin) {
                 sessionStorage.setItem(PIN_KEY, 'true');
                 onUnlock();
             } else {
                 setError('Incorrect PIN. Please try again.');
                 setShake(true);
                 setPin('');
                 setTimeout(() => setShake(false), 600);
             }
        }
    };

    const dotStyle = (filled) => ({
        width: '14px', height: '14px', borderRadius: '50%',
        border: '2px solid var(--primary-cyan)',
        background: filled ? 'var(--primary-cyan)' : 'transparent',
        transition: 'background 0.2s',
        boxShadow: filled ? '0 0 8px var(--primary-cyan)' : 'none'
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 50%, #0a0a1a 100%)',
            zIndex: 9999
        }}>
            {/* Ambient glow blobs */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,243,255,0.07) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '20%', right: '25%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(138, 43, 226,0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }} />

            <div style={{
                animation: shake ? 'shake 0.5s ease' : 'none',
                textAlign: 'center', zIndex: 1
            }}>
                <style>{`
                    @keyframes shake {
                        0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)}
                    }
                    @keyframes lockPulse { 0%,100%{transform:scale(1);opacity:0.9} 50%{transform:scale(1.08);opacity:1} }
                `}</style>

                {/* Lock icon */}
                <div style={{ marginBottom: '1rem', animation: 'lockPulse 2.5s infinite', display: 'flex', justifyContent: 'center' }}>
                    <IconLock size={64} color="var(--primary-cyan)" />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem', fontWeight: 700 }}>
                    IPFS.<span style={{ color: 'var(--primary-cyan)' }}>STORE</span>
                </h1>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
                    {isSetup ? "Create a new 4-digit PIN to secure your app" : "Enter your PIN to access the vault"}
                </p>

                {/* PIN dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '2rem' }}>
                    {[0,1,2,3].map(i => <div key={i} style={dotStyle(i < pin.length)} />)}
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        autoFocus
                        value={pin}
                        onChange={e => { setError(''); setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
                        placeholder="● ● ● ●"
                        style={{
                            textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.8rem',
                            width: '180px', padding: '0.8rem 1rem', borderRadius: '12px',
                            border: `2px solid ${error ? '#ff4d4d' : 'var(--glass-border)'}`,
                            background: 'rgba(255,255,255,0.06)', color: '#fff', outline: 'none',
                            marginBottom: '1.5rem', transition: 'border 0.2s'
                        }}
                    />
                    {error && <p style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}
                    <br />
                    <button type="submit" className="btn" style={{ width: '180px', marginTop: error ? 0 : '0.5rem' }}>
                        {isSetup ? "Save & Enter →" : "Unlock →"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
