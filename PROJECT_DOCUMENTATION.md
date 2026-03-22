# IPFS Storage App: Complete Software Documentation

## 1. Introduction & Scope
The **IPFS Storage App** is a decentralized file management system. Unlike traditional cloud storage (Google Drive, Dropbox) which relies on centralized datacenters (creating single points of failure and censorship risks), this application leverages the **InterPlanetary File System (IPFS)** to store files across a peer-to-peer network. 

The primary scope of the project is to provide a seamless, Web 2.0-like user experience customized for decentralized Web 3.0 storage infrastructure, ensuring absolute data immutability, high availability, and zero-knowledge client-side encryption.

---

## 2. System Architecture & Tech Stack

### 2.1 Technology Stack
*   **Operating Concept**: Decentralized Peer-to-Peer Storage.
*   **Frontend**: React.js 18 (SPA - Single Page Application).
*   **Backend Middleware**: Node.js with Express framework.
*   **Storage Network Protocol**: IPFS (Powered by Kubo daemon / `go-ipfs`).
*   **Cryptographic Engine**: CryptoJS (AES-256 for Client-Side Encryption).
*   **File Parsing**: Multer (Backend `multipart/form-data` parsing).

### 2.2 Architectural Flow
1.  **Client-Side Browser**: The React app handles the UI, file selection, and optional AES-256 encryption.
2.  **Middleware Proxy**: Because browsers cannot natively speak to the raw IPFS swarm directly without heavy overhead, the Node.js backend receives the file over HTTP, wraps it in an IPFS directory (to preserve the original file name), and pushes it to the local IPFS node.
3.  **IPFS Swarm**: The local Kubo node pins the file, chunks the data into cryptographic blocks, generates the unique Content Identifier (CID), and broadcasts availability to the global network.

---

## 3. Functionalities (Detailed User Guide)

### 3.1 Secure App-Level Authentication (Lock Screen)
*   **Functionality**: Prevents unauthorized physical access to the browser session.
*   **How it works**: On the first launch, the application prompts the user to create a secure 4-digit PIN. This state is securely saved in `localStorage`. On subsequent interactions or page refreshes, the app demands the PIN and validates it before rendering the main dashboard, ensuring that physical access to the device does not immediately grant access to the Vault.

### 3.2 Dashboard (Home Page)
*   **Functionality**: A central hub providing an analytical overview of the user's storage habits.
*   **How it works**: It aggregates data from the browser's local cache and Secure Vault to display live metrics: 
    *   *Total Files Stored*
    *   *Volume of Encrypted vs. Plaintext Files*
    *   *Total Permanent Vault Entries*
*   It also features explicit Call-to-Action (CTA) navigation for uploading and retrieving files.

### 3.3 File Upload Engine & Client-Side Encryption
*   **Functionality**: The ingest portal for the application.
*   **How it works**:
    1.  The user drags and drops a file (image, video, document, etc.).
    2.  The user is presented with a toggle to **Encrypt File**.
    3.  If Encrypt is checked, the React app requests a password. Using `CryptoJS`, the file is converted into a Base64 string and encrypted via AES-256 *before* it leaves the browser. The backend only ever receives a `.encrypted` text payload.
    4.  The file is uploaded to the Node.js `/upload` endpoint, which pushes it to IPFS and returns the permanent CID.

### 3.4 File Retrieval System
*   **Functionality**: Accessing files from the global swarm.
*   **How it works**: Instead of a URL link, the user inputs the IPFS CID (Hash). The backend queries the IPFS network for that hash. If it's pure data, it downloads and serves it to the browser. If it is an encrypted payload, the React frontend intercepts the raw text, prompts the user for their secret password, decrypts the payload locally in RAM, and reconstructs the file into a downloadable `Blob`.

### 3.7 QR Code Distribution Module
*   **Functionality**: Translates complex cryptographic CIDs into rapidly scannable graphical formats.
*   **Dynamic Network Resolution**: Because IP addresses change across different Wi-Fi networks (e.g., Home vs. Campus), the Node.js backend features an OS-level listener that actively resolves the machine's live IPv4 address and passes it to the React application. 
*   **How it works**: When "Share via QR" is clicked, it dynamically generates an absolute URL (e.g., `http://192.168.x.x:5000/download/Hash`) encoded into the QR SVG. A user can point their mobile device camera at the screen to instantly download the file directly from the decentralized web, drastically reducing friction for mobile-to-desktop peering.

---

### 3.5 Recent Uploads Gallery (Local Session View)
*   **Functionality**: A temporary visual history of files uploaded.
*   **How it works**: This views arrays stored in browser cache. It parses the CIDs and renders them in a grid. This is strictly a "Temporary Browser Log" and is explicitly distinct from permanent tracking, educating the user on the difference between local cache and decentralized tracking.

### 3.6 Secure Hash Vault (Permanent Registry)
*   **Functionality**: A decentralized password manager specifically designed for IPFS Hashes.
*   **How it works**: Because IPFS files are accessed by hash, losing the hash means losing the file. The Secure Vault allows users to explicitly save CIDs they wish to track permanently. This module acts as a long-term database for digital keys, providing a reliable interface to catalog, copy, and retrieve crucial uploads regardless of browser cache clearances.

---

## 4. Security & Data Privacy Model

### The Zero-Knowledge Proof Concept
The application embodies Web 3.0 privacy standards:
1.  **No Central Authority**: The backend Node.js server acts purely as a dumb pipe proxy. It contains no database and logs no user passwords.
2.  **End-to-End Darkness**: When the encryption protocol is used, the password remains strictly inside the user's physical RAM. The file traversing the local internet connection and resting on the global IPFS nodes is entirely unintelligible noise to anyone without the original AES password block.

---

## 5. Setup & Operational Requirements
To run the full stack architecture locally:
1.  **IPFS Daemon**: Ensure Kubo `ipfs daemon` is running in the terminal (`localhost:5001`).
2.  **Middleware Backend**: `cd backend` and `node server.js` (Listens on port 5000).
3.  **Frontend Application**: `npm start` in the React root directory (Listens on port 3000).

*For a streamlined boot process, the provided `start_project.ps1` script initializes all three asynchronous environments sequentially.*

---

## Conclusion
The **IPFS Storage App** successfully bridges the gap between complex peer-to-peer protocols and consumer-level usability. By combining the immutable network properties of IPFS with a modern React.js frontend and AES-256 encryption logic, the project delivers a comprehensive, censorship-resistant, privacy-first software solution.
