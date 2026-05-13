# 📘 Deep Learning Guide — Part 1 (Chapters 1–5)

---

## Chapter 1: What Is This App? (Full Detail)

### The Problem It Solves
Traditional cloud storage (Google Drive, Dropbox) has three big problems:
1. **Centralization** — Your files live on one company's servers. If they go down or delete your account, files are gone.
2. **Privacy** — The company can read your files.
3. **Single point of failure** — One server, one attack surface.

Your app solves all three using **IPFS + AES encryption**.

### What the App Does — Step by Step

**When you first open it:**
- A PIN keypad appears (default PIN: `1234`)
- You type 4 digits → app checks them → if correct, you enter the main app
- This is the `LockScreen` component in action

**Once inside, you have 5 pages:**

| Page | Route | What You Can Do |
|---|---|---|
| Home | `/` | See stats, charts, quick access buttons |
| Upload | `/upload` | Upload any file, optionally encrypt it |
| Gallery | `/gallery` | Browse, preview, manage your uploaded files |
| Retrieve | `/retrieve` | Download any file using its IPFS hash |
| Secure Vault | `/vault` | Manage your encrypted files |

**The upload journey (plain English):**
1. You pick a file (drag & drop or click to browse)
2. Optionally type an encryption password
3. Click **UPLOAD NOW**
4. If you gave a password → the file is scrambled (encrypted) in your browser
5. The scrambled file is sent to your backend server (`server.js`)
6. Your server forwards it to **Pinata** (a cloud IPFS service)
7. Pinata stores it on IPFS and returns a unique **hash** (like `QmXyz...`)
8. The hash is shown to you + stored in your browser's localStorage
9. You can share the hash with anyone — they use **Retrieve** to download it

---

## Chapter 2: What Is IPFS? (Full Detail)

### How Normal Web Works
```
You → Request file → Google's Server → Sends file back to You
```
The server is identified by its **location** (e.g., `drive.google.com`). This is called **location-addressed storage**.

Problem: If the server moves, goes offline, or blocks you — file is unreachable.

### How IPFS Works
```
You → Request content by its HASH → Any node that has it → Sends file to You
```
Files are identified by their **content** (a cryptographic hash of the data). This is called **content-addressed storage**.

### The Hash / CID Explained
When you upload `photo.jpg` (100KB) to IPFS:
1. IPFS runs a **SHA2-256 hash function** on the file's bytes
2. This produces a unique fingerprint, e.g.: `QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68`
3. This is your file's **CID** (Content Identifier)

**Key properties:**
- Same file → always same CID (deterministic)
- Change even 1 byte → completely different CID
- CID proves the file hasn't been tampered with

### Why "Pinning" Matters
IPFS nodes automatically **garbage collect** files they haven't used recently. To keep your file permanently available, you must **pin** it — tell a node "keep this forever."

**Pinata** is a pinning service — you upload to them, they keep it pinned on their IPFS nodes, and serve it fast via their CDN.

### Local IPFS Node (Kubo)
Your project also runs a **local IPFS node** (`kubo/` folder). This is the actual IPFS daemon. It:
- Gives you a local gateway at `http://127.0.0.1:8080`
- Can resolve any IPFS hash to its content
- Caches files locally for fast repeat access

```
Your App
   │
   ├─► Pinata (cloud) ─► IPFS Network (global)
   │
   └─► Local Kubo Node ─► http://127.0.0.1:8080 (local gateway)
```

---

## Chapter 3: Project Architecture (Full Detail)

### The Three-Layer Stack

```
┌─────────────────────────────────────────────────────┐
│              LAYER 1: FRONTEND (React)               │
│                  localhost:3000                       │
│  What the user sees and interacts with in browser    │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP requests (axios/fetch)
┌──────────────────────▼──────────────────────────────┐
│              LAYER 2: BACKEND (Express)              │
│                  localhost:5000                       │
│  Handles file upload, talks to Pinata, serves files  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS API calls
┌──────────────────────▼──────────────────────────────┐
│            LAYER 3: IPFS / Pinata                    │
│         api.pinata.cloud / gateway.pinata.cloud       │
│     Decentralized storage — files live here forever  │
└─────────────────────────────────────────────────────┘
```

### Why Three Layers?

**Why not upload directly from browser to Pinata?**
- Your Pinata API secret key would be exposed in browser code (anyone could steal it)
- The backend acts as a **secure proxy** — it holds the secret key safely in `.env`

**Why not serve files directly from Pinata to browser?**
- CORS restrictions on some gateways
- Need smart fallback logic (try Pinata → try local → try public gateways)
- The backend adds the right HTTP headers for downloads

### The `.env` File — Secrets Manager
```
PINATA_JWT=eyJhbGci...  ← Your Pinata API key (never commit this to git)
PINATA_GATEWAY=https://... ← Your dedicated Pinata gateway URL
```
`dotenv` loads these into `process.env` at runtime. The `.gitignore` file excludes `.env` from version control so secrets stay private.

### `hash_registry.json` — The Local Database
```json
{
  "QmXyz123": "photo.jpg",
  "QmAbc456": "document.pdf"
}
```
This is a simple JSON file that maps every IPFS hash → original filename. Without this, when you download a file by hash, you'd have no idea what to name it.

### `localStorage` — The Browser's Memory
The frontend stores data in the browser's `localStorage`:
- `recentUploads` → array of all your upload records
- `vault_items` → your secure vault entries
- `folders` → folder structure
- `perf_metrics` → upload performance data
- `app_pin` → your PIN (default: `1234`)

This is why your upload history disappears if you clear browser data — it's stored locally, not on a server.

---

## Chapter 4: Technologies Used (Full Detail)

### React
**What it is:** A JavaScript library for building User Interfaces, made by Meta/Facebook.

**The core idea:** Instead of manipulating HTML directly (like old jQuery), you describe *what* the UI should look like based on **state**, and React figures out *how* to update the DOM efficiently.

```javascript
// Old way (jQuery):
$('#counter').text(count + 1);

// React way:
const [count, setCount] = useState(0);
// Just update state — React re-renders automatically
setCount(count + 1);
```

**Used in this project for:** Every single page and component you see in the browser.

---

### React Router (react-router-dom)
**What it is:** Gives React apps URL-based navigation without full page reloads.

```javascript
// From App.js — maps URLs to components:
<Route path="/upload"   element={<Upload />} />
<Route path="/gallery"  element={<Gallery />} />
<Route path="/vault"    element={<Vault />} />
```

**`useLocation()` hook** (used in Navbar.js):
```javascript
const location = useLocation();
// location.pathname === '/upload' → true when on upload page
const isActive = (path) => location.pathname === path ? 'active' : '';
```
This is how the Navbar knows which link to highlight.

---

### Node.js + Express
**What it is:** Node.js lets JavaScript run *outside* the browser (on a server). Express is a minimal web framework that makes it easy to define API routes.

```javascript
// Express route pattern:
app.METHOD('/path', (req, res) => {
  // req = incoming request data
  // res = send something back to the client
});

// Example from server.js:
app.get('/ip', (req, res) => {
  // finds network IP...
  res.json({ ip: '192.168.1.5' });
});
```

**Used in this project for:** `server.js` — the backend that handles uploads, downloads, and IP detection.

---

### Axios
**What it is:** A popular HTTP client for making requests from JavaScript (works in both Node.js and browser).

```javascript
// From server.js — sending file to Pinata:
const response = await axios.post(
  'https://api.pinata.cloud/pinning/pinFileToIPFS',
  formData,
  { headers: { 'Authorization': `Bearer ${process.env.PINATA_JWT}` } }
);
const hash = response.data.IpfsHash; // ← Pinata returns the CID
```

**vs `fetch`:** Axios automatically parses JSON, handles errors better, and supports `maxBodyLength: 'Infinity'` for large file uploads.

---

### Multer
**What it is:** Middleware for Express that handles `multipart/form-data` — the format browsers use to send files.

```javascript
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  // req.file now has: path, originalname, size, mimetype
  // file was auto-saved to uploads/some-random-name
});
```

Without Multer, you'd have to manually parse the raw binary stream — very complex.

---

### CryptoJS
**What it is:** A pure-JavaScript implementation of cryptographic algorithms including AES.

```javascript
// Encrypting (in Upload.js):
const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
// encrypted = "U2FsdGVkX1..." (base64-encoded ciphertext)

// Decrypting (in Vault.js / Gallery.js):
const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
```

**Runs entirely in the browser** — the plaintext file never leaves your device unencrypted.

---

### Pinata
**What it is:** A cloud service that pins files to IPFS and serves them via a fast CDN.

**Two APIs used:**
1. `POST /pinning/pinFileToIPFS` → upload a file, get a CID back
2. `GET /data/pinList?hashContains=...` → look up metadata for an old upload

**Why use Pinata instead of just local IPFS?**
- Your local IPFS node can't guarantee files are available 24/7
- Pinata has global CDN nodes → fast downloads anywhere in the world

---

### qrcode.react
**What it is:** A React component that renders QR codes as SVG.

```javascript
// From Navbar.js:
<QRCodeSVG value={`http://192.168.1.5:3000`} size={200} />

// From Gallery.js (per-file QR):
<QRCodeSVG value={`http://192.168.1.5:5002/download/${qrHash}`} size={200} />
```

The QR code encodes your LAN URL so another device (phone) on the same Wi-Fi can scan it and open/download the file.

---

## Chapter 5: Security & Encryption (Full Detail)

### Why Encrypt Before Uploading?

IPFS is **public by default**. Anyone who knows a CID can download that file. To protect sensitive files, they must be encrypted *before* being put on IPFS.

Your app uses **AES (Advanced Encryption Standard)** — the same algorithm used by banks, governments, and the US military.

### The Encryption Process — Step by Step (from `Upload.js`)

**Step 1: Read the file as a Data URL**
```javascript
const fileDataUrl = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(selectedFile); // converts file to base64
});
// Result: "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
```
`FileReader` is a browser API that reads file contents as different formats. `readAsDataURL` converts it to a **base64 string** — a text representation of binary data.

**Step 2: Bundle metadata with the data**
```javascript
const payload = JSON.stringify({
  name: selectedFile.name,   // "photo.jpg"
  type: selectedFile.type,   // "image/jpeg"
  data: fileDataUrl          // "data:image/jpeg;base64,..."
});
```
The filename and type are encrypted *with* the data. This is how the app knows the original filename when decrypting later — it's baked into the encrypted blob.

**Step 3: AES Encrypt**
```javascript
const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
// encrypted = "U2FsdGVkX1+abc123..." (looks like random text)
```
`encryptionKey` = the password you typed. The AES algorithm uses this to scramble the data. Without the exact same password, the data cannot be recovered.

**Step 4: Wrap in a File object and upload**
```javascript
const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
fileToUpload = new File([encryptedBlob], selectedFile.name + '.encrypted', { type: 'text/plain' });
// filename: "photo.jpg.encrypted"
```

### The Decryption Process — Step by Step (from `Vault.js`)

**Step 1: Fetch the encrypted blob from IPFS**
```javascript
const response = await fetch(`${apiBase}/download/${selectedItem.hash}`);
const encryptedContent = await response.text();
// "U2FsdGVkX1+abc123..."
```

**Step 2: Validate it's actually encrypted**
```javascript
if (!encryptedContent.trim().startsWith('U2FsdGVkX1')) {
  setStatus('Error: Retrieved file is not a valid encrypted file');
  return;
}
```
All CryptoJS AES outputs start with `U2FsdGVkX1` — this is a sanity check.

**Step 3: Decrypt**
```javascript
const decryptedBytes = CryptoJS.AES.decrypt(encryptedContent, decryptionKey);
const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);

if (!decryptedString) {
  setStatus('Incorrect password. Please try again.');
  return;
}
```
If wrong password → `decryptedString` is empty or throws. 

**Step 4: Parse the JSON payload**
```javascript
const payload = JSON.parse(decryptedString);
// payload = { name: "photo.jpg", type: "image/jpeg", data: "data:image/jpeg;base64,..." }
const finalDataUrl = payload.data;
const finalFilename = payload.name;  // ← original name recovered!
```

**Step 5: Convert back to a real file (Base64 → Binary → Blob)**
```javascript
const arr = finalDataUrl.split(',');           // split "data:image/jpeg;base64," from actual data
const bstr = atob(arr[1]);                     // atob() = decode base64 → binary string
const u8arr = new Uint8Array(bstr.length);     // create byte array
for (let n = bstr.length; n--; ) {
  u8arr[n] = bstr.charCodeAt(n);              // fill byte array
}
const blob = new Blob([u8arr], { type: mime }); // create file blob
const url = window.URL.createObjectURL(blob);   // create downloadable URL
```
This is pure browser API — converting the base64 text back into a downloadable binary file.

### AES Key Facts
- **Symmetric encryption** — same key encrypts and decrypts (unlike HTTPS which uses asymmetric)
- **The key is NEVER stored** — not in `localStorage`, not in `server.js`, not in Pinata
- **Lost password = lost file** — there is no recovery mechanism (by design)
- AES-256 would take billions of years to crack with current computers

---

*Continue to Part 2 → Chapters 6–10 (File-by-file breakdown, data flows, React concepts)*
