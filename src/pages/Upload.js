import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { IconCloud } from '../components/Icons'; // Import IconCloud for drag & drop zone

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [folderName, setFolderName] = useState(''); // New folder state
  const [encryptionKey, setEncryptionKey] = useState('');
  const [saveToVault, setSaveToVault] = useState(false);
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const savedUploads = JSON.parse(localStorage.getItem('recentUploads') || '[]');
    setRecentUploads(savedUploads);
  }, []);

  const saveToHistory = (newHash, fileName, isEncrypted = false, destFolderId = null, fileSize = 0) => {
    const newUpload = { hash: newHash, name: fileName, date: new Date().toLocaleDateString(), isEncrypted, folderId: destFolderId, size: fileSize };
    const updatedUploads = [newUpload, ...recentUploads];
    setRecentUploads(updatedUploads);
    localStorage.setItem('recentUploads', JSON.stringify(updatedUploads));
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setHash('');
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setHash('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');
    const originalSize = selectedFile.size;

    try {
      let fileToUpload = selectedFile;
      let finalFileName = selectedFile.name;

      // Encryption Logic
      if (encryptionKey) {
        const fileDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const payload = JSON.stringify({
          name: selectedFile.name,
          type: selectedFile.type,
          data: fileDataUrl
        });

        const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
        const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
        fileToUpload = new File([encryptedBlob], selectedFile.name + ".encrypted", { type: 'text/plain' });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Use XHR for progress tracking
      const newHash = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          if (xhr.status === 200) {
            try { resolve(JSON.parse(xhr.responseText).hash); }
            catch(e) { reject(new Error('Invalid server response')); }
          } else { reject(new Error('Upload failed: ' + xhr.status)); }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', 'http://localhost:5002/upload');
        xhr.send(formData);
      });

      setHash(newHash);

      // Folder Creation Logic
      let destFolderId = null;
      if (folderName.trim() !== '') {
          const fn = folderName.trim();
          const existingFolders = JSON.parse(localStorage.getItem('folders') || '[]');
          let folder = existingFolders.find(f => f.name.toLowerCase() === fn.toLowerCase());
          if (!folder) {
              folder = { id: Date.now().toString(), name: fn, createdAt: new Date().toISOString() };
              existingFolders.push(folder);
              localStorage.setItem('folders', JSON.stringify(existingFolders));
          }
          destFolderId = folder.id;
      }

      saveToHistory(newHash, finalFileName, !!encryptionKey, destFolderId, originalSize);

      // Save to Vault Logic
      if (saveToVault && encryptionKey) {
        const vaultItem = {
          hash: newHash,
          name: finalFileName,
          date: new Date().toLocaleDateString(),
          isEncrypted: true
        };
        const currentVault = JSON.parse(localStorage.getItem('vault_items') || '[]');
        localStorage.setItem('vault_items', JSON.stringify([vaultItem, ...currentVault]));
      }

      setTimeout(() => {
         setFolderName('');
         setEncryptionKey('');
         setSelectedFile(null);
      }, 1500);

    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ background: '#111114', borderRadius: '16px', padding: '3rem 2.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: 'white', letterSpacing: '2px', fontSize: '1.4rem' }}>UPLOAD FILE</h2>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput').click()}
          onMouseEnter={e => { if(!isDragging) e.currentTarget.style.borderColor = 'var(--primary-cyan)'; }}
          onMouseLeave={e => { if(!isDragging) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          style={{
            border: isDragging ? '2px dashed var(--primary-cyan)' : '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: isDragging ? 'rgba(0, 243, 255, 0.05)' : 'transparent',
            marginBottom: '2rem'
          }}
        >
          <div style={{ color: 'var(--text-dim)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
             {selectedFile ? <IconCloud size={48} color="var(--primary-cyan)" /> : <IconCloud size={48} />}
          </div>

          {selectedFile ? (
            <div style={{ width: '100%' }}>
              <p style={{ color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedFile.name}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--primary-cyan)', marginTop: '1rem' }}>Click to change file</p>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'white', fontWeight: 'bold', letterSpacing: '1px' }}>DRAG & DROP YOUR FILE HERE</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>or click to browse</p>
            </div>
          )}

          <input id="fileInput" type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div>
             <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Folder Name (Optional)</label>
             <input
               type="text"
               placeholder="e.g. Documents, Photos..."
               value={folderName}
               onChange={(e) => setFolderName(e.target.value)}
               style={{
                 width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                 background: '#1a1a1c', color: '#fff', outline: 'none', transition: 'border-color 0.3s'
               }}
               onMouseEnter={e => { if(document.activeElement !== e.target) e.target.style.borderColor = 'var(--primary-cyan)'; }}
               onMouseLeave={e => { if(document.activeElement !== e.target) e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
               onFocus={e => e.target.style.borderColor = 'var(--primary-cyan)'}
               onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
             />
          </div>

          <div>
             <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.8rem' }}>Encryption Password (Optional)</label>
             <input
               type="password"
               placeholder="Enter password to encrypt..."
               value={encryptionKey}
               onChange={(e) => setEncryptionKey(e.target.value)}
               style={{
                 width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
                 background: '#1a1a1c', color: '#fff', outline: 'none', transition: 'border-color 0.3s'
               }}
               onMouseEnter={e => { if(document.activeElement !== e.target) e.target.style.borderColor = 'var(--primary-cyan)'; }}
               onMouseLeave={e => { if(document.activeElement !== e.target) e.target.style.borderColor = 'rgba(255,255,255,0.05)'; }}
               onFocus={e => e.target.style.borderColor = 'var(--primary-cyan)'}
               onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.05)'}
             />
             
             {encryptionKey && (
               <div style={{ marginTop: '1rem' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                   <input
                     type="checkbox"
                     checked={saveToVault}
                     onChange={(e) => setSaveToVault(e.target.checked)}
                     style={{ width: '16px', height: '16px', accentColor: 'var(--primary-cyan)' }}
                   />
                   Save to Secure Vault (Bookmarks the file hash)
                 </label>
               </div>
             )}
          </div>
        </div>

        <button
          onClick={handleUpload}
          className="btn"
          style={{
            width: '100%', padding: '1rem', borderRadius: '8px',
            fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
            opacity: loading ? 0.7 : 1
          }}
          disabled={loading}
        >
          {loading ? (
             <>UPLOADING...</>
          ) : (
             <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                UPLOAD NOW
             </>
          )}
        </button>

        {error && <p style={{ color: '#ff4d4d', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}

        {hash && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0, 243, 255, 0.05)', borderRadius: '8px', border: '1px solid var(--primary-cyan)' }}>
            <p style={{ color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>IPFS Hash Generated:</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ color: 'var(--primary-cyan)', fontWeight: 'bold', flex: 1, wordBreak: 'break-all' }}>{hash}</p>
              <button onClick={() => copyToClipboard(hash)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Copy</button>
            </div>
          </div>
        )}

        {recentUploads.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Recent Uploads</h4>
            {recentUploads.slice(0, 5).map((item, index) => (
              <div key={index} 
                style={{ marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60%' }} title={item.name}>
                  {item.name}
                </span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span onClick={() => copyToClipboard(item.hash)} style={{ color: 'var(--primary-cyan)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = '0.7'} onMouseLeave={e => e.target.style.opacity = '1'}>Copy Hash</span>
                  <span onClick={() => {
                    if(!window.confirm("Remove file from history?")) return;
                    const updatedUploads = recentUploads.filter((_, i) => i !== index);
                    setRecentUploads(updatedUploads);
                    localStorage.setItem('recentUploads', JSON.stringify(updatedUploads));
                  }} style={{ color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = '0.7'} onMouseLeave={e => e.target.style.opacity = '1'}>Delete</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Upload;
