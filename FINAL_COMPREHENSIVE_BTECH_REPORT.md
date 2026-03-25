# **IPFS Secure Storage Application — B.Tech Final Year Project Report**

*Department of Computer Science & Engineering*

---

## **Table of Contents**

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack — Detailed Justification](#4-technology-stack--detailed-justification)
5. [Detailed Feature Implementation](#5-detailed-feature-implementation)
   - 5.1 [Session-Based PIN Authentication](#51-session-based-pin-authentication)
   - 5.2 [Client-Side AES-256 Encryption Pipeline](#52-client-side-aes-256-encryption-pipeline)
   - 5.3 [XHR Upload with Real-Time Progress Tracking](#53-xhr-upload-with-real-time-progress-tracking)
   - 5.4 [Backend Upload Route & Pinata Integration](#54-backend-upload-route--pinata-integration)
   - 5.5 [Backend Download Route & Gateway Waterfall](#55-backend-download-route--gateway-waterfall)
   - 5.6 [Virtual File System & Folder Management](#56-virtual-file-system--folder-management)
   - 5.7 [In-Browser Decryption & File Preview Engine](#57-in-browser-decryption--file-preview-engine)
   - 5.8 [Hash-Based Direct Retrieval](#58-hash-based-direct-retrieval)
   - 5.9 [Secure Hash Vault](#59-secure-hash-vault)
   - 5.10 [Analytics Dashboard](#510-analytics-dashboard)
   - 5.11 [LAN Cross-Device Sharing via QR](#511-lan-cross-device-sharing-via-qr)
6. [Security Model & Threat Analysis](#6-security-model--threat-analysis)
7. [Data Persistence Schema](#7-data-persistence-schema)
8. [Recent Improvements & Bug Fixes](#8-recent-improvements--bug-fixes)
9. [Limitations](#9-limitations)
10. [Future Scope & Enhancements](#10-future-scope--enhancements)
11. [Conclusion](#11-conclusion)

---

## **1. Abstract**

The exponential growth of digital data has exposed critical vulnerabilities in traditional centralized cloud storage architectures, including single points of failure, data breaches, and lack of true data ownership. This report documents the complete design, implementation, and evaluation of a decentralized, cryptographic file storage application built upon the **InterPlanetary File System (IPFS)** protocol.

The system integrates:
- **Client-side AES-256 encryption** — files are encrypted entirely in the browser before any network transmission, ensuring zero-knowledge privacy.
- **Hybrid pinning strategy** — all files are pinned both to a local Kubo daemon and to Pinata enterprise nodes, ensuring 24/7 data availability even when the host machine goes offline.
- **Progressive Web App (PWA) architecture** — installable natively on Windows, macOS, Linux, Android, and iOS.
- **Virtual File System** — simulates directories over IPFS's fundamentally flat content-addressed storage.
- **Secure Hash Vault** — a decentralized password manager pairing CIDs with metadata for reliable re-access.

The result is a production-quality, zero-dependency cloud storage alternative that proves Web3 technology can be made accessible without sacrificing the polished user experience of Web2 applications.

---

## **2. Introduction**

### **2.1 Problem Statement**

Cloud storage providers (Google Drive, Dropbox, AWS S3) operate on centralized server-client models. This creates:

| Problem | Impact |
|---|---|
| **Centralized servers** | Single point of failure; one breach exposes all data |
| **Unencrypted at rest** | Provider can read user files; subpoenas are legally viable |
| **Vendor lock-in** | Data inaccessible if the provider goes bankrupt or changes pricing |
| **Censorship** | Provider or government can unilaterally delete content |

### **2.2 Motivation**

The IPFS protocol distributes data across a global peer-to-peer network using **content-addressed storage** — each file is identified by a cryptographic hash (CID) of its content. This eliminates centralized servers. However, IPFS natively provides **no privacy** — any data uploaded is public to anyone with the CID.

The motivation for this project is to build a **privacy layer on top of IPFS** that:
1. Encrypts data **before** it reaches any server or IPFS node.
2. Provides a modern, intuitive UI that hides P2P complexity from users.
3. Ensures **permanent global availability** via enterprise IPFS pinning.
4. Operates **entirely with open protocols** and no proprietary backends.

### **2.3 Objectives**

1. **Zero-Knowledge Privacy:** AES-256 encryption runs entirely in the browser. No plaintext ever leaves the user's device.
2. **Decentralization:** Eliminate reliance on a single central storage server via IPFS.
3. **Immutability:** CIDs mathematically guarantee retrieved files are identical to uploaded files.
4. **Usability:** React SPA with drag-and-drop, progress bars, modals, gallery, and analytics.
5. **Cross-Device Accessibility:** LAN QR code sharing and PWA installation.

---

## **3. System Architecture**

### **3.1 Three-Tier Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│          CLIENT TIER (Browser — React.js SPA)                │
│                                                              │
│  App.js → LockScreen → (PIN auth) → Router                  │
│    ├── /          → Home.js       (analytics dashboard)     │
│    ├── /upload    → Upload.js     (file select + encrypt)   │
│    ├── /gallery   → Gallery.js    (VFS + decrypt + preview) │
│    ├── /retrieve  → RetrieveFile  (CID-based retrieval)     │
│    └── /vault     → Vault.js      (secure hash vault)       │
│                                                              │
│  All AES operations run here (CryptoJS).                    │
│  All state stored in localStorage / sessionStorage.          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (XHR / fetch) on port 5002
┌──────────────────────────▼──────────────────────────────────┐
│          MIDDLEWARE TIER (Node.js + Express — server.js)     │
│                                                              │
│  POST /upload  → multer → Pinata API → hash_registry.json   │
│  GET  /download/:hash → hash_registry.json                  │
│                        → ipfs.ls() fallback                 │
│                        → Pinata pinList API fallback        │
│                        → Gateway waterfall → pipe to client │
│  GET  /ip      → os.networkInterfaces() → LAN IPv4          │
└──────────┬──────────────────────────────┬────────────────────┘
           │ HTTPS REST API               │ HTTP RPC :5001
┌──────────▼───────────┐       ┌─────────▼──────────────────┐
│  Pinata Cloud        │       │  Kubo IPFS Daemon          │
│  (Remote Pin Store)  │       │  (Local node, legacy ls)   │
└──────────────────────┘       └────────────────────────────┘
```

### **3.2 Dual-Layer Pinning Architecture**

Standard IPFS nodes perform **garbage collection** — unpinned content is eventually removed. This project avoids this with a hybrid pinning model.

| Layer | Technology | Purpose |
|---|---|---|
| **Layer 1 — Remote** | Pinata Cloud (JWT auth) | Enterprise nodes, 24/7 globally available, survives host machine going offline |
| **Layer 2 — Local** | Kubo daemon (`127.0.0.1:5001`) | Instant local access, legacy `ls` directory resolution, local gateway cache |

**Key design decision:** New uploads now go directly to Pinata (not through the local daemon's `ipfs.add`). This eliminates the previous pattern where local daemon timeouts could cause upload failures, and ensures every uploaded file has immediate global CDN availability.

### **3.3 Content-Addressed Storage**

When a file is submitted to IPFS:
1. The daemon **chunks** the file into 256KB blocks.
2. Each chunk is hashed using **SHA-256**.
3. Chunks are arranged into a **Merkle DAG** (Directed Acyclic Graph).
4. The root node's hash becomes the **CID** (Content Identifier) — e.g., `QmXyz123...`.

**Immutability Guarantee:** Changing a **single byte** of the file produces a completely different CID. The CID is both a unique address and a cryptographic proof of integrity.

---

## **4. Technology Stack — Detailed Justification**

### **4.1 Frontend**

**React.js 18 with Hooks**

All components use functional form with `useState` and `useEffect`. Class components are avoided entirely. Key patterns:
- `useState` — local component state (upload progress, modal visibility, form values)
- `useEffect(() => {...}, [])` — runs once on mount (equivalent to `componentDidMount`) for loading localStorage data

**CryptoJS — Why not Web Crypto API?**

| Feature | CryptoJS | Web Crypto API |
|---|---|---|
| Synchronous | ✅ | ❌ (Promise-based) |
| Password-based key derivation | ✅ Simple | ❌ Complex PBKDF2 setup |
| AES-256 | ✅ | ✅ |
| Browser support | Universal | Modern browsers only |

CryptoJS's synchronous nature integrates cleanly with the encrypt-then-upload sequential flow in `Upload.js`. The Web Crypto API would require `async/await` chains and explicit PBKDF2 calls, adding complexity without meaningful security benefit for this use case.

**Vanilla CSS with CSS Variables**

The global design system uses CSS custom properties (variables) defined in `index.css`:
```css
:root {
  --primary-cyan: #00f3ff;
  --primary-purple: #bc13fe;
  --text-dim: rgba(255,255,255,0.5);
  --glass-border: rgba(255,255,255,0.08);
}
```
This allows consistent theming across all components with zero JavaScript involvement.

### **4.2 Backend**

**multer `{ dest: 'uploads/' }` — Disk Storage**

Files are written to disk (not memory) before forwarding. This is critical for large files — in-memory storage would exhaust Node.js heap limits for uploads over ~50MB. The disk acts as a buffer that is cleaned up immediately after the Pinata API call succeeds.

**axios `responseType: 'stream'`**

For download proxying, `responseType: 'stream'` makes axios return the HTTP response body as a Node.js `Readable` stream rather than buffering the entire body. This enables:
```javascript
r.data.pipe(res); // Stream from IPFS gateway directly to client
```
No data is held in Node.js RAM, making downloads of arbitrarily large files memory-efficient.

---

## **5. Detailed Feature Implementation**

### **5.1 Session-Based PIN Authentication**

**Files:** `src/App.js`, `src/components/LockScreen.js`

**Session Storage vs Local Storage:**
```javascript
// App.js — check on every load:
const [isUnlocked, setIsUnlocked] = React.useState(
  sessionStorage.getItem('unlocked') === 'true'  // Tab-scoped
);

// LockScreen.js — set on successful PIN:
sessionStorage.setItem('unlocked', 'true');

// PIN stored persistently:
localStorage.setItem('app_pin', pinNewInput);
localStorage.getItem('app_pin') || '1234' // default
```

`sessionStorage` is tab-scoped and cleared when the tab closes. This means every new session requires PIN entry, protecting the application from unauthorized access if the user leaves their machine. `localStorage` is used for the PIN itself so the user's chosen PIN survives browser restarts.

**Render Gate Pattern:**
```javascript
if (!isUnlocked) return <LockScreen onUnlock={() => setIsUnlocked(true)} />;

return <Router>...</Router>; // Only rendered after PIN success
```
The entire `<Router>` — including all routes — is not mounted until `isUnlocked` is `true`. URL manipulation cannot bypass this because the route components don't exist in the DOM until the PIN is accepted.

**Auto-Verify on 4th Digit:**
```javascript
useEffect(() => {
  if (pin.length === 4) {
    if (pin === getStoredPin()) {
      sessionStorage.setItem('unlocked', 'true');
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => { setPin(''); setError(false); }, 500);
    }
  }
}, [pin, onUnlock]);
```
No submit button needed. The effect fires on every keystroke. 4 digits → immediate check → success or animated shake + reset.

---

### **5.2 Client-Side AES-256 Encryption Pipeline**

**File:** `src/pages/Upload.js` (when encryption password is provided)

The encryption runs in 4 sequential steps entirely inside the browser before any network activity:

**Step 1 — Binary → Base64 DataURL:**
```javascript
const fileDataUrl = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload  = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(selectedFile);
});
// Result: "data:image/png;base64,iVBORw0KGgoAAAAN..."
```
The `FileReader` API is asynchronous (browser I/O). It converts any binary file — image, PDF, video — into a Base64-encoded text string. The `data:` prefix contains the MIME type, which is needed to reconstruct the file later.

**Step 2 — Metadata JSON Wrapping:**
```javascript
const payload = JSON.stringify({
  name: selectedFile.name,  // "vacation_photo.jpg"
  type: selectedFile.type,  // "image/jpeg"
  data: fileDataUrl          // "data:image/jpeg;base64,..."
});
```
This is a **critical design decision.** Without embedding the filename and MIME type *inside* the ciphertext, decryption would return raw Base64 with no indication of the original file format. The JSON wrapper ensures symmetric information: everything needed to reconstruct the file is encrypted alongside the data.

**Step 3 — AES-256 Encryption:**
```javascript
const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
// Result: "U2FsdGVkX1+AbC123...xYz==" (Base64-encoded AES-CBC ciphertext)
```
`CryptoJS.AES.encrypt()` internally derives a 256-bit key from the password string using PBKDF2 with a random 64-bit salt. The salt is prepended to the ciphertext with the marker `Salted__`, ensuring the same password produces different ciphertext each time. The `.toString()` call converts the `CipherParams` object to a Base64 string suitable for text transmission.

**Step 4 — Package as File Object:**
```javascript
const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
fileToUpload = new File(
  [encryptedBlob],
  selectedFile.name + '.encrypted',
  { type: 'text/plain' }
);
```
The ciphertext is repackaged as a `File` object (a subclass of `Blob`) with `.encrypted` appended to the filename. This dual-purpose: it signals encryption status to the application when the file is retrieved from the Gallery, and ensures the correct `Content-Type` header during upload.

---

### **5.3 XHR Upload with Real-Time Progress Tracking**

**File:** `src/pages/Upload.js`

```javascript
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
- `fetch()` does not expose upload progress events at all.
- `axios` can simulate download progress but upload progress is unreliable.
- `XMLHttpRequest.upload.onprogress` provides `e.loaded` and `e.total` bytes with reliable cross-browser support.

The progress bar uses a **segmented progress model**:
- `0% → 15%` — file bytes being transferred to Express server
- `15% → 98%` — waiting for Pinata to pin the file to IPFS nodes globally (slow interval timer)
- `100%` — CID received, upload complete

The pinning Phase is simulated:
```javascript
pinningTimer = setInterval(() => {
  pct += 0.5;          // 0.5% every 50ms = 98% in ~8.3 seconds
  if (pct <= 98) setUploadProgress(pct);
}, 50);
```
This prevents the UI from appearing frozen during the Pinata API call, which can take anywhere from 1 to 120+ seconds for large files.

---

### **5.4 Backend Upload Route & Pinata Integration**

**File:** `server.js`, Route: `POST /upload`

```javascript
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file; // { path, originalname, size, mimetype }

  const formData = new FormData();
  formData.append('file',
    fs.createReadStream(file.path),  // Stream from disk, not in RAM
    { filename: file.originalname }
  );
  formData.append('pinataMetadata', JSON.stringify({ name: file.originalname }));
  formData.append('pinataOptions', JSON.stringify({
    cidVersion: 0,
    wrapWithDirectory: false  // Return direct CID, not directory wrapper
  }));

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      maxBodyLength: 'Infinity',
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.PINATA_JWT}` // From .env
      }
    }
  );

  const hash = response.data.IpfsHash; // e.g., "QmAbcDef123..."
  const db = loadRegistry();
  db[hash] = file.originalname;        // Save CID → filename mapping
  saveRegistry(db);
  fs.unlinkSync(file.path);            // Delete temp file
  res.json({ hash });
});
```

**`wrapWithDirectory: false`** — When `true`, Pinata returns a directory-wrapper CID that contains the file. The actual file is at `<dirCID>/<filename>`. This complicates download URL construction. With `false`, the CID points directly to the file content.

**`fs.createReadStream`** — Streams the file from the temporary disk location to Pinata without loading it into memory. For a 500MB video, this keeps Node.js memory usage near-constant regardless of file size.

**`fs.unlinkSync(file.path)`** — Called in *both* the success path and the catch block. The temporary file must always be cleaned up, whether or not the Pinata call succeeds.

---

### **5.5 Backend Download Route & Gateway Waterfall**

**File:** `server.js`, Route: `GET /download/:hash`

The download route resolves the filename using a **3-step lookup cascade** before attempting download:

```
Step 1: hash_registry.json (O(1) lookup)
  ↓ (if not found)
Step 2: ipfs.ls(hash, {timeout: 2000}) — for legacy dir-wrapped files
  ↓ (if not found)
Step 3: Pinata pinList API query — for files not in local registry
  ↓ (if not found)
Fallback: "<hash>.enc" — clearly marks unknown encrypted blobs
```

**Gateway Waterfall for Download:**
```javascript
const isKnownPinataFile = !!db[hash];
const gateways = isKnownPinataFile
  ? [process.env.PINATA_GATEWAY, 'https://dweb.link', 'http://127.0.0.1:8080', 'https://ipfs.io']
  : ['http://127.0.0.1:8080', process.env.PINATA_GATEWAY, 'https://dweb.link', 'https://ipfs.io'];
```

**Gateway ordering rationale:**
- Files in the registry were uploaded to Pinata → Pinata's CDN is fastest.
- Legacy files (pre-registry) are on the local node → local gateway is fastest.
- `dweb.link` (Protocol Labs CDN) is tried before public IPFS gateways.
- `ipfs.io` is the last resort — highly rate-limited.

**Response Streaming:**
```javascript
const r = await axios.get(`${gateway}/ipfs/${targetPath}`, {
  responseType: 'stream',
  timeout: 15000
});

res.setHeader('Content-Disposition', `${disposition}; filename="${safe}"`);
res.setHeader('Content-Type', req.query.type === 'view' ? getMimeType(filename) : 'application/octet-stream');
res.setHeader('Cache-Control', 'public, max-age=3600');

r.data.pipe(res);
```

`responseType: 'stream'` makes the gateway response a Node.js `Readable`. `r.data.pipe(res)` connects it directly to the Express response — bytes flow from IPFS gateway → Node.js → browser without buffering in RAM. `Cache-Control: max-age=3600` caches gallery images for 1 hour, making repeated views instant.

---

### **5.6 Virtual File System & Folder Management**

**File:** `src/pages/Gallery.js`

Since IPFS stores only content with no directory concept, `Gallery.js` simulates a file system entirely in `localStorage`:

```javascript
// localStorage schema:
// folders: [{ id: "1742000000000", name: "Photos", createdAt: "2026-01-01T..." }]
// recentUploads: [{ hash: "QmXyz...", name: "photo.jpg", folderId: "1742000000000", ... }]

const visibleFolders = currentFolder === null ? folders : [];
const visibleFiles   = uploads.filter(u =>
  currentFolder === null ? !u.folderId : u.folderId === currentFolder
);
```

Folder creation assigns a `Date.now()` timestamp as a unique ID — guaranteed unique within a single browser session without needing a UUID library.

**Drag-and-Drop File Organization:**
```javascript
// File card — drag start:
onDragStart={e => e.dataTransfer.setData('fileHash', file.hash)}

// Folder div — drop target:
onDrop={e => {
  const draggedHash = e.dataTransfer.getData('fileHash');
  const updated = uploads.map(u =>
    u.hash === draggedHash ? { ...u, folderId: folder.id } : u
  );
  saveUploads(updated); // state + localStorage update
}}
```

`e.dataTransfer` is a temporary clipboard scoped to one drag operation. No network calls occur — this is a pure `localStorage` mutation that resolves in milliseconds.

**Custom Drag Ghost:**
```javascript
const ghost = document.createElement('div');
ghost.textContent = '↗ ' + file.name.slice(0, 28) + '…';
Object.assign(ghost.style, {
  position: 'fixed', top: '-200px', left: '-200px', // off-screen
  background: '#1c1c1e', color: 'var(--primary-cyan)',
  border: '1px solid var(--primary-cyan)', borderRadius: '8px'
});
document.body.appendChild(ghost);
e.dataTransfer.setDragImage(ghost, 0, 0);
setTimeout(() => document.body.removeChild(ghost), 0);
```
The browser's default drag ghost is a faded thumbnail of the dragged element. The custom ghost is styled to match the app's design. The `setTimeout(() => removeChild, 0)` defers removal until after the browser has captured the image for the drag — removing it synchronously would prevent the drag image from appearing.

---

### **5.7 In-Browser Decryption & File Preview Engine**

**File:** `src/pages/Gallery.js`, function `processDecryption()`

This is the most technically complex function in the application. 4 sequential steps reconstruct the original file from ciphertext without server-side decryption.

**Step 1 — Fetch ciphertext via CORS proxy:**
```javascript
const response = await fetch(`${apiBase}/download/${selectedItem.hash}`);
const encryptedContent = await response.text();
```
Direct browser-to-IPFS requests fail with CORS errors. The Express backend at `:5002` serves `Access-Control-Allow-Origin: *`, acting as the CORS bridge.

**Step 2 — AES-256 Decryption:**
```javascript
const decryptedBytes  = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

if (!decryptedString) {
  setStatus('Wrong password. Please try again.');
  return;
}
```
`CryptoJS.AES.decrypt()` does not throw exceptions on wrong passwords. It returns a `WordArray` that converts to an empty/garbled string when the key is wrong. The empty-string check provides clean wrong-password detection.

**Step 3 — JSON payload unwrapping:**
```javascript
try {
  const payload = JSON.parse(decryptedString);
  if (payload.data) {
    finalDataUrl  = payload.data;  // "data:image/png;base64,..."
    finalFilename = payload.name;  // "vacation_photo.png"
    finalMime     = payload.type;  // "image/png"
  }
} catch (e) {
  // Legacy plaintext fallback — decryptedString is the raw Base64 DataURL
}
```

**Step 4 — DataURL → Uint8Array → Blob → ObjectURL:**
```javascript
const arr   = finalDataUrl.split(',');             // ["data:image/png;base64", "iVBOR..."]
const mime  = arr[0].match(/:(.*?);/)[1];          // "image/png" (regex extraction)
const bstr  = atob(arr[1]);                         // Base64 → binary string
const u8arr = new Uint8Array(bstr.length);
for (let n = bstr.length - 1; n >= 0; n--) {
  u8arr[n] = bstr.charCodeAt(n);                   // char code = byte value
}
const blob = new Blob([u8arr], { type: mime });
const url  = window.URL.createObjectURL(blob);     // "blob:http://localhost:3000/abc-123"
```

- `atob()` — Base64 decoder. Returns a binary string where each character's char code equals one byte (0–255).
- The `while` loop converts the binary string to a `Uint8Array` — a fixed-size typed array of unsigned 8-bit integers. This is the format required by `Blob`.
- `URL.createObjectURL()` — registers the in-memory blob with the browser's URL scheme and returns a short-lived URL. The browser can render this URL as if it were a real HTTP URL.

**Memory Management:**
```javascript
const closePreview = () => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    window.URL.revokeObjectURL(previewUrl); // Free memory
  }
  setPreviewUrl(null);
};
```
Each ObjectURL holds a reference to the raw blob data in RAM. Without `revokeObjectURL`, decrypting and previewing 10 images would hold 10 complete files in memory simultaneously.

---

### **5.8 Hash-Based Direct Retrieval**

**File:** `src/pages/RetrieveFile.js`

#### Plain File Download (No Password)
```javascript
if (!decryptionKey) {
  window.location.href = `${apiBase}/download/${hash}`;
  return;
}
```
A browser navigation redirect is used instead of an XHR blob fetch. IPFS gateways often omit the `Content-Length` header, causing XHR blob approaches to terminate early. A redirect lets the browser apply its own native streaming download logic, which always works regardless of response headers.

#### Encrypted File — Staged Progress Bar
```javascript
// Phase 1: Simulated fetch progress (gateways rarely send Content-Length)
let fetchPct = 5;
const fetchTicker = setInterval(() => {
  fetchPct = Math.min(fetchPct + 0.8, 65);
  setRetrieveProgress(fetchPct);
}, 300);

// If real byte progress IS available, override ticker:
xhr.onprogress = (e) => {
  if (e.lengthComputable) {
    fetchPct = (e.loaded / e.total) * 65;
    setRetrieveProgress(fetchPct);
  }
};
```

```javascript
// Phase 2: Decryption animation (synchronous call blocks the thread)
let decryptPct = 70;
const decryptTimer = setInterval(() => {
  decryptPct += 3;
  setRetrieveProgress(Math.min(decryptPct, 92));
}, 40);

const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey); // BLOCKS
clearInterval(decryptTimer);
```

The `setInterval` callbacks are queued in the JavaScript event loop *before* `decrypt()` is called. Since `decrypt()` is synchronous and monopolizes the call stack, React cannot process state updates during it. After `decrypt()` returns, the event loop processes the pending interval callbacks, causing React to re-render with the updated progress value in one flush. The effect is visually animated progress during decryption.

---

### **5.9 Secure Hash Vault**

**File:** `src/pages/Vault.js`

The Vault serves as a **decentralized bookmark manager** — an organized record of important CIDs that the user may need to revisit without searching upload history.

**Export:**
```javascript
const dataStr = "data:text/json;charset=utf-8,"
  + encodeURIComponent(JSON.stringify(vaultItems));
const a = document.createElement('a');
a.setAttribute("href", dataStr);
a.setAttribute("download", "ipfs-vault-backup.json");
a.click();
```
Creates a JSON DataURL entirely in the browser — no server call. `encodeURIComponent` ensures special characters in filenames/CIDs don't break the DataURL syntax.

**Import with Hash Deduplication:**
```javascript
const currentHashes = new Set(vaultItems.map(i => i.hash)); // O(1) lookups
const newItems = importedItems.filter(i => !currentHashes.has(i.hash));
const updatedVault = [...vaultItems, ...newItems];
```
`Set` provides O(1) hash membership tests. The filter retains only genuinely new items, making import idempotent — running it multiple times with the same backup file has no effect after the first.

The decryption pipeline in `Vault.js` is identical to `Gallery.js`: Fetch → AES.decrypt → JSON.parse → DataURL→Uint8Array→Blob→ObjectURL.

---

### **5.10 Analytics Dashboard**

**File:** `src/pages/Home.js`

**Storage Statistics (with backward compatibility):**
```javascript
const encryptedCount = uploads.filter(
  f => f.isEncrypted || f.name.endsWith('.encrypted')
).length;
```
Two detection strategies ensure records from before the `isEncrypted` flag was added are still correctly classified.

**Cryptographic Ratio Bar:**
```javascript
const encryptedPercent = total > 0 ? (stats.encryptedFiles / total) * 100 : 0;
const plainPercent     = total > 0 ? (stats.plainFiles / total) * 100 : 0;

// Two flex children filling a shared fixed-width parent:
<div style={{ width: `${encryptedPercent}%`, background: 'var(--primary-cyan)' }} />
<div style={{ width: `${plainPercent}%`, background: 'var(--primary-purple)' }} />
```
Because both percentages sum to 100%, the two `<div>` elements always fill the bar exactly. `transition: width 1s ease` creates a smooth animation on initial render.

**Performance Graph:**
```javascript
const recentMetrics = perfMetrics.slice(-20);      // Rolling window: last 20 uploads
const maxTime = Math.max(...recentMetrics.map(x => x.timeMs));
// Per bar:
const heightPct = maxTime === 0 ? 5 : (m.timeMs / maxTime) * 100;
const barColor  = m.isEncrypted ? 'var(--primary-cyan)' : 'var(--primary-purple)';
```
Normalization: the fastest-ever upload gets the lowest bar and the slowest gets 100% height. This makes relative performance differences visible regardless of absolute time values.

**Tooltip (hover):**
```javascript
title={`Type: ${typeLabel}\nSize: ${sizeMb} MB\nTime: ${(m.timeMs / 1000).toFixed(2)} s`}
```
Time stored in milliseconds, displayed in seconds with 2 decimals (e.g., `1.25 s`) for user readability.

**Reset Graph Modal:**
```javascript
// Trigger:
onClick={() => setShowResetConfirm(true)}

// Confirmation:
onClick={() => {
  localStorage.removeItem('perf_metrics');
  setPerfMetrics([]);         // Immediate re-render to empty state
  setShowResetConfirm(false);
}}
```
Three synchronous operations: remove from storage, clear React state (triggers re-render), dismiss modal. Replaces the native `window.confirm()` dialog with a fully styled glassmorphic React component.

---

### **5.11 LAN Cross-Device Sharing via QR**

**File:** `server.js` (`/ip` endpoint) + `Gallery.js`

```javascript
// server.js:
const interfaces = os.networkInterfaces();
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      if (!iface.address.startsWith('169.254.')) { // Skip APIPA
        return res.json({ ip: iface.address });
      }
    }
  }
}
```

**APIPA Filter:** Addresses in `169.254.0.0/16` are **Automatic Private IP Addressing** addresses issued when a network adapter is connected but cannot reach a DHCP server. These are useless for LAN sharing — including them would generate invalid QR codes.

```javascript
// Gallery.js — QR modal:
<QRCodeSVG
  value={`http://${localIp}:5002/download/${qrHash}`}
  size={200}
/>
```
The QR code encodes a direct download URL. Scanning on a mobile device on the same Wi-Fi network opens the file in the mobile browser.

---

## **6. Security Model & Threat Analysis**

| Threat Vector | Mitigation | Implementation |
|---|---|---|
| **Remote server data breach** | Server only ever receives ciphertext — never plaintext | Encryption runs in `Upload.js` before `XHR.send()` |
| **IPFS public network snooping** | All IPFS-visible data is AES-256-CBC ciphertext. Statistically infeasible to brute-force a strong password. | `CryptoJS.AES.encrypt(payload, key)` |
| **Unauthorized local access** | PIN-gated session guard blocks all routes | `App.js` render gate + `sessionStorage` unlock token |
| **Wrong password silent failure** | `toString(CryptoJS.enc.Utf8)` returns empty string on wrong key — no exception propagation | Empty-string check in `processDecryption()` |
| **Password stored on server** | Decryption keys never leave the browser's RAM | No key fields in any API request to backend |
| **API key exposure** | `PINATA_JWT` is in `.env`, loaded server-side only | Never referenced in any React source file |
| **Cross-origin attacks (CORS)** | Express `cors()` middleware + `Access-Control-Allow-Origin: *` | All gateway responses include CORS headers |
| **Insecure download prompts** | `Content-Disposition: attachment` forces Save-As with correct filename | `encodeURIComponent(filename)` prevents header injection |

**Zero-Knowledge Guarantee:**
The architecture ensures that at no point in the upload pipeline does any server-side process have access to plaintext file data or decryption keys. The sequence guarantees:
```
User RAM [plaintext] → CryptoJS encrypt → [ciphertext] → XHR → Express → Pinata → IPFS
                                                                  ↑
                                                         (never sees plaintext or key)
```

---

## **7. Data Persistence Schema**

All persistent state is stored in the browser's `localStorage` (except session unlock which uses `sessionStorage`):

### `recentUploads` — Upload History

```json
[
  {
    "hash": "QmXyz123...",
    "name": "photo.jpg.encrypted",
    "date": "3/23/2026",
    "isEncrypted": true,
    "folderId": "1742000000000",
    "size": 524288
  }
]
```

### `folders` — Virtual Folder Structure

```json
[
  {
    "id": "1742000000000",
    "name": "Photos",
    "createdAt": "2026-03-23T17:30:00.000Z"
  }
]
```

### `vault_items` — Secure Vault Entries

```json
[
  {
    "hash": "QmAbc456...",
    "name": "contract.pdf.encrypted",
    "date": "3/23/2026",
    "isEncrypted": true,
    "addedToVaultAt": "2026-03-23T17:35:00.000Z"
  }
]
```

### `perf_metrics` — Performance Graph Data

```json
[
  {
    "sizeBytes": 524288,
    "timeMs": 3240,
    "isEncrypted": true,
    "date": "2026-03-23T17:40:00.000Z"
  }
]
```

*Rolling window: last 50 entries. Oldest entry removed (FIFO) when cap is reached.*

### `app_pin` — Session PIN

```
"1234"  (default, overwritten by user via Change PIN modal in Gallery)
```

---

## **8. Recent Improvements & Bug Fixes**

### **8.1 Duplicate Performance Graph Bars — Root Cause & Fix**

**Symptom:** Uploading an encrypted file caused **two bars** to appear in the performance graph — one purple (plain-text) and one cyan (encrypted) — for what was a single file.

**Root Cause:**
```javascript
// Bug: inside the encryption block — BEFORE XHR starts:
const encryptTimeMs = Math.round(t1 - t0);
metrics.push({ sizeBytes, timeMs: encryptTimeMs, date });  // ← no isEncrypted flag
localStorage.setItem('perf_metrics', JSON.stringify(metrics));

// Later, in xhr.upload.onload:
metrics.push({ sizeBytes, timeMs: totalUploadMs, isEncrypted: true, date }); // correct
```
The first push (encryption-only timing, no `isEncrypted` flag) was interpreted by the graph as a plain-text upload. The second push (total time, `isEncrypted: true`) rendered correctly as cyan. Result: two bars per encrypted upload.

**Fix:** Removed the intermediate encryption-timing metric write entirely. The single write in `xhr.upload.onload` captures total end-to-end time and the correct `isEncrypted` flag.

### **8.2 Custom Reset Confirmation Modal**

**Before:** `window.confirm()` — a blocking, un-styleable native browser dialog that interrupts the UI thread and looks visually inconsistent with the app's glassmorphic design.

**After:** A React state-controlled modal overlay:
```jsx
{showResetConfirm && (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(5px)',
    zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      background: '#111114', padding: '2.5rem', borderRadius: '16px',
      border: '1px solid rgba(255,77,77,0.3)', maxWidth: '400px'
    }}>
      <h3>RESET GRAPH?</h3>
      <p>This will permanently clear all performance metrics...</p>
      <button onClick={() => setShowResetConfirm(false)}>Cancel</button>
      <button onClick={() => { localStorage.removeItem('perf_metrics'); setPerfMetrics([]); setShowResetConfirm(false); }}>
        Yes, Reset
      </button>
    </div>
  </div>
)}
```

### **8.3 Performance Time Unit: ms → s**

`(m.timeMs / 1000).toFixed(2)` converts stored milliseconds to seconds with 2 decimal places for display in bar chart tooltips. Example: `3240 ms → 3.24 s`.

### **8.4 Empty State Text Correction**

Changed from *"Upload encrypted files to generate performance data."* to *"Upload files to generate performance data."* — accurately reflecting that both encrypted (cyan) and plain-text (purple) uploads contribute bars to the graph.

---

## **9. Limitations**

| Limitation | Detail |
|---|---|
| **No password recovery** | AES-256 with user-supplied password is mathematically unrecoverable without the key. By design. |
| **localStorage-tied VFS** | Upload history and folder structure are browser-specific. Clearing browser data erases the Virtual File System (IPFS content remains accessible via CID if known). |
| **Pinata API dependency** | Upload success requires valid `PINATA_JWT` and Pinata service availability. |
| **Synchronous encryption** | `CryptoJS.AES.encrypt/decrypt` runs on the main JavaScript thread. Very large files (>200MB) may freeze the UI briefly during encryption. |
| **No multi-file upload** | Current design processes one file per upload operation. |
| **Storage cap** | `localStorage` is typically limited to 5–10MB depending on the browser. With many uploads, the metadata could theoretically approach this limit (each record is ~200 bytes, so ~25,000–50,000 files). |

---

## **10. Future Scope & Enhancements**

| Enhancement | Technical Approach | Benefit |
|---|---|---|
| **Blockchain Vault** | Ethereum/Polygon smart contract storing encrypted IPFS metadata on-chain | Multi-device sync without central database |
| **IPNS Integration** | Use IPNS to publish a mutable pointer to the latest version of a file | Static URL that updates when file is re-uploaded |
| **Web Worker Encryption** | Move `CryptoJS` to a `Worker` thread | Prevents main-thread blocking during large file encryption |
| **File Sharding** | Split files into N encrypted shards across different nodes | Increased redundancy and parallel download speeds |
| **End-to-End Share Links** | Encode decryption key in the URL hash fragment (`#key=...`) | Recipient can decrypt from a single link |
| **Multi-File Batch Upload** | Process `e.dataTransfer.files` array instead of `files[0]` | Upload multiple files in one operation |
| **OPFS Storage** | Replace `localStorage` with Origin Private File System | MB → GB storage capacity for metadata |

---

## **11. Conclusion**

The IPFS Secure Storage Application successfully demonstrates a paradigm shift away from centralized data silos. The project achieves all five core objectives defined in the introduction:

1. ✅ **Zero-Knowledge Privacy** — AES-256 client-side encryption guarantees the server never receives plaintext.
2. ✅ **Decentralization** — Dual-layer IPFS pinning (local + Pinata) eliminates single-server dependency.
3. ✅ **Immutability** — Content-Addressed Storage with SHA-256-rooted Merkle DAGs ensures retrieved files are cryptographically identical to originals.
4. ✅ **Usability** — Drag-and-drop upload, animated progress, gallery with decryption-as-preview, Virtual File System, and PIN-gated vault provide a polished, modern user experience.
5. ✅ **Accessibility** — LAN QR sharing and PWA installability enable cross-device access without complex networking.

By abstracting the command-line complexity of the IPFS daemon behind a production-quality React interface with glassmorphic aesthetics, customized animations, and a comprehensive analytics dashboard, this project definitively proves that the security and resilience of Web3 architectures can coexist with the intuitive, friendly UX expected from modern Web2 applications.

---

*B.Tech Final Year Project — Computer Science & Engineering*
*Documentation version: 2026-03-23 | Application version: 1.1*
