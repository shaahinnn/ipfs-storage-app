# IPFS Storage App - 0th Review Presentation Guide

## 1. Project Overview
*   **Title**: Decentralized File Storage Application
*   **Objective**: To create a secure, censorship-resistant file storage system using the InterPlanetary File System (IPFS) that solves the "Single Point of Failure" problem of traditional cloud storage (like Google Drive/Dropbox).

## 2. Core Theoretical Concepts (The "Why")
*   **Decentralization**: Instead of one server holding your file, the file is split into chunks and stored across a network of nodes (computers).
*   **Content Addressing**:
    *   *Traditional Web*: Locations based. `drive.google.com/file1` (If the server moves the file, the link breaks).
    *   *Our Project*: Content based. `QmHash...` (The link IS the math of the file content. If the file content doesn't change, the link never changes).
*   **Immutability**: Once a file is uploaded, it cannot be edited. It can only be re-uploaded as a new version with a new hash.

## 3. Architecture Diagram
```mermaid
graph LR
    User[User / Browser] -- Uploads File --> React[Frontend (React)]
    React -- Sends File --> Express[Backend API (Node.js)]
    Express -- "ipfs.add()" --> IPFS[IPFS Daemon (Kubo / Go-IPFS)]
    IPFS -- Distributes Chunks --> Network[Global IPFS Network]
    
    subgraph "Retrieval"
    User -- Requests Hash --> React
    React -- Requests Stream --> Express
    Express -- "ipfs.cat(hash)" --> IPFS
    IPFS -- Finds Chunks --> Express
    end
```

## 4. Key Implementation Details (The "Code")

### A. The "Kubo" Node (Infrastructure)
We are using **Kubo** (formerly go-ipfs), which is the standard reference implementation of IPFS written in Go.
*   **Role**: It runs as a background process (`ipfs.exe daemon`) on your machine.
*   **Function**: It manages the "swarm" of connections to other peers and actually stores the file blocks on your hard drive.
*   **Interaction**: Our Node.js backend talks to Kubo via the HTTP API (port 5001).

### B. Uploading to IPFS (Frontend)
**File**: `src/pages/Upload.js`
**Concept**: The frontend uses `FormData` to send the file to our Node.js middleware. It also saves the transaction receipt (Hash + Filename) to the browser's `localStorage` so we can build the Gallery later.

```javascript
/* Critical Code Snippet: Frontend Upload Logic */
const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);

    // 1. Send to Backend
    const response = await axios.post('http://localhost:5000/upload', formData, ...);
    const newHash = response.data.hash;

    // 2. Save "Receipt" to Local History
    const newUpload = { hash: newHash, name: selectedFile.name, date: ... };
    const updatedUploads = [newUpload, ...recentUploads];
    localStorage.setItem('recentUploads', JSON.stringify(updatedUploads));
};
```

### C. Uploading to IPFS (Backend)
**File**: `server.js`
**Concept**: We don't just "add" the file. We "wrap" it in a directory. This is crucial because IPFS hashes alone don't store filenames (e.g., `my-resume.pdf`). By wrapping it, we preserve the metadata.

```javascript
/* Critical Code Snippet: Backend Upload */
app.post('/upload', upload.single('file'), async (req, res) => {
    // We stick the file inside a virtual 'directory' to keep its name
    const results = [];
    for await (const result of ipfs.addAll([{
      path: file.originalname,  // "resume.pdf"
      content: data             // Binary data
    }], { wrapWithDirectory: true })) { // <--- The magic part
      results.push(result);
    }
    // We return the DIRECTORY hash, not the file hash
    res.json({ hash: directory.cid.toString() });
});
```

### D. Smart Retrieval (Backend)
**File**: `server.js`
**Concept**: When the user asks for a Hash, we check: Is this a directory? If yes, look inside and find the file. This lets us serve the file with the correct name (`resume.pdf`) instead of a random string (`QmXYZ...`).

```javascript
/* Critical Code Snippet: Smart Download */
app.get('/download/:hash', async (req, res) => {
    // 1. Check if it's a directory
    // 2. Find the filename inside
    // 3. Stream the file content
    const disposition = req.query.type === 'view' ? 'inline' : 'attachment';
    
    // This tells the browser: "Save this as 'resume.pdf'"
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    res.send(buffer);
});
```

### E. Visual Gallery (Frontend)
**File**: `src/pages/Gallery.js`
**Concept**: This component reads the `localStorage` history and renders a visual grid. It intelligently detects file extensions to decide whether to show an Image, Video, or a generic Icon.

```javascript
/* Critical Code Snippet: Smart Rendering */
const isImage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

// Inside the JSX Map Loop:
{isImage(item.name) ? (
  // If it's an image, request the backend to 'view' it
  <img src={`http://localhost:5000/download/${item.hash}?type=view`} ... />
) : (
  // Otherwise show an icon
  <span>{getFileIcon(item.name)}</span>
)}
```

## 5. Viva / FAQ Questions

**Q: Why use a Backend? Why not Frontend -> IPFS directly?**
*   **A**: We use a backend to proxy requests to the local IPFS node (port 5001), avoiding CORS issues and security risks of exposing the IPFS API directly to the public internet.

**Q: Where are the files actually stored?**
*   **A**: Initially, they are stored in the local peer's repository (`~/.ipfs`). As other nodes request the file, it replicates across the network.

**Q: Is it truly private?**
*   **A**: No, standard IPFS is public. If someone guesses the hash, they can see the file. This project builds the *storage layer*. Privacy would require a layer of Encryption on top (which is a planned future feature).
