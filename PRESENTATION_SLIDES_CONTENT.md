# Presentation Slides Content - Zeroth Review
**Project Phase 2**

---

### Slide 1: Title Slide
**Title**: Decentralized File Storage Application using IPFS
**Presented By**: [Your Names]
**Guide**: [Guide Name]
**Date**: 14-01-2026

---

### Slide 2: Introduction
*   **Context**: Data is the new oil, but storing it safely is a challenge.
*   **Problem**: We currently rely on tech giants (Google, Amazon) to store our personal data.
*   **Goal**: To build a storage application that gives control back to the user.
*   **Technology**: We use **IPFS (InterPlanetary File System)** to store files in a distributed network, making them unblockable and permanently accessible.

---

### Slide 3: Existing System
*   **Centralized Cloud Storage** (e.g., Google Drive, Dropbox).
*   **How it works**: All files live on a central server farm owned by one company.
*   **Drawbacks**:
    *   **Single Point of Failure**: If the server goes down, you lose access.
    *   **Censorship**: The provider can delete your files or block your account.
    *   **Privacy Risks**: The provider can see your data.

---

### Slide 4: Proposed System
*   **Decentralized Storage (IPFS)**.
*   **How it works**: Files are chopped into blocks and stored on many computers (nodes) around the world.
*   **Key Features**:
    *   **No Central Server**: The network *is* the server.
    *   **Content Addressing**: You ask for a file by "what it is" (Hash), not "where it is" (URL).
    *   **Immutability**: Files cannot be altered once uploaded.
    *   **High Availability**: As long as one node has the file, it is accessible.

---

### Slide 5: Modules Description
**1. Frontend Module (React.js)**
*   User Interface for easy interaction.
*   **Features**: Drag-and-drop upload, File Gallery, Recent History.
*   **Role**: Converts user actions into API calls.

**2. Middleware Module (Node.js & Express)**
*   The bridge between the Web Browser and IPFS.
*   **Role**: Handles file processing, wraps files for upload, and streams data for download.

**3. Storage Infrastructure (Kubo/IPFS Node)**
*   The core storage engine.
*   **Role**: Connects to the global swarm, manages disk storage, and handles data replication.

---

### Slide 6: Implementation Screenshots
**(Place screenshot of Home Page here)**
*   *Caption*: Application Home Page showing the clean, user-friendly interface.

**(Place screenshot of Upload Page here)**
*   *Caption*: Upload interface supporting file selection and progress tracking.

**(Place screenshot of Gallery Page here)**
*   *Caption*: Data Gallery viewing uploaded images and files retrieved from IPFS.

---

### Slide 7: Implementation Status (50% Completion)
*   **Completed**:
    *   [x] Basic React Frontend Setup.
    *   [x] Node.js Backend Server Setup.
    *   [x] Integration with IPFS Daemon.
    *   [x] File Upload Functionality.
    *   [x] File Retrieval/Download Functionality.
*   **Pending (Future Scope)**:
    *   [ ] Client-Side Encryption (AES).
    *   [ ] User Authentication.
    *   [ ] File Pinning Service Integration.

---

### Slide 8: Conclusion
*   We have successfully demonstrated a working prototype of a Decentralized Storage Application.
*   The system solves the "Single Point of Failure" problem.
*   We have achieved the core functionality of Uploading and Retrieving files from the distributed web.
*   **Next Step**: Enhancing security and user management.

---

### Slide 9: Thank You / Q&A
