# IPFS Secure Storage Application: Comprehensive Project Report

## Abstract
The rapid growth of data generation has exposed vulnerabilities and privacy concerns inherent in centralized cloud storage systems. This project presents the design, implementation, and evaluation of a decentralized, cryptographic file storage application utilizing the InterPlanetary File System (IPFS) protocol. By integrating client-side AES-256 encryption, dual-layer pinning strategies (local daemon and global Pinata network), and a Progressive Web App (PWA) architecture, this application ensures zero-knowledge privacy, data immutability, and persistent accessibility. Furthermore, the system abstracts the complexities of Content-Addressed Storage through a Virtual File System and a Secure Hash Vault, providing users with a familiar interface for decentralized data management.

---

## 1. Introduction
Traditional cloud storage providers (such as Google Drive or AWS S3) rely on centralized servers. This infrastructure creates single points of failure, subjects data to potential censorship, and requires users to implicitly trust third-party organizations with their unencrypted information. 

The IPFS Secure Storage Application was developed to solve these issues. Operating on a peer-to-peer (P2P) network, IPFS distributes data across multiple nodes, ensuring resilience. However, IPFS natively lacks built-in privacy configurations—data is public to anyone with the associated hash. The primary objective of this project is to build a robust, user-friendly interface on top of the IPFS network that guarantees data privacy via client-side encryption while maintaining the permanence and decentralization that Web3 protocols offer.

---

## 2. Comprehensive Feature List

### 2.1 Core Functionality
- **Browser-Based AES-256 Encryption:** Files are encrypted entirely within the user's browser before network transmission.
- **Local IPFS Node Integration:** Direct uploads and retrievals utilizing a local Kubo daemon.
- **Remote Pinning via Pinata:** Users can optionally store their files on global enterprise nodes to ensure 24/7 data availability.
- **Content-Addressed Retrieval:** Fetching files using cryptographic hashes (CIDs) rather than directory paths.

### 2.2 User Interface and File Management (Gallery)
- **Virtual File System:** Organizes complex IPFS hashes into familiar, user-defined folders.
- **In-Browser Decryption and Preview:** Images, PDFs, and Videos can be decrypted and viewed instantly without downloading the raw file.
- **Contextual Operations Menu:** A 3-dot dropdown for copying hashes, saving to the vault, generating QR codes, and moving files.

### 2.3 Security and Accessibility
- **Session PIN Lock Screen:** Prevents unauthorized physical access to the application’s local history and vault.
- **Secure Hash Vault:** A decentralized password manager that pairs a file's CID with its specific AES decryption key.
- **Progressive Web App (PWA):** Installs natively on desktop and mobile operating systems.
- **Local Area Network (LAN) QR Sharing:** Generates QR codes of the local IP address for instant cross-device file sharing over Wi-Fi.

### 2.4 Analytics Dashboard
- **Storage Metrics:** Live tracking of total files, vault entries, and custom folders.
- **Cryptographic Ratio Chart:** A dynamic Doughnut chart, powered by Chart.js, visualizing the ratio of Encrypted vs. Plain-text data residing on the IPFS network.

---

## 3. Project Architecture and Implementation Details

The project architecture is divided into three primary components: the Frontend (React), the Backend (Node.js/Express), and the Storage Layer (IPFS Daemon).

### 3.1 The Frontend (React.js)
The frontend serves as the application's presentation and cryptographic layer. It is built using React 18, utilizing functional components and hooks (`useState`, `useEffect`).

- **LockScreen Component:** 
  Mounted at the root of `App.js`. This component intercepts all traffic. If `sessionStorage` does not contain a valid unlock token, the user is presented with a minimal glassmorphic PIN pad. This ensures local data (stored in `localStorage`) is protected.
  
- **Upload Component:** 
  Handles the ingestion of files. When a user selects a file and provides a password, the `Upload.js` logic utilizes `FileReader` to convert the binary file into a base64 Data URL. 
  It then implements client-side encryption:
  ```javascript
  const encrypted = CryptoJS.AES.encrypt(payload, encryptionKey).toString();
  const encryptedBlob = new Blob([encrypted], { type: 'text/plain' });
  ```
  This creates a secure payload. Finally, it uses `axios` to construct a `FormData` object and transmit it to the backend server. If the user selects the Pinata option, it appends the Pinata API keys to the payload.

- **Gallery Component:**
  This component acts as the Virtual File System. IPFS natively lacks directories, so `Gallery.js` reads an array of metadata objects from the browser's `localStorage`. It dynamically maps these objects to render folders and file cards. When a user clicks an encrypted file, the component fetches the cipher-text from IPFS, applies the `CryptoJS.AES.decrypt` function, transforms the resulting base64 string back into a `Blob`, and generates a temporary `ObjectURL` to render the image or video directly in the DOM.

- **Vault Component:**
  The `Vault.js` component operates independently, functioning as a localized database for essential CIDs. It allows users to manually add hashes and passwords, presenting them in a highly organized, searchable HTML table.

### 3.2 The Backend (Node.js & Express)
A lightweight Express.js server acts as the middleware bridge between the browser and the IPFS network. 

- **File Buffering:** 
  The server utilizes `multer` to intercept multipart form data from the React frontend, temporarily saving the file to an `/uploads` directory.
  
- **IPFS Upload Route (`/upload`):**
  ```javascript
  for await (const result of ipfs.addAll([{
    path: file.originalname,
    content: fs.readFileSync(file.path)
  }], { wrapWithDirectory: true })) { ... }
  ```
  The server connects to the Kubo daemon at `127.0.0.1:5001`. It reads the temporary file and streams it into the IPFS network. The resulting Content Identifier (CID) is returned to the frontend as JSON.
  
- **Remote Pinning Route (`/pin-to-pinata`):**
  If the user opts for global permanence, the backend extracts the file and the user's provided API keys from the request body. It then utilizes `axios` to construct a direct HTTP POST request to `https://api.pinata.cloud/pinning/pinFileToIPFS`.

- **Download Route (`/download/:hash`):**
  Because CORS (Cross-Origin Resource Sharing) policies natively restrict browser access to the IPFS daemon API, the backend provides a proxy download route. It uses `ipfs.cat(targetPath)` to stream the file chunks from the local IPFS node, assemble them into a Buffer, and serve them to the React frontend with appropriate Content-Type headers.

### 3.3 The Storage Layer (Kubo IPFS Daemon)
The foundation of the application is the local Kubo daemon (an implementation of IPFS written in Go). The daemon maintains a Distributed Hash Table (DHT) and connects to peer nodes globally. 
- **Hash Generation:** When the backend passes a file to the daemon, the daemon chunks the file into 256KB blocks, cryptographically hashes them using SHA-256, and generates a Merkle Directed Acyclic Graph (DAG). The root of this graph is the CID returned to the user.
- **Immutability:** Because the CID is a direct cryptographic representation of the file's contents, the file is inherently immutable. Changing a single byte of the file will mathematically alter the resulting hash, guaranteeing data integrity.

---

## 4. Advantages 
1. **Zero-Knowledge Privacy:** Cryptography occurs before the data leaves the device. The server owner, the IPFS node operators, and the ISP cannot read the files.
2. **Censorship Resistance:** Data distributed over the IPFS P2P network cannot be unilaterally deleted by a single corporate entity or government firewall.
3. **Data Immutability:** Content-Addressed Storage guarantees that the file retrieved using a specific hash perfectly matches the original file uploaded.
4. **No Recurring Subscriptions:** Utilizing a local node is entirely free, removing reliance on monthly cloud storage fees.
5. **Cross-Platform Compatibility:** As a PWA running in the browser, the app functions flawlessly across Windows, macOS, Linux, Android, and iOS.

## 5. Disadvantages and Limitations
1. **Network Persistence Reliance:** Standard local IPFS pinning requires the host machine to remain online for the data to be accessible to other peers. (Mitigated in this project by the Pinata remote pinning integration).
2. **Key Management Responsibility:** Given the decentralized nature of the application, there is no "Forgot Password" feature. If a user loses their encryption password or their CID, the data is mathematically unrecoverable.
3. **Browser Storage Limits:** The Virtual File System history is heavily dependent on `localStorage`, which is tied to the specific browser and device used, complicating cross-device synchronization without exporting the Vault.

---

## 6. Future Scope of the Project
1. **Blockchain Integration (Smart Contracts):** The application could be extended by linking the Secure Hash Vault to an Ethereum or Polygon smart contract, permanently saving the user's encrypted file metadata to the blockchain instead of using browser `localStorage`.
2. **InterPlanetary Name System (IPNS):** Implementing IPNS to allow files to be updated. An IPNS pointer would provide a static URL that always resolves precisely to the latest dynamically generated IPFS CID version of a file.
3. **Multi-Node Syncing:** Developing a desktop client that automatically synchronizes the local Kubo daemon's cached data with a secondary device (e.g., a phone or a Raspberry Pi) to create a personal, resilient server cluster.
4. **File Sharding:** Splitting large files into cryptographic shards before uploading, ensuring high availability across disparate nodes while optimizing bandwidth speed.

---

## 7. Conclusion
The implementation of the IPFS Secure Storage Application effectively demonstrates the paradigm shift away from centralized data silos. By abstracting the complex command-line operations of the IPFS daemon behind a polished, visually appealing React interface, the project lowers the barrier to entry for decentralized technologies. The combination of local multi-threading, mathematical data privacy via AES-256, and permanent global pinning solutions (Pinata) fulfills the fundamental requirements for a secure, future-proof cloud storage alternative.
