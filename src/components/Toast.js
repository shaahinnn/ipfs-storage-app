import React, { useState, useCallback } from 'react';

// A simple hook that returns [toasts, showToast, ToastContainer]
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const ToastContainer = () => (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            pointerEvents: 'none'
        }}>
            {toasts.map(toast => (
                <div key={toast.id} style={{
                    background: toast.type === 'error'
                        ? 'rgba(255, 60, 60, 0.15)'
                        : toast.type === 'warn'
                        ? 'rgba(255, 165, 0, 0.15)'
                        : 'rgba(0, 243, 255, 0.12)',
                    border: `1px solid ${
                        toast.type === 'error' ? 'rgba(255,60,60,0.5)'
                        : toast.type === 'warn' ? 'rgba(255,165,0,0.5)'
                        : 'rgba(0,243,255,0.4)'
                    }`,
                    color: '#fff',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '10px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    fontSize: '0.9rem',
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    animation: 'slideInToast 0.25s ease',
                    minWidth: '220px',
                    maxWidth: '340px'
                }}>
                    <span style={{ fontSize: '1rem' }}>
                        {toast.type === 'error' ? '✕' : toast.type === 'warn' ? '⚠' : '✓'}
                    </span>
                    {toast.message}
                </div>
            ))}
            <style>{`
                @keyframes slideInToast {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );

    return [showToast, ToastContainer];
};
