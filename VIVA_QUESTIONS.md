# 🎓 IPFS Secure Storage App: Viva & Presentation Q&A

This document contains the most frequently asked examiner questions for Web3, IPFS, and React projects, tailored exactly to your codebase.

---

## 🌍 Subject: IPFS Theory & Architecture

### 1. What is IPFS and how does it differ from traditional HTTP?
**Answer:** Traditional HTTP is "Location-Addressed" (it asks *where* a file is stored, like `google.com/image.png`). If that server goes down, the file is lost (Error 404). IPFS is "Content-Addressed" (it asks *what* the file is). Files are stored across a decentralized, global peer-to-peer network.

### 2. What is a CID? Why don't you use standard IDs or URLs?
**Answer:** A CID (Content Identifier) is a unique, cryptographic hash (fingerprint) of the file's exact contents. Because it's generated from the contents, it is impossible to tamper with a file without changing its CID. If I upload the exact same file twice, I get the exact same CID.

### 3. What happens if the node storing my file goes offline?
**Answer:** If the file is only on my Local Daemon and I shut my computer down, the file becomes inaccessible. This is called the "Garbage Collection" problem in IPFS. To solve this, my project integrates the **Pinata API**, which acts as a professional pinning node. Pinata keeps the file permanently "pinned" and seeded to the global network 24/7.

### 4. Are files on IPFS private by default?
**Answer:** No. IPFS is entirely public. Anyone with the CID can retrieve the file. This is exactly why my project implements **Client-Side AES-256 Encryption**. By the time the file reaches the IPFS network, it is mathematically scrambled and highly secure.

---

## 🔒 Subject: Security & Encryption Code

### 5. Why did you choose "Client-Side" encryption instead of encrypting the file on the Node.js backend?
**Answer:** Client-side encryption ensures a "Zero-Knowledge Architecture". The file is encrypted directly in the user's browser using JavaScript. When the file travels over the internet to my Node server and then to IPFS, it is already ciphertext. Even if my backend was fully hacked, the attackers would only see encrypted data. 

### 6. Explain your code: How does the browser encrypt an image or PDF?
**Answer:** First, I use the HTML5 `FileReader` API to read the file into browser memory as a Base64 string (Data URL). Because `FileReader` takes time to load large files, I wrap it in a JavaScript `Promise`. Once I have the text string, I pass it to the `CryptoJS` library, which encrypts it using the user's password. Finally, I package that encrypted text back into a raw file (`Blob`) and send it.

### 7. Where are the Vault passwords stored, and is it safe?
**Answer:** The Secure Vault (and your App PIN) are stored in the browser's `localStorage`. This means the keys physically reside only on the specific computer and browser being used. It is completely isolated and never sent to a database. As long as the physical computer isn't compromised, the keys are perfectly safe.

---

## 💻 Subject: React Frontend & App Structure

### 8. How did you connect React to the IPFS Daemon?
**Answer:** React does not talk to IPFS directly. I built a Middleware API using **Node.js and Express**. React uses `axios` and `FormData` to send the file to Node.js on port 5000. Node.js then uses the `ipfs-http-client` library to communicate with the Go-IPFS (Kubo) daemon running on port 5001.

### 9. What makes your project a PWA (Progressive Web App)?
**Answer:** A Progressive Web App behaves exactly like a native desktop or mobile application. By utilizing React's `serviceWorkerRegistration.js` and a fully configured `manifest.json`, my app automatically caches its own files locally. This allows the user to click an "Install" button in their browser toolbar, permanently install the app to their system, and load the UI even without an internet connection.

### 10. How does the "Recent Activity Timeline" update so quickly without refreshing?
**Answer:** In React, the UI represents the "State" of the application. I built a `utils/activity.js` helper that pushes new actions (like an upload) into an array in `localStorage`. Because my React component hooks into this data on render, the timeline populates dynamically purely on the frontend. No expensive database calls are needed.

---

## 🚀 Subject: Project Limitations & Future Scope

### 11. What is the biggest disadvantage or limitation of your current app?
**Answer:** Because encryption requires loading the entire file into the browser's RAM as a Base64 string, attempting to encrypt massive files (like a 4GB movie) would crash the browser tab (out-of-memory error). To solve this in the future, we would need to implement "Stream Encryption".

### 12. If you had 3 more months, what would you add?
**Answer:** I would migrate the `localStorage` vault to a secure Cloud Database (like MongoDB or Firebase) so users can log in from any computer and see their saved IPFS hashes. I would also write an Ethereum Smart Contract to permanently record ownership of the IPFS Hashes on a blockchain.
