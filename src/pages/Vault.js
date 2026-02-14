// src/pages/Vault.js
import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

function Vault() {
    const [vaultItems, setVaultItems] = useState([]);
    const [decryptionKey, setDecryptionKey] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [status, setStatus] = useState('');

    // Preview Logic
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState('');
    const [previewName, setPreviewName] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem('vault_items') || '[]');
        setVaultItems(items);
    }, []);

    const handleDecrypt = (item) => {
        setSelectedItem(item);
        setStatus('');
        setDecryptionKey('');
        // Reset preview state
        setPreviewUrl(null);
        setShowPreview(false);
    };

    const processDecryption = async (mode = 'view') => {
        if (!decryptionKey) {
            alert("Please enter the password.");
            return;
        }

        setStatus('Fetching & Decrypting...');

        try {
            // 1. Fetch encrypted content from IPFS via backend
            const response = await fetch(`http://localhost:5000/download/${selectedItem.hash}`);
            if (!response.ok) throw new Error("Failed to fetch from IPFS");

            const encryptedContent = await response.text();

            // 2. Decrypt
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) {
                throw new Error('Wrong password or corrupted file.');
            }

            // 3. Parse JSON Payload
            let finalDataUrl = decryptedString;
            let finalFilename = selectedItem.name || `decrypted-${selectedItem.hash}`;
            let finalMime = 'application/octet-stream';

            try {
                const payload = JSON.parse(decryptedString);
                if (payload.data) {
                    finalDataUrl = payload.data;
                    finalFilename = payload.name || finalFilename;
                    finalMime = payload.type || finalMime;
                }
            } catch (e) {
                // Fallback for legacy files
            }

            // 4. Convert to Blob
            const arr = finalDataUrl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : finalMime;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
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

            setStatus(''); // Clear status

        } catch (err) {
            console.error(err);
            setStatus('Details: Decryption Failed. Wrong Password?');
        }
    };

    const triggerDownload = () => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = previewName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const closePreview = () => {
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setShowPreview(false);
        setSelectedItem(null); // Return to main vault view
    };

    const deleteItem = (index) => {
        if (!window.confirm("Remove this item from your vault? The file will remain on IPFS but you might lose track of it.")) return;
        const newItems = [...vaultItems];
        newItems.splice(index, 1);
        setVaultItems(newItems);
        localStorage.setItem('vault_items', JSON.stringify(newItems));
    };

    const renderPreviewContent = () => {
        if (!previewUrl) return null;

        if (previewType.startsWith('image/')) {
            return <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />;
        }
        if (previewType.startsWith('video/')) {
            return <video controls src={previewUrl} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />;
        }
        if (previewType.startsWith('audio/')) {
            return <audio controls src={previewUrl} style={{ width: '100%' }} />;
        }
        if (previewType === 'application/pdf') {
            return <iframe src={previewUrl} title="PDF Preview" style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />;
        }

        return (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <p>No preview available for this file type ({previewType}).</p>
                <p>Please download to view.</p>
            </div>
        );
    };

    return (
        <div className="glass-card">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Secure Vault</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '2rem' }}>
                Your personal encrypted file history. Passwords are NOT stored here.
            </p>

            {vaultItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No items in vault yet. Upload a file and check "Save to Vault".</p>
                </div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', tableLayout: 'fixed' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem', width: '50%' }}>File Name</th>
                            <th style={{ padding: '1rem', width: '25%' }}>Date</th>
                            <th style={{ padding: '1rem', width: '25%' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vaultItems.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{
                                    padding: '1rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }} title={item.name}>
                                    {item.name}
                                </td>
                                <td style={{ padding: '1rem' }}>{item.date}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => handleDecrypt(item)}
                                        className="btn btn-secondary"
                                        style={{ padding: '5px 15px', fontSize: '0.9rem', marginRight: '10px' }}
                                    >
                                        Decrypt
                                    </button>
                                    <button
                                        onClick={() => deleteItem(index)}
                                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Decryption Password Modal (Show if selected but NO preview yet) */}
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
                            Decrypting: {selectedItem.name}
                        </h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-dim)' }}>Enter the password used during upload:</p>
                        <input
                            type="password"
                            autoFocus
                            placeholder="Enter Password..."
                            value={decryptionKey}
                            onChange={(e) => setDecryptionKey(e.target.value)}
                            style={{ marginBottom: '2rem' }} // Minimal inline style, let CSS handle the rest
                        />

                        {status && <p style={{ color: status.includes('Success') ? 'var(--primary-cyan)' : '#ff4d4d', marginBottom: '1rem' }}>{status}</p>}

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button onClick={() => processDecryption('view')} className="btn" style={{ flex: 1 }}>Decrypt & View</button>
                            <button onClick={() => processDecryption('download')} className="btn btn-secondary" style={{ flex: 1 }}>Decrypt & Download</button>
                        </div>
                        <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', width: '100%', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Preview Modal (Show if preview exists) */}
            {showPreview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, backdropFilter: 'blur(5px)'
                }}>
                    <div className="glass-card" style={{ width: '800px', maxWidth: '95%', margin: 0, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                            Preview: {previewName}
                        </h3>

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {renderPreviewContent()}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={triggerDownload} className="btn" style={{ flex: 1 }}>Download File</button>
                            <button onClick={closePreview} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Vault;
