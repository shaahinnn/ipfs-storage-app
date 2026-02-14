const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { create } = require('ipfs-http-client');
const cors = require('cors');

const app = express();
const port = 5000;

// IPFS client setup for local IPFS node
const ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

// Middleware for handling file uploads
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Route for uploading files to IPFS
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const data = fs.readFileSync(file.path);

    // Use wrapWithDirectory to preserve filename
    // We add an object with path and content
    const results = [];
    for await (const result of ipfs.addAll([{
      path: file.originalname,
      content: data
    }], { wrapWithDirectory: true })) {
      results.push(result);
    }

    // The last result is the directory wrapper
    const directory = results[results.length - 1];

    // Clean up uploaded file from temp storage
    fs.unlinkSync(file.path);

    res.json({ hash: directory.cid.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Route for downloading files from IPFS
app.get('/download/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    // Check if it's a directory to extract filename
    // If it's a directory, we list it to find the file inside
    let filename = hash;
    let targetPath = hash;

    try {
      // List content of the hash
      const files = [];
      for await (const file of ipfs.ls(hash)) {
        files.push(file);
      }

      if (files.length > 0) {
        // Assume the first file is the one we want (since we wrapped it)
        const file = files[0];
        filename = file.name;
        targetPath = `${hash}/${filename}`;
      }
    } catch (err) {
      // If ls fails, it might be a direct file or something else, proceed with hash
      console.log('Not a directory or error listing:', err.message);
    }

    const chunks = [];
    for await (const chunk of ipfs.cat(targetPath)) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // Set headers for download
    const disposition = req.query.type === 'view' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);

    // Attempt to set correct Content-Type based on extension for viewing
    if (req.query.type === 'view') {
      const ext = filename.split('.').pop().toLowerCase();
      const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'pdf': 'application/pdf'
      };
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      } else {
        res.setHeader('Content-Type', 'application/octet-stream');
      }
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
