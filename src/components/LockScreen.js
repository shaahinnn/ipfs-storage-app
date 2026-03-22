import React, { useState, useEffect } from 'react';
import './LockScreen.css';

const LockScreen = ({ onUnlock }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const getStoredPin = () => localStorage.getItem('app_pin') || '1234';

    useEffect(() => {
        if (pin.length === 4) {
            if (pin === getStoredPin()) {
                sessionStorage.setItem('unlocked', 'true');
                onUnlock();
            } else {
                setError(true);
                setTimeout(() => {
                    setPin('');
                    setError(false);
                }, 500);
            }
        }
    }, [pin, onUnlock]);

    const handleNumberClick = (num) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="lockscreen-overlay">
            <div className={`lockscreen-container ${error ? 'shake' : ''}`}>
                <div className="lock-icon">🔒</div>
                <h2>Enter Session PIN</h2>
                <p>IPFS Secure Storage Vault</p>
                
                <div className="pin-display">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
                    ))}
                </div>

                <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleNumberClick(num.toString())} className="key-btn">
                            {num}
                        </button>
                    ))}
                    <button className="key-btn empty"></button>
                    <button onClick={() => handleNumberClick('0')} className="key-btn">0</button>
                    <button onClick={handleDelete} className="key-btn delete">⌫</button>
                </div>
            </div>
        </div>
    );
};

export default LockScreen;
