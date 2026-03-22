import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { QRCodeSVG } from 'qrcode.react';
import { IconFile, IconLock, IconFolder, IconCopy, IconTrash, IconDownload, IconQR } from '../components/Icons';

const Gallery = () => {
    // === 1. Storage & Organization State ===
    const [uploads, setUploads] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null); // null = Root, string = folderId

    // === 2. Modals & UI State ===
    const [contextMenu, setContextMenu] = useState(null); // { x, y, item, isFolder }
    
    // Create/Rename Folder Modal
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderModalMode, setFolderModalMode] = useState('create'); // 'create' or 'rename'
    const [folderNameInput, setFolderNameInput] = useState('');
    const [activeFolderId, setActiveFolderId] = useState(null);

    // Move File Modal
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [fileToMove, setFileToMove] = useState(null);
    const [moveDestinationId, setMoveDestinationId] = useState('root');
    const [newMoveFolderName, setNewMoveFolderName] = useState('');

    // QR Share Modal
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrHash, setQrHash] = useState('');

    // Change PIN Modal
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinCurrentInput, setPinCurrentInput] = useState('');
    const [pinNewInput, setPinNewInput] = useState('');
    const [pinConfirmInput, setPinConfirmInput] = useState('');
    const [pinMessage, setPinMessage] = useState(null); // { type: 'error'|'success', text }

    const handleChangePin = () => {
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
        setTimeout(() => {
            setShowPinModal(false);
            setPinCurrentInput('');
            setPinNewInput('');
            setPinConfirmInput('');
            setPinMessage(null);
        }, 1500);
    };

    // === 3. Decryption & Preview State ===
    const [selectedItem, setSelectedItem] = useState(null);
    const [decryptionKey, setDecryptionKey] = useState('');
    const [status, setStatus] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewType, setPreviewType] = useState('');
    const [previewName, setPreviewName] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Network IP for QR Sharing
    const [localIp, setLocalIp] = useState('localhost');

    // Drag-and-drop
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    const getFileTypeBadge = (filename, isEncrypted) => {
        if (isEncrypted) return { label: 'ENC', color: '#bc13fe' };
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg','jpeg','png','gif','webp'].includes(ext)) return { label: 'IMAGE', color: '#00f3ff' };
        if (['mp4','webm','ogg','mov'].includes(ext)) return { label: 'VIDEO', color: '#ff6b35' };
        if (ext === 'pdf') return { label: 'PDF', color: '#ff4d4d' };
        if (['mp3','wav','aac'].includes(ext)) return { label: 'AUDIO', color: '#00e676' };
        return { label: 'DOC', color: '#ffbd3a' };
    };

    const formatSize = (bytes) => {
        if (!bytes || bytes === 0) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    useEffect(() => {
        // Fetch local IP on mount
        fetch('http://localhost:5002/ip')
            .then(res => res.json())
            .then(data => setLocalIp(data.ip))
            .catch(() => setLocalIp('localhost'));

        const savedUploads = JSON.parse(localStorage.getItem('recentUploads') || '[]');
        const validUploads = savedUploads.filter(item => item && item.hash && item.hash !== 'undefined' && item.hash !== null);
        if (validUploads.length !== savedUploads.length) {
            localStorage.setItem('recentUploads', JSON.stringify(validUploads));
        }
        setUploads(validUploads);

        const savedFolders = JSON.parse(localStorage.getItem('folders') || '[]');
        setFolders(savedFolders);

        // Global click to close context menu
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Helper: Save state to localStorage
    const saveUploads = (newUploads) => {
        setUploads(newUploads);
        localStorage.setItem('recentUploads', JSON.stringify(newUploads));
    };
    
    const saveFolders = (newFolders) => {
        setFolders(newFolders);
        localStorage.setItem('folders', JSON.stringify(newFolders));
    };


    // === File & Folder Actions ===

    const createFolder = (name) => {
        const newFolder = { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
        saveFolders([...folders, newFolder]);
        return newFolder;
    };

    const handleFolderSubmit = () => {
        if (!folderNameInput.trim()) return;
        if (folderModalMode === 'create') {
            createFolder(folderNameInput.trim());
        } else {
            const updated = folders.map(f => f.id === activeFolderId ? { ...f, name: folderNameInput.trim() } : f);
            saveFolders(updated);
        }
        setShowFolderModal(false);
    };

    const handleMoveSubmit = () => {
        if (!fileToMove) return;
        let destId = moveDestinationId;

        // If user typed a new folder name, create it and use its ID
        if (newMoveFolderName.trim() !== '') {
            const newFolder = createFolder(newMoveFolderName.trim());
            destId = newFolder.id;
        }

        const updated = uploads.map(u => u.hash === fileToMove.hash ? { ...u, folderId: destId === 'root' ? null : destId } : u);
        saveUploads(updated);
        setShowMoveModal(false);
        setNewMoveFolderName('');
    };

    const deleteFolder = (id) => {
        if (!window.confirm("Are you sure? Files inside will be moved to Root.")) return;
        saveFolders(folders.filter(f => f.id !== id));
        const updated = uploads.map(u => u.folderId === id ? { ...u, folderId: null } : u);
        saveUploads(updated);
    };

    const deleteFile = (hash) => {
        if (!window.confirm("Remove file from history?")) return;
        saveUploads(uploads.filter(u => u.hash !== hash));
    };

    const [copiedMenuHash, setCopiedMenuHash] = useState(null);
    const copyToClipboard = (text, e) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedMenuHash(text);
        setTimeout(() => {
            setCopiedMenuHash(null);
            setContextMenu(null);
        }, 1500);
    };

    const [vaultFeedback, setVaultFeedback] = useState(null);
    const saveToVault = (item, e) => {
        if (e) e.stopPropagation();
        const vault = JSON.parse(localStorage.getItem('vault_items') || '[]');
        let status = '';
        if (!vault.find(v => v.hash === item.hash)) {
            vault.push({ ...item, addedToVaultAt: new Date().toISOString() });
            localStorage.setItem('vault_items', JSON.stringify(vault));
            status = 'saved';
        } else {
            status = 'exists';
        }
        setVaultFeedback({ hash: item.hash, status });
        setTimeout(() => {
            setVaultFeedback(null);
            setContextMenu(null);
        }, 1500);
    };


    // === Render Helpers ===
    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '📷';
        if (['mp4', 'webm', 'ogg'].includes(ext)) return '🎥';
        if (['pdf'].includes(ext)) return '📄';
        return '📄';
    };

    const isImage = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    const isVideo = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        return ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
    };

    const openContextMenu = (e, item, isFolder) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            item,
            isFolder
        });
    };

    // Filter items based on current view
    const visibleFolders = currentFolder === null ? folders : [];
    const visibleFiles = uploads.filter(u => currentFolder === null ? !u.folderId : u.folderId === currentFolder);

    const currentFolderName = currentFolder ? folders.find(f => f.id === currentFolder)?.name : '';


    // === Decryption Engine ===
    const initiateDecryption = (item) => {
        setSelectedItem(item);
        setStatus('');
        setDecryptionKey('');
        setPreviewUrl(null);
        setShowPreview(false);
    };

    const processDecryption = async (mode = 'view') => {
        if (!decryptionKey) { alert("Please enter the decryption password."); return; }
        setStatus('Decrypting...');
        try {
            const response = await fetch(`http://localhost:5002/download/${selectedItem.hash}`);
            if (!response.ok) throw new Error("Failed to fetch from IPFS");
            const encryptedContent = await response.text();
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
            const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) throw new Error('Wrong password or corrupted file.');

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

            const arr = finalDataUrl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : finalMime;
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            const blob = new Blob([u8arr], { type: mime });
            const url = window.URL.createObjectURL(blob);

            if (mode === 'view') {
                setPreviewUrl(url); setPreviewType(mime); setPreviewName(finalFilename); setShowPreview(true);
            } else {
                const a = document.createElement('a'); a.href = url; a.download = finalFilename;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                window.URL.revokeObjectURL(url); setSelectedItem(null);
            }
            setStatus('');
        } catch (error) {
            setStatus('Failed: Wrong Password?');
        }
    };

    const closePreview = () => {
        if (previewUrl && previewUrl.startsWith('blob:')) window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null); setShowPreview(false); setSelectedItem(null);
    };

    const getMimeType = (filename) => {
        if (!filename) return 'application/octet-stream';
        const ext = filename.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image/' + ext;
        if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video/' + ext;
        if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio/' + ext;
        if (ext === 'pdf') return 'application/pdf';
        return 'application/octet-stream';
    };

    const viewPlainFile = (file) => {
        setPreviewUrl(`http://localhost:5002/download/${file.hash}?type=view`);
        setPreviewType(getMimeType(file.name));
        setPreviewName(file.name);
        setShowPreview(true);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            
            {/* Context/Breadcrumbs Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', letterSpacing: '2px', color: 'var(--text-dim)' }}>
                    {currentFolder ? (
                        <>
                            <span 
                                onClick={() => setCurrentFolder(null)} 
                                style={{ cursor: 'pointer', transition: 'color 0.3s' }}
                                onMouseEnter={(e) => e.target.style.color = "white"}
                                onMouseLeave={(e) => e.target.style.color = "var(--text-dim)"}
                            >
                                GALLERY
                            </span> 
                            <span>/</span> 
                            <span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>{currentFolderName.toUpperCase()}</span>
                        </>
                    ) : (
                        <span style={{ color: 'white' }}>RECENT UPLOADS</span>
                    )}
                </h2>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={() => {
                            setFolderModalMode('create');
                            setFolderNameInput('');
                            setShowFolderModal(true);
                        }}
                        title="New Folder"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', fontSize: '1.2rem' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        +
                    </button>
                    <button
                        onClick={() => {
                            setPinCurrentInput('');
                            setPinNewInput('');
                            setPinConfirmInput('');
                            setPinMessage(null);
                            setShowPinModal(true);
                        }}
                        title="Change PIN"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--primary-cyan)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,243,255,0.1)'; e.currentTarget.style.borderColor = 'var(--primary-cyan)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </button>
                </div>
            </div>
            
            <div style={{ background: 'rgba(255,160,0,0.1)', padding: '0.8rem 1.2rem', borderRadius: '4px', borderLeft: '4px solid #ffa000', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                <strong style={{ color: '#ffa000' }}>Local Session View:</strong> This history is tied to your browser cache. For permanent record-keeping, open the 3-dot menu and select Save to Vault.
            </div>

            {/* Folders Section */}
            {visibleFolders.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    {visibleFolders.map(folder => (
                        <div key={folder.id} 
                            style={{ 
                                background: dragOverFolderId === folder.id ? 'rgba(0,243,255,0.08)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${dragOverFolderId === folder.id ? 'var(--primary-cyan)' : 'var(--glass-border)'}`,
                                borderRadius: '12px', padding: '0.8rem 1rem', 
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer',
                                transition: 'all 0.2s ease', minWidth: '200px'
                            }}
                            onClick={() => setCurrentFolder(folder.id)}
                            onMouseEnter={e => { if (dragOverFolderId !== folder.id) e.currentTarget.style.borderColor = 'var(--primary-cyan)'; }}
                            onMouseLeave={e => { if (dragOverFolderId !== folder.id) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                            onDragOver={e => { e.preventDefault(); setDragOverFolderId(folder.id); }}
                            onDragLeave={() => setDragOverFolderId(null)}
                            onDrop={e => {
                                e.preventDefault();
                                const draggedHash = e.dataTransfer.getData('fileHash');
                                if (draggedHash) {
                                    const updated = uploads.map(u => u.hash === draggedHash ? { ...u, folderId: folder.id } : u);
                                    saveUploads(updated);
                                }
                                setDragOverFolderId(null);
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <IconFolder size={20} color="var(--primary-cyan)" />
                                <span style={{ color: 'white', fontWeight: '500', fontSize: '1rem' }}>{folder.name}</span>
                            </div>
                            <div 
                                style={{ padding: '0.4rem', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', cursor: 'pointer', transition: 'background 0.2s' }}
                                onClick={(e) => openContextMenu(e, folder, true)}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>

                {/* Render Files */}
                {visibleFiles.map(file => {
                    const badge = getFileTypeBadge(file.name, file.isEncrypted);
                    const sizeStr = formatSize(file.size);
                    return (
                    <div key={file.hash}
                        draggable
                        onDragStart={e => {
                            e.dataTransfer.setData('fileHash', file.hash);
                            e.dataTransfer.effectAllowed = 'move';
                            // Create a uniform drag ghost for all files
                            const ghost = document.createElement('div');
                            ghost.textContent = '↗ ' + (file.name.length > 28 ? file.name.slice(0, 28) + '…' : file.name);
                            Object.assign(ghost.style, {
                                position: 'fixed', top: '-200px', left: '-200px',
                                background: '#1c1c1e', border: '1px solid var(--primary-cyan)',
                                color: 'var(--primary-cyan)', padding: '8px 14px',
                                borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600',
                                whiteSpace: 'nowrap', pointerEvents: 'none',
                                boxShadow: '0 4px 20px rgba(0,243,255,0.3)'
                            });
                            document.body.appendChild(ghost);
                            e.dataTransfer.setDragImage(ghost, 0, 0);
                            setTimeout(() => document.body.removeChild(ghost), 0);
                        }}
                        onDragEnd={() => setDragOverFolderId(null)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--glass-border)', position: 'relative',
                            transition: 'all 0.2s ease', cursor: 'grab'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-cyan)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                    >
                        {/* Type Badge */}
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
                            <span style={{ background: badge.color + '22', border: `1px solid ${badge.color}`, color: badge.color, fontSize: '0.65rem', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                                {badge.label}
                            </span>
                        </div>

                        {/* 3 Dot Menu Button */}
                        <div 
                            style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, padding: '0.4rem', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', cursor: 'pointer', display: 'flex' }}
                            onClick={(e) => openContextMenu(e, file, false)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                        </div>

                        <div 
                            style={{ height: '180px', marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', cursor: 'pointer' }}
                            onClick={() => file.isEncrypted ? initiateDecryption(file) : viewPlainFile(file)}
                        >
                            {file.isEncrypted ? (
                                <IconLock size={48} color="var(--text-dim)" />
                            ) : isImage(file.name) ? (
                                <img src={`http://localhost:5002/download/${file.hash}?type=view`} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                            ) : isVideo(file.name) ? (
                                <video
                                    src={`http://localhost:5002/download/${file.hash}?type=view`}
                                    preload="metadata"
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            ) : (
                                <IconFile size={48} color="var(--text-dim)" />
                            )}
                        </div>

                        <h3 style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem', color: 'white' }} title={file.name}>
                            {file.name}
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            <span>{file.date || 'Unknown Date'}</span>
                            {sizeStr && <span style={{ color: 'rgba(255,255,255,0.3)' }}>{sizeStr}</span>}
                        </div>
                    </div>
                    );
                })}

                {visibleFolders.length === 0 && visibleFiles.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                        Nothing inside right now.
                    </div>
                )}
            </div>

            {/* Context Menu Dropdown */}
            {contextMenu && (
                <div style={{
                    position: 'absolute', top: contextMenu.y + 10, left: contextMenu.x - 140, width: '160px',
                    background: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.8)', zIndex: 1000, overflow: 'hidden'
                }} onClick={(e) => e.stopPropagation()}>
                    {contextMenu.isFolder ? (
                        <>
                            <div className="ctx-item" onClick={() => {
                                setFolderModalMode('rename');
                                setFolderNameInput(contextMenu.item.name);
                                setActiveFolderId(contextMenu.item.id);
                                setShowFolderModal(true);
                                setContextMenu(null);
                            }}>
                                <IconCopy size={16} /> Rename
                            </div>
                            <div className="ctx-item" style={{ color: '#ff4d4d' }} onClick={() => {
                                deleteFolder(contextMenu.item.id);
                                setContextMenu(null);
                            }}>
                                <IconTrash size={16} color="#ff4d4d"/> Remove
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="ctx-item" onClick={(e) => copyToClipboard(contextMenu.item.hash, e)} style={{ color: copiedMenuHash === contextMenu.item.hash ? '#00e676' : 'inherit' }}>
                                {copiedMenuHash === contextMenu.item.hash ? (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!
                                    </>
                                ) : (
                                    <>
                                        <IconCopy size={16} /> Copy Hash
                                    </>
                                )}
                            </div>
                            <div className="ctx-item" onClick={(e) => saveToVault(contextMenu.item, e)} style={{ color: vaultFeedback?.hash === contextMenu.item.hash ? (vaultFeedback.status === 'saved' ? '#00e676' : '#ffbd3a') : 'inherit' }}>
                                {vaultFeedback?.hash === contextMenu.item.hash ? (
                                    vaultFeedback.status === 'saved' ? (
                                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Saved!</>
                                    ) : (
                                        <><IconLock size={16} /> Already in Vault</>
                                    )
                                ) : (
                                    <><IconLock size={16} /> Save to Vault</>
                                )}
                            </div>
                            <div className="ctx-item" onClick={() => { setQrHash(contextMenu.item.hash); setShowQRModal(true); setContextMenu(null); }}>
                                <IconQR size={16} /> Share via QR
                            </div>
                            <div className="ctx-item" onClick={() => {
                                setFileToMove(contextMenu.item);
                                setMoveDestinationId(contextMenu.item.folderId || 'root');
                                setNewMoveFolderName('');
                                setShowMoveModal(true);
                                setContextMenu(null);
                            }}>
                                <IconFolder size={16} /> Move
                            </div>
                            <div className="ctx-item" style={{ color: '#ff4d4d' }} onClick={() => { deleteFile(contextMenu.item.hash); setContextMenu(null); }}>
                                <IconTrash size={16} color="#ff4d4d"/> Remove
                            </div>
                        </>
                    )}
                </div>
            )}


            {/* Create / Rename Folder Modal */}
            {showFolderModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1c1c1e', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'white', marginBottom: '2rem', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                            <IconFolder color="var(--primary-cyan)" size={24} /> 
                            {folderModalMode === 'create' ? 'CREATE FOLDER' : 'RENAME FOLDER'}
                        </h3>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.8rem' }}>New Folder</label>
                            <input 
                                type="text"
                                autoFocus
                                placeholder="New Folder"
                                value={folderNameInput}
                                onChange={(e) => setFolderNameInput(e.target.value)}
                                style={{ width: '100%', background: '#2a2a2c', border: '1px solid var(--primary-cyan)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={handleFolderSubmit}
                                className="btn" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                            >
                                {folderModalMode === 'create' ? 'CREATE' : 'SAVE RENAME'}
                            </button>
                            <button 
                                onClick={() => setShowFolderModal(false)}
                                className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move File Modal */}
            {showMoveModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1c1c1e', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', width: '450px', maxWidth: '90%' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'white', marginBottom: '1.5rem', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                            <IconFolder color="#ffbd3a" size={24} /> 
                            MOVE: {fileToMove?.name}
                        </h3>
                        
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select an existing folder or create a new one.</p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'white', marginBottom: '0.8rem' }}>Or Create a New Folder</label>
                            <input 
                                type="text"
                                placeholder="Type a new folder name..."
                                value={newMoveFolderName}
                                onChange={(e) => {
                                    setNewMoveFolderName(e.target.value);
                                    if(e.target.value) setMoveDestinationId('new'); // dummy value
                                }}
                                style={{ width: '100%', background: '#2a2a2c', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none', fontSize: '1rem' }}
                            />
                        </div>

                        {folders.length > 0 && !newMoveFolderName && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <span 
                                    onClick={() => setMoveDestinationId('root')}
                                    style={{ padding: '0.5rem 1rem', background: moveDestinationId === 'root' ? 'var(--primary-cyan)' : 'rgba(255,255,255,0.1)', color: moveDestinationId === 'root' ? 'black' : 'white', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer' }}
                                >Root</span>
                                {folders.map(f => (
                                    <span 
                                        key={f.id}
                                        onClick={() => setMoveDestinationId(f.id)}
                                        style={{ padding: '0.5rem 1rem', background: moveDestinationId === f.id ? 'var(--primary-cyan)' : 'rgba(255,255,255,0.1)', color: moveDestinationId === f.id ? 'black' : 'white', borderRadius: '20px', fontSize: '0.9rem', cursor: 'pointer' }}
                                    >{f.name}</span>
                                ))}
                            </div>
                        )}

                        <p style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Moving to: </span>
                            <strong style={{ color: 'white' }}>
                                {newMoveFolderName ? newMoveFolderName : moveDestinationId === 'root' ? 'Root' : folders.find(f => f.id === moveDestinationId)?.name}
                            </strong>
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={handleMoveSubmit}
                                className="btn" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                            >
                                MOVE FILE
                            </button>
                            <button 
                                onClick={() => setShowMoveModal(false)}
                                className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1c1c1e', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><IconQR size={24} /> Share via QR</h3>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCodeSVG value={`http://${localIp}:5002/download/${qrHash}`} size={200} />
                        </div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Scan this code to download the file directly.</p>
                        <button onClick={() => setShowQRModal(false)} className="btn btn-secondary" style={{ width: '100%' }}>CLOSE</button>
                    </div>
                </div>
            )}

            {/* Password Decryption Modal */}
            {selectedItem && !showPreview && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
                    <div className="glass-card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedItem.name}>
                            Decrypt: {selectedItem.name}
                        </h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>Enter password to view/download.</p>
                        <input type="password" autoFocus placeholder="Password..." value={decryptionKey} onChange={(e) => setDecryptionKey(e.target.value)} style={{ marginBottom: '1.5rem', width: '100%', padding: '0.8rem', borderRadius: '8px', outline: 'none' }} />
                        {status && <p style={{ color: '#ff4d4d', marginBottom: '1rem' }}>{status}</p>}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <button onClick={() => processDecryption('view')} className="btn" style={{ flex: 1 }}>Decrypt & View</button>
                            <button onClick={() => processDecryption('download')} className="btn btn-secondary" style={{ flex: 1 }}>Decrypt & Download</button>
                        </div>
                        <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', width: '100%', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* View Preview Modal */}
            {showPreview && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }}>
                    <div className="glass-card" style={{ width: '900px', maxWidth: '95%', maxHeight: '95vh', overflowY: 'auto', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '1rem' }} title={previewName}>{previewName}</h3>
                            <button onClick={closePreview} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            {previewType.startsWith('image/') ? <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />
                                : previewType.startsWith('video/') ? <video controls src={previewUrl} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />
                                : previewType.startsWith('audio/') ? <audio controls src={previewUrl} style={{ width: '100%' }} />
                                : previewType === 'application/pdf' ? <iframe src={previewUrl} title="PDF" style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />
                                : <div style={{ padding: '2rem' }}>No preview for this type. Please download.</div>
                            }
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => {
                                const a = document.createElement('a'); a.href = previewUrl; a.download = previewName;
                                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            }} className="btn">Download File</button>
                            <button onClick={closePreview} className="btn btn-secondary">Close Preview</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Change PIN Modal */}
            {showPinModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1c1c1e', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '420px', maxWidth: '95%' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'white', marginBottom: '0.5rem', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            Change PIN
                        </h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter your current PIN to set a new 4-digit PIN.</p>

                        {[
                            { label: 'Current PIN', value: pinCurrentInput, setter: setPinCurrentInput, placeholder: '••••' },
                            { label: 'New PIN (4 digits)', value: pinNewInput, setter: setPinNewInput, placeholder: '••••' },
                            { label: 'Confirm New PIN', value: pinConfirmInput, setter: setPinConfirmInput, placeholder: '••••' },
                        ].map((field, i) => (
                            <div key={i} style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>{field.label}</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    placeholder={field.placeholder}
                                    value={field.value}
                                    onChange={e => field.setter(e.target.value.replace(/\D/g, '').slice(0,4))}
                                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '1.1rem', letterSpacing: '0.3rem', transition: 'border-color 0.3s' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--primary-cyan)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                                />
                            </div>
                        ))}

                        {pinMessage && (
                            <p style={{ color: pinMessage.type === 'error' ? '#ff4d4d' : '#00e676', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {pinMessage.type === 'success' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                {pinMessage.text}
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button onClick={handleChangePin} className="btn" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}>UPDATE PIN</button>
                            <button onClick={() => setShowPinModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .ctx-item {
                    padding: 0.8rem 1rem;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    font-size: 0.95rem;
                }
                .ctx-item:hover {
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
};

export default Gallery;
