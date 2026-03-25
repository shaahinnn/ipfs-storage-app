require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const os = require('os');
const { create } = require('ipfs-http-client');

const app = express();
const port = 5002;

const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// Local IPFS client for legacy directory resolution
const ipfs = create({ host: '127.0.0.1', port: '5001', protocol: 'http' });

// Persistent hash→filename registry — instantaneous extension lookup
const DB_PATH = path.join(__dirname, 'hash_registry.json');
const loadRegistry = () => {
  try { return fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) : {}; }
  catch (e) { return {}; }
};
const saveRegistry = (data) => {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); } catch (e) {}
};

// MIME type mapping
const getMimeType = (filename) => {
  if (!filename) return 'application/octet-stream';
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'gif': 'image/gif', 'webp': 'image/webp', 'mp4': 'video/mp4',
    'webm': 'video/webm', 'pdf': 'application/pdf', 'mp3': 'audio/mpeg',
    'wav': 'audio/wav', 'ogg': 'audio/ogg', 'mov': 'video/quicktime'
  };
  return map[ext] || 'application/octet-stream';
};

// Get LAN IP
app.get('/ip', (req, res) => {
  const interfaces = os.networkInterfaces();
  let bestIp = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Skip link-local APIPA addresses which indicate disconnected adapters
        if (!iface.address.startsWith('169.254.')) {
          return res.json({ ip: iface.address });
        }
      }
    }
  }
  res.json({ ip: bestIp });
});

// ── UPLOAD ──────────────────────────────────────────────────────────────────
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), { filename: file.originalname });
    formData.append('pinataMetadata', JSON.stringify({ name: file.originalname }));
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 0, wrapWithDirectory: false }));

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.PINATA_JWT}` }
    });

    const hash = response.data.IpfsHash;
    const db = loadRegistry();
    db[hash] = file.originalname;
    saveRegistry(db);

    fs.unlinkSync(file.path);
    res.json({ hash });
  } catch (error) {
    console.error('Upload Error:', error?.response?.data || error.message);
    try { fs.unlinkSync(file.path); } catch (e) {}
    res.status(500).json({ error: 'Upload failed. Check your Pinata credentials.' });
  }
});

// ── DOWNLOAD ─────────────────────────────────────────────────────────────────
app.get('/download/:hash', async (req, res) => {
  const { hash } = req.params;
  let filename = null;
  let targetPath = hash;

  // Step 1: Local registry (instant, most reliable for new uploads)
  const db = loadRegistry();
  if (db[hash]) {
    filename = db[hash];
  }

  // Step 2: Local IPFS daemon ls (instant for legacy directory-wrapped files)
  if (!filename || filename === hash) {
    try {
      for await (const file of ipfs.ls(hash, { timeout: 2000 })) {
        if (file.type !== 'dir' && file.name) {
          filename = file.name;
          targetPath = `${hash}/${filename}`;
          break;
        }
      }
    } catch (err) { /* not a directory or daemon unavailable */ }
  }

  // Step 3: Pinata metadata API (for older uploads not in local registry)
  if (!filename || filename === hash) {
    try {
      const pinRes = await axios.get(
        `https://api.pinata.cloud/data/pinList?hashContains=${hash}&status=pinned`,
        { headers: { 'Authorization': `Bearer ${process.env.PINATA_JWT}` }, timeout: 3000 }
      );
      const row = pinRes.data?.rows?.[0];
      if (row?.metadata?.name) filename = row.metadata.name;
    } catch (e) { /* ignore */ }
  }

  if (!filename || filename === hash) {
    filename = `${hash}.enc`; // fallback — clearly marks unknown encrypted blobs
  }

  // Step 4: Fetch content — smart gateway ordering based on where the file lives
  // If in local registry = uploaded to Pinata → go to Pinata first (skip local IPFS timeout)
  // Otherwise = likely a local legacy file → try local gateway first
  const isKnownPinataFile = !!db[hash];
  const gateways = isKnownPinataFile ? [
    process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',  // Pinata CDN: instant
    'https://dweb.link',                                            // Protocol Labs CDN
    'http://127.0.0.1:8080',                                        // local (may have it cached)
    'https://ipfs.io'                                               // final fallback
  ] : [
    'http://127.0.0.1:8080',                                        // local cache: instant for legacy files
    process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',  // Pinata
    'https://dweb.link',                                            // Protocol Labs CDN
    'https://ipfs.io'                                               // final fallback
  ];

  let succeeded = false;
  for (const gateway of gateways) {
    try {
      const r = await axios.get(`${gateway}/ipfs/${targetPath}`, {
        responseType: 'stream',
        timeout: 15000
      });

      const disposition = req.query.type === 'view' ? 'inline' : 'attachment';
      const safe = encodeURIComponent(filename);
      res.setHeader('Content-Disposition', `${disposition}; filename="${safe}"; filename*=UTF-8''${safe}`);
      res.setHeader('Content-Type', req.query.type === 'view' ? getMimeType(filename) : 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1hr in browser

      r.data.pipe(res);
      r.data.on('error', () => { if (!res.headersSent) res.end(); });
      succeeded = true;
      break;
    } catch (err) {
      console.log(`[skip] ${gateway}: ${err.message}`);
    }
  }

  if (!succeeded && !res.headersSent) {
    res.status(502).send('Unable to fetch file from any IPFS gateway. Try again later.');
  }
});

app.listen(port, '0.0.0.0', () => console.log(`✅ Backend ready on http://localhost:${port} and LAN`));
