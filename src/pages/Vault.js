// src/pages/Vault.js
import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { IconLock, IconCopy, IconFile } from '../components/Icons';
import { copyToClipboardFallback } from '../utils/clipboard';

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

    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (hash, index) => {
        copyToClipboardFallback(hash).catch(err => console.error('Copy failed', err));
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

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

    const handleViewUnencrypted = (item) => {
        const portStr = window.location.port ? ':5002' : '';
        const apiBase = `http://${window.location.hostname}${portStr}`;
        setPreviewUrl(`${apiBase}/download/${item.hash}?type=view`);
        const ext = (item.name || '').split('.').pop().toLowerCase();
        let mime = 'application/octet-stream';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) mime = 'image/' + ext;
        else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) mime = 'video/' + ext;
        else if (['mp3', 'wav', 'aac'].includes(ext)) mime = 'audio/' + ext;
        else if (ext === 'pdf') mime = 'application/pdf';
        
        setPreviewType(mime);
        setPreviewName(item.name);
        setShowPreview(true);
    };

    const processDecryption = async (mode = 'view') => {
        if (!decryptionKey) {
            alert("Please enter the password.");
            return;
        }

        setStatus('Fetching from IPFS...');

        try {
            // 1. Fetch encrypted content from IPFS via backend
            const portStr = window.location.port ? ':5002' : '';
            const apiBase = `http://${window.location.hostname}${portStr}`;
            const response = await fetch(`${apiBase}/download/${selectedItem.hash}`);
            if (!response.ok) {
                setStatus('Failed to fetch file from IPFS. Check your connection.');
                return;
            }

            const encryptedContent = await response.text();
            setStatus('Decrypting...');

            // 2. Decrypt
            let decryptedString;
            try {
                const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
                decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
            } catch (e) {
                setStatus('Decryption error. The file may be corrupted.');
                return;
            }

            if (!decryptedString) {
                setStatus('Wrong password. Please try again.');
                return;
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
            console.error('Vault decrypt unexpected error:', err);
            setStatus('An unexpected error occurred. Check the console.');
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

    const handleExport = () => {
        if (vaultItems.length === 0) {
            alert("Vault is empty. Nothing to export.");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultItems));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "ipfs-vault-backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileReader = new FileReader();
        fileReader.readAsText(file, "UTF-8");
        fileReader.onload = e => {
            try {
                const importedItems = JSON.parse(e.target.result);
                if (Array.isArray(importedItems)) {
                    // Merge and deduplicate by hash
                    const currentHashes = new Set(vaultItems.map(i => i.hash));
                    const newItems = importedItems.filter(i => !currentHashes.has(i.hash));
                    const updatedVault = [...vaultItems, ...newItems];
                    setVaultItems(updatedVault);
                    localStorage.setItem('vault_items', JSON.stringify(updatedVault));
                    alert(`Successfully imported ${newItems.length} new items!`);
                } else {
                    alert("Invalid backup file format. Expected a JSON array.");
                }
            } catch (error) {
                alert("Error parsing backup file. Make sure it is a valid JSON.");
            }
        };
        event.target.value = null; // reset input
    };

    return (
        <div className="glass-card">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Secure Vault</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                Your personal encrypted file history. Passwords are NOT stored here.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={handleExport} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    EXPORT VAULT
                </button>
                <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px', cursor: 'pointer', margin: 0 }}>
                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    IMPORT VAULT
                </label>
            </div>

            {vaultItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>No items in vault yet. Upload a file and check "Save to Vault".</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {vaultItems.map((item, index) => (
                        <div key={index} className="vault-item-card" style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                            padding: '1.2rem', background: 'rgba(255,255,255,0.02)', 
                            borderRadius: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: 0 }}>
                                <div style={{ padding: '0.8rem', background: item.isEncrypted !== false ? 'rgba(188, 19, 254, 0.1)' : 'rgba(0, 243, 255, 0.1)', borderRadius: '12px', color: item.isEncrypted !== false ? 'var(--primary-purple)' : 'var(--primary-cyan)' }}>
                                    {item.isEncrypted !== false ? <IconLock size={24} /> : <IconFile size={24} />}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <h4 style={{ margin: '0 0 0.4rem 0', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1rem', letterSpacing: '0.5px', textTransform: 'none' }}>{item.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{item.date}</span>
                                        <div style={{ width: '4px', height: '4px', background: 'var(--glass-border)', borderRadius: '50%' }}></div>
                                        <div 
                                            className="hash-copy"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                                            onClick={() => handleCopy(item.hash, index)}
                                            title="Copy Hash"
                                        >
                                            {copiedIndex === index ? (
                                                <span style={{ color: '#00e676', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    Copied!
                                                </span>
                                            ) : (
                                                <>
                                                    <IconCopy size={14} color="var(--primary-cyan)" />
                                                    <span style={{ color: 'var(--primary-cyan)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        {item.hash.substring(0, 8)}...{item.hash.substring(item.hash.length - 8)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '1rem' }}>
                                {item.isEncrypted !== false ? (
                                    <button onClick={() => handleDecrypt(item)} className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                                        DECRYPT
                                    </button>
                                ) : (
                                    <button onClick={() => handleViewUnencrypted(item)} className="btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                                        VIEW
                                    </button>
                                )}
                                <button 
                                    className="btn-delete-vault"
                                    onClick={() => deleteItem(index)} 
                                    style={{ border: 'none', color: '#ff4d4d', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} 
                                    title="Remove from Vault"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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
