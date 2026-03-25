# IPFS Secure Storage App — Core Code Explanation

> A highly detailed, file-by-file walkthrough of every core functionality, written for academic and developer reference.

---

## Table of Contents

1. [App.js — Root Entry & Session Guard](#1-appjs--root-entry--session-guard)
2. [LockScreen.js — PIN Authentication](#2-lockscreenjs--pin-authentication)
3. [Upload.js — File Encryption & IPFS Upload](#3-uploadjs--file-encryption--ipfs-upload)
4. [Home.js — Analytics Dashboard](#4-homejs--analytics-dashboard)
5. [Gallery.js — Virtual File System & In-Browser Decryption](#5-galleryjs--virtual-file-system--in-browser-decryption)
6. [RetrieveFile.js — Hash-Based File Retrieval & Decryption](#6-retrievefilejs--hash-based-file-retrieval--decryption)
7. [Data Flow Summary](#7-data-flow-summary)

---

## 1. `App.js` — Root Entry & Session Guard

**File:** `src/App.js`

### Purpose
`App.js` is the root component of the React application. It is responsible for two critical tasks: guarding the application behind a session lock, and routing users to the correct page.

### Code Walkthrough

```javascript
const [isUnlocked, setIsUnlocked] = React.useState(
  sessionStorage.getItem('unlocked') === 'true'
);
```
**Session State Initialization:**  
On every page load or refresh, React reads from `sessionStorage`. `sessionStorage` is scoped to the browser tab — it is automatically cleared when the tab is closed. This means the PIN lock is re-triggered any time:
- The user opens a new tab.
- The user refreshes the page after the tab was closed.
- The browser session expires.

This is intentional: it provides "session-based" access control without a server.

```javascript
if (!isUnlocked) {
  return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
}
```
**Route Interception:**  
Before any `<Router>` or `<Route>` is rendered, the component checks `isUnlocked`. If `false`, the entire application tree is replaced by `<LockScreen>`. No page, navigation, or route is accessible until the PIN is verified. This is a "render gate" — not a redirect — making it impossible to bypass via URL manipulation in the browser.

```javascript
return (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/retrieve" element={<RetrieveFile />} />
        <Route path="/vault" element={<Vault />} />
      </Routes>
    </Layout>
  </Router>
);
```
**Client-Side Routing:**  
Once unlocked, `react-router-dom` takes over. This is a Single Page Application (SPA) — navigation does not cause full page reloads. The `<Layout>` component wraps all routes and renders the persistent `<Navbar>` on every page.

---

## 2. `LockScreen.js` — PIN Authentication

**File:** `src/components/LockScreen.js`

### Purpose
Provides a glassmorphic 4-digit PIN pad that must be completed before the application is accessible. The correct PIN is stored in `localStorage`, defaulting to `1234` on first use.

### Code Walkthrough

```javascript
const getStoredPin = () => localStorage.getItem('app_pin') || '1234';
```
**PIN Storage:**  
The PIN is stored in `localStorage` (persistent across sessions, not cleared on tab close). `localStorage` is chosen because the PIN must survive browser restarts. If no PIN has been set, `'1234'` is the default fallback.

```javascript
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
```
**Automatic Verification:**  
The `useEffect` fires every time the `pin` state changes. When the PIN reaches exactly 4 characters, it is immediately compared to the stored PIN without requiring the user to press "Enter". This creates a fluid, ATM-like experience.

- **On Success:** The string `'true'` is written to `sessionStorage` under the key `'unlocked'`. The `onUnlock` callback is called, which updates `isUnlocked` state in `App.js`, causing a re-render of the full application.
- **On Failure:** `setError(true)` adds the CSS class `shake` to the container element, triggering a CSS shaking animation. After 500ms, the entered PIN is cleared and the error state resets, allowing a retry.

```javascript
const handleNumberClick = (num) => {
  if (pin.length < 4) {
    setPin(prev => prev + num);
  }
};
const handleDelete = () => setPin(prev => prev.slice(0, -1));
```
**Keypad Input:**  
- `handleNumberClick` appends a digit to the PIN string, but only if fewer than 4 characters have been entered. This enforces the 4-digit limit without needing a separate validation step.
- `handleDelete` uses JavaScript's `String.slice(0, -1)` to remove the last character — a standard backspace implementation.

**PIN Change (in Gallery.js):**  
The PIN can be changed from a modal in `Gallery.js`. It validates the current PIN, enforces the 4-digit regex `/^\d{4}$/`, and writes the new PIN directly to `localStorage.setItem('app_pin', newPin)`.

---

## 3. `Upload.js` — File Encryption & IPFS Upload

**File:** `src/pages/Upload.js`

### Purpose
The most complex component in the application. Handles file selection via drag-and-drop or click, optional AES-256 client-side encryption, a multi-stage XHR upload with real-time progress tracking, IPFS hash retrieval, and performance metric recording.

### Code Walkthrough

#### 3.1 Drag-and-Drop Zone

```javascript
const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    setSelectedFile(e.dataTransfer.files[0]);
  }
};
```
The div listens to `onDragOver`, `onDragLeave`, and `onDrop` browser events. `e.preventDefault()` is essential — without it, the browser would navigate to the dropped file's path instead of intercepting it. `e.dataTransfer.files[0]` extracts the first dropped file as a native `File` object.

#### 3.2 AES-256 Encryption Pipeline

```javascript
const fileDataUrl = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(selectedFile);
});
```
**Step 1 — FileReader API:**  
`FileReader.readAsDataURL()` converts the raw binary file into a Base64-encoded Data URL string (e.g., `data:image/png;base64,iVBOR...`). This is necessary to represent any binary file as a plain text string suitable for encryption. The operation is asynchronous, so it is wrapped in a `Promise`.

```javascript
const payload = JSON.stringify({
  name: selectedFile.name,
  type: selectedFile.type,
  data: fileDataUrl
});
const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
```
**Step 2 — Encrypt:**  
Instead of just encrypting the file data, a JSON payload containing the original **filename**, **MIME type**, and the **base64 data** is constructed first. This is critical: without the filename and MIME type embedded inside the ciphertext, decryption would produce raw base64 with no way to know what file type it was.

`CryptoJS.AES.encrypt()` uses **AES-256-CBC** mode internally with a PBKDF2-derived key. The result is a Base64-encoded ciphertext string. This ciphertext is then wrapped in a `Blob` of type `text/plain` for transmission.

```javascript
fileToUpload = new File(
  [encryptedBlob],
  selectedFile.name + '.encrypted',
  { type: 'text/plain' }
);
```
**Step 3 — Rename:**  
The encrypted blob is packaged as a new `File` object with `.encrypted` appended to the filename. This allows the application to identify encryption status both visually (in the Gallery) and programmatically (via `file.isEncrypted` flag or the `.encrypted` suffix).

#### 3.3 XHR Upload with Real-Time Progress

```javascript
const newHash = await new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const startPct = encryptionKey ? 5 : 0;
      const uploadPct = startPct + ((e.loaded / e.total) * (15 - startPct));
      setUploadProgress(uploadPct);
      setUploadStage(`Uploading to Server… ${Math.round((e.loaded / e.total) * 100)}%`);
    }
  };
```
**Why XHR instead of fetch/axios?**  
The `fetch` API and `axios` do not expose upload progress events reliably. `XMLHttpRequest` provides the `xhr.upload.onprogress` event with `e.loaded` (bytes sent) and `e.total` (total bytes). The progress percentage is mapped to a range 5%–15% to leave room for subsequent IPFS pinning in the 15%–98% range.

```javascript
xhr.upload.onload = () => {
  const t1 = performance.now();
  const totalUploadMs = Math.round(t1 - t0);
  const metrics = JSON.parse(localStorage.getItem('perf_metrics') || '[]');
  metrics.push({
    sizeBytes: originalSize,
    timeMs: totalUploadMs,
    isEncrypted: !!encryptionKey,
    date: new Date().toISOString()
  });
  if (metrics.length > 50) metrics.shift();
  localStorage.setItem('perf_metrics', JSON.stringify(metrics));
  // Start IPFS pinning animation...
};
```
**Performance Metric Recording:**  
`xhr.upload.onload` fires the instant the file bytes finish transferring to the backend server (before Pinata pins it). A single metric entry is written to `localStorage['perf_metrics']`:
- `sizeBytes`: the **original** file size (not the encrypted blob size — the user's data size)
- `timeMs`: total elapsed time from start (`t0`) to when bytes hit the server
- `isEncrypted`: boolean derived from whether an `encryptionKey` was provided
- A rolling cap of 50 entries is maintained via `metrics.shift()`.

```javascript
let pct = 15;
pinningTimer = setInterval(() => {
  pct += 0.5;
  if (pct <= 98) setUploadProgress(pct);
  else if (pct === 98.5) {
    setUploadStage('Pinning to IPFS Network… (Larger files can take several minutes)');
  }
}, 50);
```
**IPFS Pinning Animation:**  
After the bytes finish uploading to the local backend, the backend then pins the file to IPFS via Pinata's API. This can take anywhere from 1 second to several minutes for large files. Since there is no server-push mechanism available, a `setInterval` slowly creeps the bar from 15% to 98% over ~8 seconds, indicating activity. This prevents users from thinking the app is frozen.

---

## 4. `Home.js` — Analytics Dashboard

**File:** `src/pages/Home.js`

### Purpose
The landing page. Reads `localStorage` on mount and renders live statistics about the user's uploads, a cryptographic ratio bar, and the upload performance profiling bar chart.

### Code Walkthrough

#### 4.1 Statistics Cards

```javascript
const encryptedCount = uploads.filter(
  f => f.isEncrypted || f.name.endsWith('.encrypted')
).length;
```
Supports two detection methods for backwards compatibility:
- Modern uploads: checked via the `isEncrypted: true` boolean flag on the record object.
- Legacy uploads (before the flag was added): detected by checking if the filename ends with `.encrypted`.

#### 4.2 Cryptographic Ratio Bar

```javascript
const encryptedPercent = total > 0 ? (stats.encryptedFiles / total) * 100 : 0;
const plainPercent = total > 0 ? (stats.plainFiles / total) * 100 : 0;

<div style={{ width: `${encryptedPercent}%`, background: 'var(--primary-cyan)' }} />
<div style={{ width: `${plainPercent}%`, background: 'var(--primary-purple)' }} />
```
A simple CSS flexbox bar where two `div` elements sit side by side inside a `overflow: hidden` container. Their widths are percentages, and because they are both inside the same flex row, they fill the bar proportionally. The `transition: width 1s ease` CSS property animates the bar smoothly on initial load.

#### 4.3 Performance Profiling Graph

```javascript
const recentMetrics = perfMetrics.slice(-20);
const maxTime = Math.max(...recentMetrics.map(x => x.timeMs));
```
The graph always shows the **last 20** uploads only. `Math.max()` with a spread operator finds the tallest bar value, used to normalize all heights relative to 100%.

```javascript
const heightPct = maxTime === 0 ? 5 : (m.timeMs / maxTime) * 100;
const barColor = m.isEncrypted ? 'var(--primary-cyan)' : 'var(--primary-purple)';
```
Each bar's height is a percentage of the chart container's height (250px), calculated by dividing this bar's time by the maximum time. `minHeight: '4px'` ensures even very fast uploads are still visually visible.

```javascript
title={`Type: ${typeLabel}\nSize: ${sizeMb} MB\nTime: ${(m.timeMs / 1000).toFixed(2)} s`}
```
The HTML `title` attribute provides the hover tooltip. Time is converted from stored milliseconds to seconds (÷ 1000) and formatted to 2 decimal places for readability.

#### 4.4 Reset Graph Modal

```javascript
const [showResetConfirm, setShowResetConfirm] = useState(false);

// Modal triggered by:
onClick={() => setShowResetConfirm(true)}

// Confirmation action:
onClick={() => {
  localStorage.removeItem('perf_metrics');
  setPerfMetrics([]);
  setShowResetConfirm(false);
}}
```
A boolean state `showResetConfirm` controls modal visibility. The confirmation action:
1. Removes the `perf_metrics` key from `localStorage` entirely.
2. Updates the React state to `[]`, causing the graph to re-render as empty immediately without a page reload.
3. Closes the modal.

---

## 5. `Gallery.js` — Virtual File System & In-Browser Decryption

**File:** `src/pages/Gallery.js`  
*(888 lines — the most complex component)*

### Purpose
Acts as the application's Virtual File System. Since IPFS has no concept of directories, `Gallery.js` simulates folders entirely in browser `localStorage`. It also handles in-browser decryption and file previewing, drag-and-drop file organization, context menus, QR sharing, and PIN management.

### Code Walkthrough

#### 5.1 Virtual File System

```javascript
const visibleFolders = currentFolder === null ? folders : [];
const visibleFiles = uploads.filter(u =>
  currentFolder === null ? !u.folderId : u.folderId === currentFolder
);
```
**Folder Navigation Logic:**  
`currentFolder` holds the ID of the currently open folder, or `null` for the root view.
- In root view: all folders are shown, and only files with no `folderId` are shown.
- Inside a folder: no sub-folders are shown (flat structure), and only files whose `folderId` matches `currentFolder` are shown.

```javascript
const createFolder = (name) => {
  const newFolder = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString()
  };
  saveFolders([...folders, newFolder]);
  return newFolder;
};
```
Folders are simple objects with a unique ID (`Date.now()` as a string) and a name. They exist only in `localStorage`, not on the IPFS network. There is no server involvement.

#### 5.2 Drag-and-Drop File Organization

```javascript
onDragStart={e => {
  e.dataTransfer.setData('fileHash', file.hash);
}}
// On folder drop zone:
onDrop={e => {
  const draggedHash = e.dataTransfer.getData('fileHash');
  const updated = uploads.map(u =>
    u.hash === draggedHash ? { ...u, folderId: folder.id } : u
  );
  saveUploads(updated);
}}
```
HTML5 Drag-and-Drop API is used. When a file card is dragged, its IPFS hash is stored in `e.dataTransfer` (a temporary data store). When dropped onto a folder, the hash is read from `dataTransfer`, and the corresponding upload record in state/localStorage is updated with the target `folderId`. No network calls are involved — only local state mutations.

#### 5.3 Decryption Engine

This is the most technically significant logic in the application.

```javascript
const response = await fetch(`${apiBase}/download/${selectedItem.hash}`);
const encryptedContent = await response.text();
```
**Step 1 — Fetch Ciphertext:**  
The encrypted file is fetched from the backend proxy (`/download/:hash`), which fetches it from the local IPFS node. Since IPFS has CORS restrictions, a direct fetch from the browser to `localhost:8080/ipfs/...` would fail. The backend proxy bypasses this.

```javascript
const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

if (!decryptedString) {
  setStatus('Wrong password. Please try again.');
  return;
}
```
**Step 2 — AES Decryption:**  
`CryptoJS.AES.decrypt()` takes the ciphertext string and the user-provided password. If the password is wrong, the decrypted result will be a garbled sequence that fails `.toString(CryptoJS.enc.Utf8)` and returns an empty string. This empty string is the signal for a wrong password — no exception is thrown.

```javascript
const payload = JSON.parse(decryptedString);
if (payload.data) {
  finalDataUrl   = payload.data;
  finalFilename  = payload.name || finalFilename;
  finalMime      = payload.type || finalMime;
}
```
**Step 3 — Payload Unwrapping:**  
Recall that encryption wrapped the file data inside a JSON object (`{ name, type, data }`). Decryption unwraps this JSON to recover the original filename and MIME type. Legacy files (encrypted before this JSON wrapping was introduced) fall back to the raw decrypted string and use the `.encrypted` filename to guess the MIME type.

```javascript
const arr = finalDataUrl.split(',');
const bstr = atob(arr[1]);
let n = bstr.length;
const u8arr = new Uint8Array(n);
while (n--) u8arr[n] = bstr.charCodeAt(n);
const blob = new Blob([u8arr], { type: mime });
const url = window.URL.createObjectURL(blob);
```
**Step 4 — DataURL → Blob → ObjectURL:**  
The Base64 DataURL recovered from decryption cannot be used directly as an `<img>` or `<video>` source efficiently for large files. Instead, it is:
1. Split at the comma to separate the header (`data:image/png;base64`) from the Base64 payload.
2. Decoded from Base64 to a binary string via `atob()`.
3. Converted to a `Uint8Array` (raw binary byte array) character-by-character.
4. Placed into a `Blob` (Binary Large Object) with the correct MIME type.
5. An `ObjectURL` (`blob:http://...`) is created, which is a temporary browser-local URL pointing to this in-memory blob.

This ObjectURL is then set as the `src` of an `<img>`, `<video>`, or `<iframe>` tag for seamless in-browser preview.

```javascript
const closePreview = () => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    window.URL.revokeObjectURL(previewUrl);
  }
  setPreviewUrl(null);
};
```
**Memory Management:**  
`URL.revokeObjectURL()` frees the memory allocated for the blob URL. Without this, every file preview would leak memory in the browser tab for the duration of the session.

---

## 6. `RetrieveFile.js` — Hash-Based File Retrieval & Decryption

**File:** `src/pages/RetrieveFile.js`

### Purpose
Allows retrieval of any IPFS file using a raw CID (Content Identifier / hash), with or without a decryption password. Includes a multi-stage animated progress bar.

### Code Walkthrough

#### 6.1 Plain File Retrieval (No Password)

```javascript
if (!decryptionKey) {
  // ... show brief progress bar animation
  window.location.href = `${apiBase}/download/${hash}`;
  return;
}
```
For non-encrypted files, a browser redirect is used instead of an XHR fetch. This is because IPFS gateways often do not include a `Content-Length` header, which makes the XHR blob approach unreliable. A redirect allows the browser to handle the download natively, which always works regardless of response headers.

#### 6.2 Encrypted File Retrieval with Progress

```javascript
let fetchPct = 5;
const fetchTicker = setInterval(() => {
  fetchPct = Math.min(fetchPct + 0.8, 65);
  setRetrieveProgress(fetchPct);
}, 300);
```
**Simulated Progress:**  
Since IPFS gateways rarely provide real-time byte progress, a ticker-based simulation is used. The interval increments progress every 300ms by 0.8%, capping at 65%. If the XHR does provide real byte progress (via the `xhr.onprogress` event), the real value overrides the simulated one via `fetchPct = pct`.

#### 6.3 Decryption with Animated Progress

```javascript
let decryptPct = 70;
const decryptTimer = setInterval(() => {
  decryptPct += 3;
  setRetrieveProgress(Math.min(decryptPct, 92));
}, 40);

const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
clearInterval(decryptTimer);
```
`CryptoJS.AES.decrypt()` is **synchronous** — it blocks the JavaScript thread until complete. React cannot update the UI while JS is executing synchronously. The `setInterval` is started before calling `decrypt()` — the interval queues UI update callbacks, but they only execute after the decrypt call returns and the call stack clears. This creates the visual effect of animated progress during decryption, even though technically the bar renders its final position after the work is done. `clearInterval` stops the ticker immediately after decryption finishes.

#### 6.4 DataURL to Blob Conversion

```javascript
const arr = finalDataUrl.split(',');
const mimeMatch = arr[0].match(/:(.*?);/);
const mime = mimeMatch ? mimeMatch[1] : finalMime;
const bstr = atob(arr[1]);
// ... Uint8Array construction
const blob = new Blob([u8arr], { type: mime });
const url = window.URL.createObjectURL(blob);
```
Identical to the process in `Gallery.js`. The regex `/:(.*?);/` extracts the MIME type from the DataURL header (e.g., `image/png` from `data:image/png;base64,...`). This is used so that download prompts correctly suggest the original file extension.

---

## 7. Data Flow Summary

```
USER SELECTS FILE
      │
      ▼
FileReader.readAsDataURL()          ← Binary → Base64 DataURL
      │
      ▼ (if encrypted)
JSON.stringify({ name, type, data }) ← Wrap with metadata
      │
      ▼
CryptoJS.AES.encrypt(payload, key)   ← AES-256 Encryption
      │
      ▼
new Blob([ciphertext])               ← Text blob
      │
      ▼
XHR POST → /upload (Express Backend)
      │
      ▼
multer buffers file → ipfs.addAll()  ← Local Kubo daemon
      │
      ▼
CID returned to frontend             ← e.g., QmXyz...
      │
      ▼
localStorage.setItem('recentUploads')  ← Saved to Virtual FS

══════════════════════════════════════════════════════
ON RETRIEVAL / DECRYPT:

User provides CID + password
      │
      ▼
fetch /download/:hash (Express proxy) ← Fetches from IPFS
      │
      ▼
CryptoJS.AES.decrypt(ciphertext, key) ← AES-256 Decryption
      │
      ▼
JSON.parse(decryptedString)           ← Unwrap metadata
      │
      ▼
atob(base64) → Uint8Array → Blob      ← Binary reconstruction
      │
      ▼
URL.createObjectURL(blob)             ← In-memory browser URL
      │
      ▼
<img src={url} /> or <video src={url} />  ← Rendered in DOM
```

---

*Generated: 2026-03-23 | IPFS Secure Storage Application v1.0*
