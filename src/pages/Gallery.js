import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const Gallery = () => {
    const [uploads, setUploads] = useState([]);

    // Decryption & Preview State
    const [selectedItem, setSelectedItem] = useState(null); // The item being decrypted
    const [decryptionKey, setDecryptionKey] = useState('');
    const [status, setStatus] = useState('');

    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState('');
    const [previewName, setPreviewName] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const savedUploads = JSON.parse(localStorage.getItem('recentUploads') || '[]');
        setUploads(savedUploads);
    }, []);

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '📷';
        if (['mp4', 'webm', 'ogg'].includes(ext)) return '🎥';
        if (['pdf'].includes(ext)) return '📄';
        return '📁';
    };

    const isImage = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Removed alert to be less intrusive, maybe show a toast in future
    };

    // --- Decryption Logic (Reused Pattern) ---
    const initiateDecryption = (item) => {
        setSelectedItem(item);
        setStatus('');
        setDecryptionKey('');
        setPreviewUrl(null);
        setShowPreview(false);
    };

    const processDecryption = async (mode = 'view') => {
        if (!decryptionKey) {
            alert("Please enter the decryption password.");
            return;
        }
        setStatus('Decrypting...');

        try {
            // 1. Fetch encrypted content
            const response = await fetch(`http://localhost:5000/download/${selectedItem.hash}`);
            if (!response.ok) throw new Error("Failed to fetch from IPFS");
            const encryptedContent = await response.text();

            // 2. Decrypt
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) {
                throw new Error('Wrong password or corrupted file.');
            }

            // 3. Parse Metadata
            let finalDataUrl = decryptedString;
            let finalFilename = selectedItem.name;
            let finalMime = 'application/octet-stream';

            try {
                const payload = JSON.parse(decryptedString);
                if (payload.data) {
                    finalDataUrl = payload.data;
                    finalFilename = payload.name || finalFilename;
                    finalMime = payload.type || finalMime;
                }
            } catch (e) { /* legacy */ }

            // 4. Create Blob/URL
            const arr = finalDataUrl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : finalMime;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);

            const blob = new Blob([u8arr], { type: mime });
            const url = window.URL.createObjectURL(blob);

            // 5. Handle Mode
            if (mode === 'view') {
                setPreviewUrl(url);
                setPreviewType(mime);
                setPreviewName(finalFilename);
                setShowPreview(true);
            } else {
                // Download directly
                const a = document.createElement('a');
                a.href = url;
                a.download = finalFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                setSelectedItem(null); // Close modal
            }
            setStatus('');

        } catch (error) {
            console.error(error);
            setStatus('Failed: Wrong Password?');
        }
    };

    const closePreview = () => {
        if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setShowPreview(false);
        setSelectedItem(null);
    };

    const triggerDownloadFromPreview = () => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = previewName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const renderPreviewContent = () => {
        if (!previewUrl) return null;
        if (previewType.startsWith('image/')) return <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />;
        if (previewType.startsWith('video/')) return <video controls src={previewUrl} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />;
        if (previewType.startsWith('audio/')) return <audio controls src={previewUrl} style={{ width: '100%' }} />;
        if (previewType === 'application/pdf') return <iframe src={previewUrl} title="PDF" style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />;
        return <div style={{ padding: '2rem' }}>No preview for this type. Please download.</div>;
    };


    return (
        <div className="glass-card" style={{ maxWidth: '1200px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>My Personal Gallery</h2>

            {uploads.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    <p>No uploads found in this browser.</p>
                    <p>Go to the Upload page to add some files!</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '2rem'
                }}>
                    {uploads.map((item, index) => (
                        <div key={index} style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '1rem',
                            border: '1px solid var(--glass-border)',
                            transition: 'transform 0.3s ease',
                        }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-cyan)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                        >
                            <div style={{
                                height: '180px',
                                marginBottom: '1rem',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: 'rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                position: 'relative'
                            }}>
                                {isImage(item.name) ? (
                                    <img
                                        src={`http://localhost:5000/download/${item.hash}?type=view`}
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            // Show lock icon if image fails to load (likely encrypted)
                                            e.target.parentElement.innerHTML = '<span style="font-size: 3rem">🔒</span>';
                                        }}
                                    />
                                ) : (
                                    <span>{getFileIcon(item.name)}</span>
                                )}
                            </div>

                            <h3 style={{
                                fontSize: '1.1rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '0.5rem'
                            }} title={item.name}>
                                {item.name}
                            </h3>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                {item.date}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => initiateDecryption(item)}
                                    className="btn"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: 'var(--primary-cyan)', color: '#000' }}
                                >
                                    Decrypt
                                </button>

                                <button
                                    onClick={() => copyToClipboard(item.hash)}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                                    title="Copy Hash"
                                >
                                    📋
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Remove from history?')) {
                                            const updatedUploads = uploads.filter((_, i) => i !== index);
                                            setUploads(updatedUploads);
                                            localStorage.setItem('recentUploads', JSON.stringify(updatedUploads));
                                        }
                                    }}
                                    className="btn"
                                    style={{
                                        padding: '0.5rem',
                                        fontSize: '0.9rem',
                                        background: 'rgba(255, 77, 77, 0.2)',
                                        color: '#ff4d4d',
                                        border: '1px solid #ff4d4d'
                                    }}
                                    title="Remove"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Password Modal */}
            {selectedItem && !showPreview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="glass-card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 style={{
                            marginBottom: '1rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                        }} title={selectedItem.name}>
                            Decrypt: {selectedItem.name}
                        </h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>Enter password to view/download.</p>
                        <input
                            type="password"
                            autoFocus
                            placeholder="Password..."
                            value={decryptionKey}
                            onChange={(e) => setDecryptionKey(e.target.value)}
                            style={{ marginBottom: '1.5rem' }}
                        />
                        {status && <p style={{ color: '#ff4d4d', marginBottom: '1rem' }}>{status}</p>}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button onClick={() => processDecryption('view')} className="btn" style={{ flex: 1 }}>Decrypt & View</button>
                            <button onClick={() => processDecryption('download')} className="btn btn-secondary" style={{ flex: 1 }}>Decrypt & Download</button>
                        </div>
                        <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', width: '100%', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="glass-card" style={{ width: '900px', maxWidth: '95%', maxHeight: '95vh', overflowY: 'auto', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                            <h3 style={{
                                flex: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginRight: '1rem'
                            }} title={previewName}>
                                {previewName}
                            </h3>
                            <button onClick={closePreview} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {renderPreviewContent()}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={triggerDownloadFromPreview} className="btn">Download File</button>
                            <button onClick={closePreview} className="btn btn-secondary">Close Preview</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
