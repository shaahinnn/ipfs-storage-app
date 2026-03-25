// src/pages/RetrieveFile.js
import React, { useState } from 'react';
import CryptoJS from 'crypto-js';

// Shared progress bar animation (only injected once via <style>)
const PROGRESS_BAR_STYLE = `
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(0, 243, 255, 0.4); }
  50% { box-shadow: 0 0 18px rgba(0, 243, 255, 0.9); }
}
`;

function ProgressBar({ progress, stage }) {
  return (
    <div style={{ marginTop: '1.2rem' }}>
      <style>{PROGRESS_BAR_STYLE}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>{stage}</span>
        <span style={{ color: 'var(--primary-cyan)', fontSize: '0.8rem', fontWeight: 'bold' }}>{Math.round(progress)}%</span>
      </div>
      <div style={{
        width: '100%', height: '6px', background: 'rgba(255,255,255,0.07)',
        borderRadius: '10px', overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          borderRadius: '10px',
          background: 'linear-gradient(90deg, #00c8ff, #00f3ff, #00c8ff)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite, pulseGlow 2s ease-in-out infinite',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}

function RetrieveFile() {
  const [hash, setHash] = useState('');
  const [decryptionKey, setDecryptionKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Progress state
  const [retrieveProgress, setRetrieveProgress] = useState(0);
  const [retrieveStage, setRetrieveStage] = useState('');

  // Preview State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [previewName, setPreviewName] = useState('');

  const handleDownload = async (mode = 'view') => {
    if (!hash) { alert('Please enter an IPFS Hash'); return; }

    // No decryption key → show loading bar briefly, then do a direct browser redirect.
    // XHR blob approach caused issues with IPFS gateways; redirect is always reliable.
    if (!decryptionKey) {
      setLoading(true);
      setError('');
      setPreviewUrl(null);
      setRetrieveProgress(5);
      setRetrieveStage('Fetching from IPFS…');

      // Animate bar while waiting for the redirect to fire
      let pct = 5;
      const redirectTicker = setInterval(() => {
        pct = Math.min(pct + 3, 75);
        setRetrieveProgress(pct);
      }, 100);

      // Short delay so React renders the bar before the page navigates
      await new Promise(r => setTimeout(r, 600));
      clearInterval(redirectTicker);

      // Reset UI and redirect — browser handles the download natively
      setLoading(false);
      setRetrieveProgress(0);
      setRetrieveStage('');
      const portStr = window.location.port ? ':5002' : '';
      const apiBase = `http://${window.location.hostname}${portStr}`;
      window.location.href = `${apiBase}/download/${hash}`;
      return;
    }

    // Set stage BEFORE the await so React renders the bar immediately
    setLoading(true);
    setError('');
    setPreviewUrl(null);
    setRetrieveProgress(5);
    setRetrieveStage('Fetching from IPFS…');

    try {
      // Stage 1: Fetch via XHR — use interval ticker as primary progress driver
      // (IPFS gateways rarely send Content-Length, so onprogress alone is unreliable)
      let fetchPct = 5;
      const fetchTicker = setInterval(() => {
        fetchPct = Math.min(fetchPct + 0.8, 65);
        setRetrieveProgress(fetchPct);
      }, 300);

      const encryptedContent = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // If Content-Length is available, override ticker with real byte progress
        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = (e.loaded / e.total) * 65;
            fetchPct = pct; // Keep ticker in sync
            setRetrieveProgress(pct);
            setRetrieveStage(`Fetching from IPFS… ${Math.round((e.loaded / e.total) * 100)}%`);
          }
        };

        xhr.onload = () => {
          clearInterval(fetchTicker);
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error('Fetch failed: ' + xhr.status));
          }
        };
        xhr.onerror = () => { clearInterval(fetchTicker); reject(new Error('Network error during fetch')); };

        const portStr = window.location.port ? ':5002' : '';
        const apiBase = `http://${window.location.hostname}${portStr}`;
        xhr.open('GET', `${apiBase}/download/${hash}`);
        xhr.responseType = 'text';
        xhr.send();
      });

      // Stage 2: Decrypting
      setRetrieveStage('Decrypting…');
      setRetrieveProgress(70);

      // Animate 70 → 92% while synchronous AES decryption runs
      let decryptPct = 70;
      const decryptTimer = setInterval(() => {
        decryptPct += 3;
        setRetrieveProgress(Math.min(decryptPct, 92));
      }, 40);

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

      clearInterval(decryptTimer);

      if (!decryptedString) throw new Error('Decryption failed. Wrong key.');

      setRetrieveProgress(92);

      let finalDataUrl = decryptedString;
      let finalFilename = `decrypted-${hash}`;
      let finalMime = 'application/octet-stream';

      try {
        const payload = JSON.parse(decryptedString);
        if (payload.name && payload.data) {
          finalDataUrl = payload.data;
          finalFilename = payload.name;
          finalMime = payload.type || finalMime;
        }
      } catch (e) {
        console.warn('Legacy encrypted file or raw data detected');
      }

      // Convert DataURL to Blob
      const arr = finalDataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : finalMime;
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      const blob = new Blob([u8arr], { type: mime });
      const url = window.URL.createObjectURL(blob);

      // Done
      setRetrieveProgress(100);
      setRetrieveStage('Done ✓');

      if (mode === 'view') {
        setPreviewUrl(url);
        setPreviewType(mime);
        setPreviewName(finalFilename);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // Reset bar after a moment
      setTimeout(() => {
        setRetrieveProgress(0);
        setRetrieveStage('');
      }, 1800);

    } catch (err) {
      console.error(err);
      setError('Failed to retrieve or decrypt. Check the hash and password.');
      setRetrieveProgress(0);
      setRetrieveStage('');
    } finally {
      setLoading(false);
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
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType('');
    setPreviewName('');
  };

  const renderPreviewContent = () => {
    if (!previewUrl) return null;
    if (previewType.startsWith('image/')) return <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />;
    if (previewType.startsWith('video/')) return <video controls src={previewUrl} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />;
    if (previewType.startsWith('audio/')) return <audio controls src={previewUrl} style={{ width: '100%' }} />;
    if (previewType === 'application/pdf') return <iframe src={previewUrl} title="PDF Preview" style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} />;
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
        <p>No preview available for this file type ({previewType}).</p>
        <p>Please download to view.</p>
      </div>
    );
  };

  return (
    <div className="glass-card">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Retrieve File</h2>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>IPFS Hash</label>
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Enter IPFS Hash (Qm...)"
            style={{ width: '100%', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', outline: 'none', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--primary-cyan)'; }}
            onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--glass-border)'; }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary-cyan)'; e.target.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.2)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
          <label style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Decryption Password (If encrypted)</label>
          <input
            type="password"
            placeholder="Enter password to decrypt..."
            value={decryptionKey}
            onChange={(e) => setDecryptionKey(e.target.value)}
            style={{ width: '100%', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', outline: 'none', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--primary-cyan)'; }}
            onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--glass-border)'; }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary-cyan)'; e.target.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.2)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={() => handleDownload('view')}
          className="btn"
          style={{ flex: 1, padding: '1rem', borderRadius: '8px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          disabled={loading}
        >
          {loading ? (
            <>PROCESSING…</>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {decryptionKey ? 'DECRYPT & VIEW' : 'RETRIEVE NOW'}
            </>
          )}
        </button>

        {decryptionKey && (
          <button
            onClick={() => handleDownload('download')}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '1rem', borderRadius: '8px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            disabled={loading}
          >
            {loading ? '…' : 'DECRYPT & DOWNLOAD'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {loading && retrieveStage && (
        <ProgressBar progress={retrieveProgress} stage={retrieveStage} />
      )}

      {error && <p style={{ color: '#ff4d4d', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}

      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
        Note: Files are retrieved via your local IPFS node.<br />
        <strong style={{ color: '#ffbd3a' }}>If the file was encrypted during upload, you MUST enter a password above to recover its original filename and content!</strong>
      </p>

      {/* Preview Modal */}
      {previewUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' }}>
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

export default RetrieveFile;
