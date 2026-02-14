// src/pages/Upload.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
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

  const saveToHistory = (newHash, fileName) => {
    const newUpload = { hash: newHash, name: fileName, date: new Date().toLocaleDateString() };
    const updatedUploads = [newUpload, ...recentUploads].slice(0, 5); // Keep last 5
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

    try {
      let fileToUpload = selectedFile;
      let finalFileName = selectedFile.name;

      // Encryption Logic
      if (encryptionKey) {
        // 1. Read file as DataURL
        const fileDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        // 2. Create a payload with metadata
        const payload = JSON.stringify({
          name: selectedFile.name,
          type: selectedFile.type,
          data: fileDataUrl
        });

        // 3. Encrypt the payload
        const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();

        // 4. Create a blob from the encrypted string
        const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });

        // 5. Create a new File object
        fileToUpload = new File([encryptedBlob], selectedFile.name + ".encrypted", { type: 'text/plain' });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const newHash = response.data.hash;
      setHash(newHash);
      saveToHistory(newHash, finalFileName);

      // Save to Vault Logic
      if (saveToVault && encryptionKey) {
        const vaultItem = {
          hash: newHash,
          name: finalFileName,
          date: new Date().toLocaleDateString()
          // NOTE: We intentionally do NOT save the key here for security
        };
        const currentVault = JSON.parse(localStorage.getItem('vault_items') || '[]');
        localStorage.setItem('vault_items', JSON.stringify([vaultItem, ...currentVault]));
      }

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
    <div className="glass-card">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Upload File</h2>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <div className="upload-icon">
          {selectedFile ? '📄' : '☁️'}
        </div>

        {selectedFile ? (
          <div style={{ width: '100%', padding: '0 1rem' }}>
            <p style={{
              color: '#fff',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }} title={selectedFile.name}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--primary-cyan)', marginTop: '0.5rem' }}>
              Click to change file
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Drag & Drop your file here</h3>
            <p style={{ color: 'var(--text-dim)' }}>or click to browse</p>
          </div>
        )}

        <input
          id="fileInput"
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <label style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Encryption Password (Optional)</label>
        <input
          type="password"
          placeholder="Enter password to encrypt..."
          value={encryptionKey}
          onChange={(e) => setEncryptionKey(e.target.value)}
          style={{
            width: '100%',
            padding: '0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff'
          }}
        />
        {encryptionKey && (
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveToVault}
                onChange={(e) => setSaveToVault(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Save to Secure Vault (Bookmarks the file, NOT the password)
            </label>
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        className="btn"
        style={{ width: '100%', marginBottom: '1.5rem' }}
        disabled={loading}
      >
        {loading ? 'Uploading to IPFS...' : (encryptionKey ? 'Encrypt & Upload' : 'Upload Now')}
      </button>

      {error && (
        <p style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</p>
      )}

      {hash && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(0, 243, 255, 0.05)',
          borderRadius: '8px',
          border: '1px solid var(--primary-cyan)',
          wordBreak: 'break-all'
        }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>IPFS Hash Generated:</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p style={{ color: 'var(--primary-cyan)', fontWeight: 'bold', flex: 1, wordBreak: 'break-all' }}>{hash}</p>
            <button onClick={() => copyToClipboard(hash)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>Copy</button>
          </div>
        </div>
      )}

      {recentUploads.length > 0 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Recent Uploads</h4>
          {recentUploads.map((item, index) => (
            <div key={index} style={{
              marginBottom: '0.8rem',
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '60%'
              }} title={item.name}>
                {item.name}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => copyToClipboard(item.hash)} style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-cyan)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>Copy Hash</button>
                <button onClick={() => {
                  const updatedUploads = recentUploads.filter((_, i) => i !== index);
                  setRecentUploads(updatedUploads);
                  localStorage.setItem('recentUploads', JSON.stringify(updatedUploads));
                }} style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ff4d4d',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Upload;
