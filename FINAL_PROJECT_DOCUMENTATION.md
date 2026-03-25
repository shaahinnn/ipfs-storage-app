# IPFS Secure Storage Application — Comprehensive Project Documentation

> **A detailed technical reference covering system architecture, feature implementation, API internals, security model, and data flow for the IPFS Secure Storage App.**

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
   - 2.1 [Problem Statement](#21-problem-statement)
   - 2.2 [Motivation & Design Goals](#22-motivation--design-goals)
   - 2.3 [Project Objectives](#23-project-objectives)
3. [Technology Stack](#3-technology-stack)
   - 3.1 [Frontend](#31-frontend)
   - 3.2 [Backend](#32-backend)
   - 3.3 [Storage Protocol](#33-storage-protocol)
4. [System Architecture](#4-system-architecture)
   - 4.1 [Three-Tier Design](#41-three-tier-design)
   - 4.2 [Dual-Layer Pinning Strategy](#42-dual-layer-pinning-strategy)
   - 4.3 [Data Flow Diagram](#43-data-flow-diagram)
5. [Backend — `server.js`](#5-backend--serverjs)
   - 5.1 [Middleware & Configuration](#51-middleware--configuration)
   - 5.2 [Hash Registry](#52-hash-registry)
   - 5.3 [LAN IP Detection (`/ip`)](#53-lan-ip-detection-ip)
   - 5.4 [Upload Route (`POST /upload`)](#54-upload-route-post-upload)
   - 5.5 [Download Route (`GET /download/:hash`)](#55-download-route-get-downloadhash)
   - 5.6 [Gateway Waterfall Strategy](#56-gateway-waterfall-strategy)
6. [Frontend — Core Components](#6-frontend--core-components)
   - 6.1 [`App.js` — Session Gate & Routing](#61-appjs--session-gate--routing)
   - 6.2 [`LockScreen.js` — PIN Authentication](#62-lockscreenjs--pin-authentication)
   - 6.3 [`Upload.js` — Encryption & Upload Pipeline](#63-uploadjs--encryption--upload-pipeline)
   - 6.4 [`Home.js` — Analytics Dashboard](#64-homejs--analytics-dashboard)
   - 6.5 [`Gallery.js` — Virtual File System & Decryption Engine](#65-galleryjs--virtual-file-system--decryption-engine)
   - 6.6 [`RetrieveFile.js` — Hash-Based Retrieval](#66-retrievefilejs--hash-based-retrieval)
   - 6.7 [`Vault.js` — Secure Hash Vault](#67-vaultjs--secure-hash-vault)
7. [Security Model](#7-security-model)
8. [localStorage Data Schema](#8-localstorage-data-schema)
9. [Recent Bug Fixes & Improvements](#9-recent-bug-fixes--improvements)
10. [Advantages & Limitations](#10-advantages--limitations)
11. [Future Scope](#11-future-scope)
12. [Conclusion](#12-conclusion)

---

## 1. Abstract

The rapid growth of data generation has exposed vulnerabilities and privacy concerns inherent in centralized cloud storage systems. This project presents the design, implementation, and evaluation of a decentralized, cryptographic file storage application utilizing the InterPlanetary File System (IPFS) protocol.

By integrating **client-side AES-256 encryption**, a **dual-layer pinning strategy** (local Kubo daemon + global Pinata network), and a **Progressive Web App (PWA)** architecture, this application ensures zero-knowledge privacy, data immutability, and persistent accessibility. The system abstracts the complexity of Content-Addressed Storage through a Virtual File System and a Secure Hash Vault, providing users with a familiar interface for decentralized data management.

---

## 2. Introduction

### 2.1 Problem Statement

Current cloud storage providers (Google Drive, Dropbox, AWS S3) operate on centralized server-client models. This mandates that users:
- **Implicitly trust** third-party corporations with unencrypted sensitive data.
- Accept that data is **subject to corporate surveillance**, potential data breaches, and arbitrary deletion or censorship.
- Rely on the **availability of a single provider's infrastructure** — a single point of failure.

### 2.2 Motivation & Design Goals

The IPFS protocol solves centralization by distributing data across a global Peer-to-Peer (P2P) network. However, IPFS **natively lacks privacy** — any data uploaded to IPFS is publicly readable by anyone who possesses its Content Identifier (CID/hash).

The motivation behind this project is to build a secure layer on top of IPFS that:
- **Guarantees absolute data privacy** via client-side encryption (the server never sees unencrypted data).
- Provides a **familiar, modern user interface** that hides the complexity of Web3 concepts.
- Ensures **data permanence** through enterprise-grade pinning services.

### 2.3 Project Objectives

| # | Objective | Implementation |
|---|-----------|---------------|
| 1 | Zero-Knowledge Privacy | AES-256 encryption runs entirely in the browser |
| 2 | Decentralization | IPFS Kubo daemon + Pinata remote pinning |
| 3 | Immutability | Content-Addressed Storage (CID = SHA-256 hash of content) |
| 4 | Usability | React SPA with drag-and-drop, modals, progress bars |
| 5 | Cross-Device Access | LAN QR code sharing, PWA installable on any OS |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Role |
|---|---|---|
| **React.js** | 18 | UI framework — functional components with hooks |
| **react-router-dom** | v6 | Client-side page routing (SPA navigation) |
| **CryptoJS** | 4.x | AES-256 encryption/decryption in the browser |
| **qrcode.react** | 3.x | QR code generation for LAN file sharing |
| **Vanilla CSS** | — | Glassmorphism design system, CSS variables, animations |

**Why CryptoJS over the Web Crypto API?**  
The Web Crypto API is asynchronous and more complex to use with password-based key derivation. CryptoJS is synchronous, making it easier to integrate with the sequential encrypt-then-upload flow, and its AES-256-CBC implementation is cryptographically sound for this use case.

### 3.2 Backend

| Technology | Role |
|---|---|
| **Node.js + Express.js** | HTTP server, CORS proxy for IPFS daemon |
| **multer** | `multipart/form-data` parsing, temporary file buffering |
| **axios** | HTTP calls to Pinata API and IPFS gateways |
| **ipfs-http-client** | Connects to local Kubo daemon for legacy `ls` operations |
| **dotenv** | Loads `PINATA_JWT` and `PINATA_GATEWAY` from `.env` |
| **form-data** | Constructs multipart payloads for Pinata API |
| **cors** | Enables cross-origin requests from `localhost:3000` to `:5002` |

### 3.3 Storage Protocol

| Component | Role |
|---|---|
| **Kubo (go-ipfs) Daemon** | Local IPFS node; manages DHT, peer connections, local cache |
| **Pinata Cloud** | Remote enterprise pinning; JWT-authenticated API |
| **IPFS Gateways** | HTTP bridges to the IPFS network: Pinata CDN, dweb.link, ipfs.io |

---

## 4. System Architecture

### 4.1 Three-Tier Design

```
┌─────────────────────────────────────────────────────┐
│  CLIENT TIER (Browser: React + CryptoJS)             │
│  - Parses files, performs AES-256 encryption         │
│  - Manages Virtual File System in localStorage       │
│  - Renders all UI: Gallery, Upload, Vault, Home      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP on :5002 (XHR / fetch)
┌──────────────────────▼──────────────────────────────┐
│  MIDDLEWARE TIER (Node.js + Express server.js)       │
│  - Receives encrypted blob from browser              │
│  - Pins to Pinata via REST API                       │
│  - Proxy-downloads from IPFS gateways                │
│  - Maintains hash_registry.json                      │
└──────────┬───────────────────────┬──────────────────┘
           │ Pinata REST API        │ ipfs-http-client
┌──────────▼──────────┐  ┌─────────▼────────────────┐
│  Pinata Cloud       │  │  Local Kubo Daemon :5001  │
│  (Remote IPFS Pins) │  │  (Local IPFS node)        │
└─────────────────────┘  └──────────────────────────┘
```

### 4.2 Dual-Layer Pinning Strategy

Standard IPFS performs "garbage collection" — data that is not "pinned" locally is eventually pruned. This project avoids this via a **hybrid pinning model**:

- **Layer 1 — Pinata Remote Node:** Every file uploaded through the app is immediately pinned on Pinata's enterprise servers. This ensures 24/7 availability, even when the host machine is offline. Pinata's JWT is stored in the server's `.env` file and never exposed to the browser.

- **Layer 2 — Local Kubo Node (Legacy):** The local daemon (`127.0.0.1:5001`) is retained for legacy `ls` directory operations and local gateway access (`127.0.0.1:8080`). New uploads bypass the local daemon entirely, going straight to Pinata.

### 4.3 Data Flow Diagram

```
UPLOAD PATH:
File selected in browser
  → FileReader.readAsDataURL()         (binary → Base64 DataURL)
  → JSON.stringify({ name, type, data }) (embed metadata)
  → CryptoJS.AES.encrypt(payload, key)  (AES-256-CBC ciphertext)
  → FormData + XHR POST /upload         (to Express backend)
  → multer buffers to /uploads/          (temp file on disk)
  → axios.post Pinata API               (pin to IPFS globally)
  → IPFS CID returned as JSON            (e.g., QmXyz...)
  → localStorage.recentUploads.push()   (saved to Virtual FS)
  → perf_metrics.push()                 (recorded for graph)

DOWNLOAD/DECRYPT PATH:
User provides CID + password
  → GET /download/:hash                 (Express proxy)
  → hash_registry.json lookup           (find original filename)
  → Gateway waterfall: Pinata → dweb.link → local → ipfs.io
  → r.data.pipe(res)                    (stream to browser)
  → CryptoJS.AES.decrypt(ciphertext, key)
  → JSON.parse(decryptedString)         (recover name + type)
  → Base64 → Uint8Array → Blob          (binary reconstruction)
  → URL.createObjectURL(blob)           (in-memory browser URL)
  → <img>, <video>, or <iframe>         (in-browser preview)
```

---

## 5. Backend — `server.js`

**File:** `server.js` (177 lines)

### 5.1 Middleware & Configuration

```javascript
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());
const ipfs = create({ host: '127.0.0.1', port: '5001', protocol: 'http' });
```

- **`multer({ dest: 'uploads/' })`** — Configures multer to write uploaded files to the `uploads/` directory with auto-generated random filenames. The original filename is accessible via `req.file.originalname`.
- **`app.use(cors())`** — Enables all cross-origin requests. This is necessary because the React app runs on `localhost:3000` and calls the backend on `localhost:5002`. Without CORS headers, the browser would block these requests.
- **`ipfs.create()`** — Connects to the Kubo daemon's RPC API at port 5001 (not the gateway port 8080). This is used **only** for the `ipfs.ls()` call during legacy hash resolution.

### 5.2 Hash Registry

```javascript
const DB_PATH = path.join(__dirname, 'hash_registry.json');

const loadRegistry = () => {
  try {
    return fs.existsSync(DB_PATH)
      ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
      : {};
  } catch (e) { return {}; }
};

const saveRegistry = (data) => {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
  catch (e) {}
};
```

`hash_registry.json` is a flat JSON file mapping CID → original filename, for example:
```json
{
  "QmAbcDef...": "photo.jpg.encrypted",
  "QmXyzWvu...": "document.pdf"
}
```

**Why is this necessary?**  
IPFS only stores content — it has no concept of filenames. When a file is retrieved later, the server needs to know what name to set in the `Content-Disposition` header so browsers prompt downloads with the correct filename and extension. The registry provides an instant O(1) lookup without any network calls.

### 5.3 LAN IP Detection (`/ip`)

```javascript
app.get('/ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!iface.address.startsWith('169.254.')) {
          return res.json({ ip: iface.address });
        }
      }
    }
  }
  res.json({ ip: 'localhost' });
});
```

`os.networkInterfaces()` returns all network adapters: Ethernet, Wi-Fi, loopback, virtual adapters. This code:
1. Filters out loopback (`iface.internal === true` — excludes `127.0.0.1`).
2. Filters out APIPA link-local addresses (`169.254.x.x`) — these indicate a network adapter that is connected but has no DHCP assignment (e.g., an Ethernet cable plugged in but not connected to a router). Including these would give a useless QR code.
3. Returns the **first** valid IPv4 LAN address found.

The React frontend calls this endpoint on mount in `Gallery.js` and uses the returned IP to construct QR codes pointing to `http://<LAN_IP>:5002/download/<hash>`.

### 5.4 Upload Route (`POST /upload`)

```javascript
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
      filename: file.originalname
    });
    formData.append('pinataMetadata', JSON.stringify({ name: file.originalname }));
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 0,
      wrapWithDirectory: false
    }));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.PINATA_JWT}`
        }
      }
    );

    const hash = response.data.IpfsHash;
    const db = loadRegistry();
    db[hash] = file.originalname;
    saveRegistry(db);

    fs.unlinkSync(file.path);
    res.json({ hash });
  } catch (error) {
    try { fs.unlinkSync(file.path); } catch (e) {}
    res.status(500).json({ error: 'Upload failed.' });
  }
});
```

**Step-by-step:**
1. `multer` intercepts the POST and writes the file to `uploads/<random-name>`. `req.file` contains `path` (temp path) and `originalname` (what the browser sent).
2. A new `FormData` is constructed for the Pinata API — importantly, the file is streamed from disk (`fs.createReadStream`) rather than loaded into RAM, which is critical for large file uploads.
3. `pinataOptions: { wrapWithDirectory: false }` causes Pinata to return a **direct CID** for the file itself, not a directory wrapper CID. This simplifies download URL construction.
4. `maxBodyLength: 'Infinity'` disables axios's default request size limit so large files are not rejected.
5. The JWT is read from `.env` via `process.env.PINATA_JWT` and placed in the `Authorization` header — never visible to the client.
6. On success: the CID is written to `hash_registry.json` and the temp file is deleted with `fs.unlinkSync`. The CID is returned to the browser as `{ hash }`.
7. On failure: the temp file is still deleted (cleanup in the catch block) and a 500 error is returned.

### 5.5 Download Route (`GET /download/:hash`)

The download route implements a **3-step fallback filename resolution** system:

**Step 1 — Local Registry (instant):**
```javascript
const db = loadRegistry();
if (db[hash]) filename = db[hash];
```
For any file uploaded through this app, the filename is found immediately.

**Step 2 — IPFS `ls` (for legacy directory-wrapped files):**
```javascript
for await (const file of ipfs.ls(hash, { timeout: 2000 })) {
  if (file.type !== 'dir' && file.name) {
    filename = file.name;
    targetPath = `${hash}/${filename}`;
    break;
  }
}
```
Older versions of the app used `wrapWithDirectory: true`, which wraps files in a directory CID. The `ipfs.ls()` call lists the directory contents to extract the contained filename. A 2-second timeout prevents blocking the response if the daemon is offline.

**Step 3 — Pinata Metadata API:**
```javascript
const pinRes = await axios.get(
  `https://api.pinata.cloud/data/pinList?hashContains=${hash}&status=pinned`,
  { headers: { 'Authorization': `Bearer ${process.env.PINATA_JWT}` }, timeout: 3000 }
);
const row = pinRes.data?.rows?.[0];
if (row?.metadata?.name) filename = row.metadata.name;
```
Queries Pinata's pin list API to find whether this CID was uploaded with a `name` metadata field. This covers cases where the local `hash_registry.json` was cleared or the file was uploaded on a different machine.

**Last resort:** If all three steps fail, the filename defaults to `<hash>.enc` — a clearly marked unknown encrypted blob.

### 5.6 Gateway Waterfall Strategy

```javascript
const isKnownPinataFile = !!db[hash];
const gateways = isKnownPinataFile
  ? [pinataGateway, 'https://dweb.link', 'http://127.0.0.1:8080', 'https://ipfs.io']
  : ['http://127.0.0.1:8080', pinataGateway, 'https://dweb.link', 'https://ipfs.io'];

for (const gateway of gateways) {
  try {
    const r = await axios.get(`${gateway}/ipfs/${targetPath}`, {
      responseType: 'stream',
      timeout: 15000
    });
    r.data.pipe(res);
    succeeded = true;
    break;
  } catch (err) {
    console.log(`[skip] ${gateway}: ${err.message}`);
  }
}
```

**Why a waterfall and not parallel requests?**  
Sending parallel requests to all gateways simultaneously would work, but wastes bandwidth and API rate limits. The waterfall prioritizes the most likely source and only falls back if it fails (timeout or 4xx/5xx).

- **`responseType: 'stream'`** — Critical for large files. Without this, axios would buffer the entire file in Node.js memory before sending it to the client, causing memory issues and slower first-byte times. With streaming, data pipes directly from the gateway to the React client.
- **`Content-Disposition`** — Set to `inline` for view requests (browser renders the file) or `attachment` for downloads (browser prompts Save-As). The filename is URI-encoded to support non-ASCII characters.
- **`Cache-Control: public, max-age=3600`** — Caches the file in the browser for 1 hour, making repeated views of the same gallery image near-instant.

---

## 6. Frontend — Core Components

### 6.1 `App.js` — Session Gate & Routing

**File:** `src/App.js`

```javascript
const [isUnlocked, setIsUnlocked] = React.useState(
  sessionStorage.getItem('unlocked') === 'true'
);

if (!isUnlocked) {
  return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
}
```

**Session vs LocalStorage distinction:**
- `sessionStorage` — scoped to the current browser **tab**. Cleared when the tab is closed or the browser is restarted. Used for the "unlocked" flag so the PIN is required after every session.
- `localStorage` — persists across browser restarts. Used for upload history, vault items, folders, and the PIN itself.

This is a **render gate** pattern — not URL-based redirection. Before `<Router>` is mounted, the component checks `isUnlocked`. If `false`, `<LockScreen>` is rendered instead. This means URL manipulation (`localhost:3000/vault`) will not bypass the PIN because the component tree including the `<Router>` itself is not rendered until `isUnlocked` becomes `true`.

---

### 6.2 `LockScreen.js` — PIN Authentication

**File:** `src/components/LockScreen.js`

```javascript
const getStoredPin = () => localStorage.getItem('app_pin') || '1234';

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

The `useEffect` dependency array includes `[pin, onUnlock]`, meaning it re-runs every time a digit is pressed. When 4 digits have been entered, comparison is automatic — no "Confirm" button needed.

**On incorrect PIN:**
- `setError(true)` triggers the CSS class `shake` via `className={lock-container ${error ? 'shake' : ''}}`.
- The shake animation is a pure CSS `@keyframes` transform oscillating the X translation.
- After 500ms, both the PIN and error state are reset, allowing another attempt with no rate limiting (by design for a local app).

**PIN change flow (in `Gallery.js`):**
```javascript
if (!/^\d{4}$/.test(pinNewInput)) {
  setPinMessage({ type: 'error', text: 'New PIN must be exactly 4 digits.' });
  return;
}
localStorage.setItem('app_pin', pinNewInput);
```
The regex `^\d{4}$` is anchored at both ends — it requires **exactly** 4 numeric digits, no more, no less.

---

### 6.3 `Upload.js` — Encryption & Upload Pipeline

**File:** `src/pages/Upload.js`

#### Stage 1: File Selection
```javascript
const handleDrop = (e) => {
  e.preventDefault();
  setIsDragging(false);
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    setSelectedFile(e.dataTransfer.files[0]);
  }
};
```
`e.preventDefault()` is mandatory — without it, the browser navigates to the dropped file's path. `e.dataTransfer.files[0]` is a native `File` object from the browser's File API, containing `name`, `size`, `type`, and the raw binary data.

#### Stage 2: Encryption Pipeline (when password provided)
```javascript
// Step A: Binary → Base64 DataURL
const fileDataUrl = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(selectedFile);
});

// Step B: Wrap with metadata
const payload = JSON.stringify({
  name: selectedFile.name,
  type: selectedFile.type,
  data: fileDataUrl
});

// Step C: AES-256 encrypt
const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });

// Step D: Package as File
fileToUpload = new File(
  [encryptedBlob],
  selectedFile.name + '.encrypted',
  { type: 'text/plain' }
);
```

**Why JSON wrapping?** Without embedding `name` and `type` in the ciphertext, decryption would reveal only raw base64 with no way to know the original format. Embedding them inside the encrypted JSON payload means the decrypting party recovers everything needed to reconstruct the file — even the original filename and MIME type — as long as they have the correct password.

#### Stage 3: XHR Upload with Progress
```javascript
const xhr = new XMLHttpRequest();

xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) {
    const startPct = encryptionKey ? 5 : 0;
    const uploadPct = startPct + ((e.loaded / e.total) * (15 - startPct));
    setUploadProgress(uploadPct);
  }
};
```

**`fetch` vs XHR:** `fetch()` and `axios` **do not** expose upload byte progress in a standard way. `XMLHttpRequest.upload.onprogress` is the only reliable mechanism for upload progress events (`e.loaded`, `e.total`). The percentage is mapped to 0%–15% — a narrow slice — because 85% of the perceived wait time is the subsequent IPFS pinning, not the local file transfer.

#### Stage 4: Performance Metric Recording
```javascript
xhr.upload.onload = () => {
  const t1 = performance.now();
  const totalUploadMs = Math.round(t1 - t0);
  const metrics = JSON.parse(localStorage.getItem('perf_metrics') || '[]');
  metrics.push({
    sizeBytes: originalSize,    // original file size, not encrypted blob size
    timeMs: totalUploadMs,      // ms from t0 (start) to bytes received by server
    isEncrypted: !!encryptionKey,
    date: new Date().toISOString()
  });
  if (metrics.length > 50) metrics.shift(); // rolling window of 50
  localStorage.setItem('perf_metrics', JSON.stringify(metrics));
};
```

One metric per upload. `t0` is initialized at the start of `handleUpload`, capturing the full wall-clock time including encryption overhead. `!!encryptionKey` converts the password string to a boolean for clean storage. `metrics.shift()` removes the oldest entry when the cap of 50 is reached (FIFO rolling window).

#### Stage 5: IPFS Pinning Animation
```javascript
setUploadStage('Pinning to IPFS Network…');
let pct = 15;
pinningTimer = setInterval(() => {
  pct += 0.5;
  if (pct <= 98) setUploadProgress(pct);
  else if (pct === 98.5) {
    setUploadStage('Pinning to IPFS Network… (Larger files can take several minutes)');
  }
}, 50);
```
Incrementing 0.5% every 50ms reaches 98% in approximately 8.3 seconds. The 98% cap is intentional — the bar never reaches 100% until the server responds with the CID. This prevents the false impression that the upload is "done" while Pinata is still processing.

---

### 6.4 `Home.js` — Analytics Dashboard

**File:** `src/pages/Home.js`

#### Statistics with Backward Compatibility
```javascript
const encryptedCount = uploads.filter(
  f => f.isEncrypted || f.name.endsWith('.encrypted')
).length;
```
Supports two identification methods:
- **Modern records**: `isEncrypted: true` boolean flag added explicitly.
- **Legacy records**: filename ending in `.encrypted` (before the flag was introduced). The `||` short-circuits so if the flag is found, the filename check is skipped.

#### Cryptographic Ratio Bar
```javascript
<div style={{ width: `${encryptedPercent}%`, background: 'var(--primary-cyan)' }} />
<div style={{ width: `${plainPercent}%`, background: 'var(--primary-purple)' }} />
```
Two `<div>` elements inside a `display: flex; overflow: hidden` row container. Their widths are dynamic percentages that always sum to 100% (since `encryptedPercent + plainPercent = 100`). CSS `transition: width 1s ease` animates the bar on first render.

#### Performance Profiling Graph
```javascript
const recentMetrics = perfMetrics.slice(-20);    // show last 20 only
const maxTime = Math.max(...recentMetrics.map(x => x.timeMs));

// Per bar:
const heightPct = maxTime === 0 ? 5 : (m.timeMs / maxTime) * 100;
const barColor   = m.isEncrypted ? 'var(--primary-cyan)' : 'var(--primary-purple)';

// Tooltip (hover):
title={`Type: ${typeLabel}\nSize: ${sizeMb} MB\nTime: ${(m.timeMs / 1000).toFixed(2)} s`}
```
- `Math.max(...array.map())` — spread operator converts the array into individual arguments for `Math.max`. The tallest bar gets `heightPct = 100%`; all others are proportional.
- `minHeight: '4px'` ensures even 0ms entries (extremely fast uploads) remain visible.
- Time displayed as seconds (`÷ 1000`) with 2 decimal places for user readability.

#### Reset Graph Modal
```javascript
const [showResetConfirm, setShowResetConfirm] = useState(false);

// On confirm:
localStorage.removeItem('perf_metrics');
setPerfMetrics([]);
setShowResetConfirm(false);
```
Three operations happen synchronously: the key is removed from persistent storage, the React state is cleared (causing an immediate re-render to empty state), and the modal is dismissed. No page reload needed.

---

### 6.5 `Gallery.js` — Virtual File System & Decryption Engine

**File:** `src/pages/Gallery.js` (888 lines)

#### Virtual File System
```javascript
const visibleFolders = currentFolder === null ? folders : [];
const visibleFiles   = uploads.filter(u =>
  currentFolder === null ? !u.folderId : u.folderId === currentFolder
);
```
IPFS doesn't support directories. All folder/file organization is a UI abstraction stored in `localStorage`:
- **Root view** (`currentFolder === null`): show all folders + files with no `folderId`.
- **Folder view** (`currentFolder = 'some-id'`): show only files with matching `folderId`. Folders are hidden (flat, non-nested structure).

#### HTML5 Drag-and-Drop Organization
```javascript
// On file card drag start:
e.dataTransfer.setData('fileHash', file.hash);

// On folder drop zone:
const draggedHash = e.dataTransfer.getData('fileHash');
const updated = uploads.map(u =>
  u.hash === draggedHash ? { ...u, folderId: folder.id } : u
);
saveUploads(updated); // updates state + localStorage atomically
```
`dataTransfer` is temporary storage that lives for the duration of the drag operation. The file hash is the minimal data needed to identify which upload record to update. No network calls occur — this is a pure `localStorage` mutation, making it instant.

#### Decryption Engine (4-Step Process)

**Step 1 — Fetch Ciphertext:**
```javascript
const response = await fetch(`${apiBase}/download/${selectedItem.hash}`);
const encryptedContent = await response.text();
```
The fetch goes to the Express backend proxy, not directly to an IPFS gateway. Direct browser-to-IPFS-gateway requests would fail with CORS errors. The backend serves with `Access-Control-Allow-Origin: *` explicitly set.

**Step 2 — AES Decryption:**
```javascript
const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

if (!decryptedString) {
  setStatus('Wrong password. Please try again.');
  return;
}
```
If the password is wrong, `CryptoJS.AES.decrypt()` does not throw an exception. Instead, it returns a `WordArray` that, when converted to UTF-8, produces an empty string or garbled bytes. The empty-string check is the password validation mechanism.

**Step 3 — Payload Unwrapping:**
```javascript
const payload = JSON.parse(decryptedString);
finalDataUrl  = payload.data;
finalFilename = payload.name || finalFilename;
finalMime     = payload.type || finalMime;
```
Recovers the original filename, MIME type, and file data from the JSON wrapper created during encryption. The `try/catch` wrapping this block handles legacy files (pre-JSON-wrapping) by falling through to the raw base64 string.

**Step 4 — Binary Reconstruction:**
```javascript
const arr   = finalDataUrl.split(',');
const bstr  = atob(arr[1]);                     // Base64 → binary string
const u8arr = new Uint8Array(bstr.length);
for (let n = bstr.length - 1; n >= 0; n--) {
  u8arr[n] = bstr.charCodeAt(n);               // binary string → byte array
}
const blob = new Blob([u8arr], { type: mime }); // byte array → Blob
const url  = window.URL.createObjectURL(blob);  // Blob → temporary browser URL
```
`atob()` decodes a Base64 string to a binary string (each character's char code is one byte). The `while` loop transfers each character's code point into a `Uint8Array` — a typed array where each slot is exactly 1 byte (0–255). The `Blob` constructor accepts typed arrays, and `createObjectURL` returns a short-lived `blob:http://...` URL that the browser can render natively.

```javascript
// Memory cleanup on preview close:
if (previewUrl && previewUrl.startsWith('blob:')) {
  window.URL.revokeObjectURL(previewUrl);
}
```
`revokeObjectURL` frees the memory. Without this call, every viewed file would leave a memory allocation until the tab is closed.

---

### 6.6 `RetrieveFile.js` — Hash-Based Retrieval

**File:** `src/pages/RetrieveFile.js`

#### Plain File Direct Redirect
```javascript
if (!decryptionKey) {
  window.location.href = `${apiBase}/download/${hash}`;
  return;
}
```
For unencrypted files a browser redirect is far more reliable than an XHR blob fetch. IPFS gateways often don't include `Content-Length` headers, which causes the blob approach to terminate prematurely. A redirect lets the browser handle the download natively using its own streaming infrastructure.

#### Ticker-Based Progress Simulation
```javascript
let fetchPct = 5;
const fetchTicker = setInterval(() => {
  fetchPct = Math.min(fetchPct + 0.8, 65);
  setRetrieveProgress(fetchPct);
}, 300);
```
IPFS gateways rarely provide real-time byte progress. The ticker provides a visual impression of activity. If the XHR **does** provide real progress (via `xhr.onprogress`), the real byte percentage overrides the simulated one:
```javascript
xhr.onprogress = (e) => {
  if (e.lengthComputable) {
    fetchPct = (e.loaded / e.total) * 65; // real override
    setRetrieveProgress(fetchPct);
  }
};
```

#### Synchronous Decrypt UI Workaround
```javascript
let decryptPct = 70;
const decryptTimer = setInterval(() => {
  decryptPct += 3;
  setRetrieveProgress(Math.min(decryptPct, 92));
}, 40);

const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey); // SYNCHRONOUS
clearInterval(decryptTimer);
```
`CryptoJS.AES.decrypt()` is **synchronous** and blocks the JavaScript thread. React's state updates (`setRetrieveProgress`) are batched and only rendered after the call stack is free. The `setInterval` queues multiple pending state updates **before** the decrypt starts. After `decrypt()` returns and the stack clears, React flushes all queued updates in one render, creating the visual illusion of an animated progress bar during decryption.

---

### 6.7 `Vault.js` — Secure Hash Vault

**File:** `src/pages/Vault.js`

The Vault is a **decentralized password manager** — it stores IPFS CIDs paired with file metadata so users can re-access their encrypted files without searching upload history.

#### Export
```javascript
const handleExport = () => {
  const dataStr = "data:text/json;charset=utf-8,"
    + encodeURIComponent(JSON.stringify(vaultItems));
  const a = document.createElement('a');
  a.setAttribute("href", dataStr);
  a.setAttribute("download", "ipfs-vault-backup.json");
  document.body.appendChild(a);
  a.click();
  a.remove();
};
```
Creates a JSON DataURL from the vault array and triggers a programmatic download without any server call. The entire vault is serialized client-side and saved as `ipfs-vault-backup.json`.

#### Import with Deduplication
```javascript
const fileReader = new FileReader();
fileReader.readAsText(file, "UTF-8");
fileReader.onload = e => {
  const importedItems = JSON.parse(e.target.result);
  const currentHashes = new Set(vaultItems.map(i => i.hash));
  const newItems = importedItems.filter(i => !currentHashes.has(i.hash));
  const updatedVault = [...vaultItems, ...newItems];
  setVaultItems(updatedVault);
  localStorage.setItem('vault_items', JSON.stringify(updatedVault));
};
```
Uses a `Set` for O(1) hash lookup during deduplication. Only items with a CID not already present in the vault are merged. This makes import safe to run multiple times with the same backup file.

The decryption flow in `Vault.js` is identical to `Gallery.js` — the same 4-step process: Fetch → Decrypt → JSON.parse → DataURL→Blob→ObjectURL.

---

## 7. Security Model

| Threat | Mitigation |
|---|---|
| **Server-side data breach** | Files are encrypted *before* leaving the browser. The server only ever receives ciphertext. |
| **IPFS network snooping** | All IPFS-visible data is AES-256-CBC ciphertext. Without the password, the content is mathematically unreadable. |
| **Unauthorized physical access** | Session PIN lock screen intercepts all routes. Re-PIN required on every new session. |
| **Wrong password silent failure** | Empty-string check on `decryptedBytes.toString(CryptoJS.enc.Utf8)` detects wrong passwords without throwing exceptions. |
| **Lost password** | By design, there is no recovery mechanism. The decryption key never leaves the user's RAM. Forgotten passwords = permanently inaccessible data. |
| **Browser storage exposure** | `localStorage` stores only CIDs, filenames, and dates — never encryption passwords. |
| **API key exposure** | `PINATA_JWT` is stored in `.env` on the server. It is never sent to or visible by the browser. |

---

## 8. localStorage Data Schema

All application state is persisted in the browser's `localStorage` under the following keys:

| Key | Type | Contents |
|---|---|---|
| `recentUploads` | `Array<Object>` | `{ hash, name, date, isEncrypted, folderId, size }` |
| `folders` | `Array<Object>` | `{ id, name, createdAt }` |
| `vault_items` | `Array<Object>` | `{ hash, name, date, isEncrypted, addedToVaultAt }` |
| `perf_metrics` | `Array<Object>` | `{ sizeBytes, timeMs, isEncrypted, date }` |
| `app_pin` | `String` | 4-digit PIN (default: `'1234'`) |
| `unlocked` | — | Stored in **`sessionStorage`**, not localStorage. Value: `'true'` |

---

## 9. Recent Bug Fixes & Improvements

### 9.1 Duplicate Performance Metric Fix

**Problem:** When uploading an encrypted file, the app pushed two metric entries to `perf_metrics` per upload: one for the AES encryption step (without `isEncrypted` flag) and one for total upload time. The graph showed two bars — one purple (plain), one cyan (encrypted) — for a single file.

**Root Cause:** An intermediate `localStorage.setItem('perf_metrics', ...)` call inside the encryption block, before the XHR started.

**Fix:** Removed the intermediate write. The single metric push in `xhr.upload.onload` captures total time (encryption + upload) with the correct `isEncrypted: !!encryptionKey` flag.

### 9.2 Reset Graph — Custom UI Modal

**Before:** `window.confirm()` — a blocking, un-styleable native browser dialog.

**After:** A fully custom React modal overlay:
- `position: fixed` full-screen backdrop with `backdropFilter: blur(5px)`
- `background: #111114` card with `border: 1px solid rgba(255,77,77,0.3)`
- Two buttons: `Cancel` and `Yes, Reset` with hover glow effects
- Controlled entirely by `showResetConfirm` boolean state — no blocking calls

### 9.3 Time Unit Display

**Before:** Tooltip showed `Time: 1250 ms`

**After:** `Time: ${(m.timeMs / 1000).toFixed(2)} s` → `Time: 1.25 s`

### 9.4 Empty State Text

**Before:** `"Upload encrypted files to generate performance data."`

**After:** `"Upload files to generate performance data."` — correctly reflects that both encrypted and plain-text uploads are tracked.

---

## 10. Advantages & Limitations

### Advantages
1. **Zero-Knowledge Privacy** — Encryption occurs entirely in the browser. The server, ISP, and IPFS network operators cannot read user files.
2. **Censorship Resistance** — Data distributed over IPFS P2P network cannot be unilaterally deleted by a single corporate entity.
3. **Data Immutability** — A CID is a SHA-256 hash of content. The retrieved file is mathematically guaranteed to be identical to the uploaded file.
4. **No Recurring Cost** — Local IPFS node is free. Pinata offers a free tier sufficient for most academic/personal use.
5. **Cross-Platform** — PWA installable on Windows, macOS, Linux, Android, iOS.

### Limitations
1. **No Password Recovery** — Lost encryption password = lost data. By design.
2. **localStorage Dependency** — Upload history, folders, and vault are tied to a specific browser on a specific device. Clearing browser data wipes the Virtual File System (though IPFS-pinned content remains accessible via CID).
3. **Pinata API Dependency** — Upload and retrieval now depend on Pinata's availability and the validity of the JWT token. If Pinata is down, uploads fail.
4. **Synchronous Encryption** — `CryptoJS.AES.encrypt` blocks the browser's main JavaScript thread for very large files (>100MB), causing a brief UI freeze.

---

## 11. Future Scope

| Enhancement | Description |
|---|---|
| **Blockchain Vault** | Replace `localStorage` vault with an Ethereum or Polygon smart contract for multi-device sync without a central database |
| **IPNS** | Use InterPlanetary Name System to provide a static URL pointing to the latest version of a mutable file |
| **Web Workers** | Move `CryptoJS` encryption/decryption to a Web Worker thread to prevent main-thread blocking |
| **File Sharding** | Split large files into multiple encrypted shards across different IPFS nodes for redundancy |
| **End-to-End Sharing** | Generate a shareable URL that includes a hash-fragment-encoded key (`#key=...`) so recipients can decrypt without a backend |

---

## 12. Conclusion

The IPFS Secure Storage Application demonstrates a successful paradigm shift from centralized cloud storage to decentralized, cryptographically private file management. By abstracting the IPFS daemon's CLI complexity behind a polished React interface, the project makes Web3 technologies accessible to everyday users.

The combination of:
- **Client-side AES-256 encryption** (zero-knowledge guarantee)
- **Dual-layer pinning** (Pinata remote + local node)
- **Virtual File System** (folders + gallery without IPFS directories)
- **Gateway waterfall retrieval** (resilient download from multiple gateways)
- **Progressive Web App architecture** (cross-platform, installable)

...fulfills all objectives: privacy, immutability, usability, decentralization, and accessibility. The project definitively proves that the security and resilience of Web3 architectures can be achieved without sacrificing the intuitive user experience expected from modern Web2 applications.

---

*Documentation last updated: 2026-03-23 | Version 1.1*
