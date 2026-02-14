# DECENTRALIZED FILE STORAGE APPLICATION USING IPFS

**Abstract**
Cloud storage services like Google Drive and Dropbox have become integral to digital data management. However, they rely on a centralized architecture, creating a single point of failure (SPOF) and raising concerns about data privacy, censorship, and availability. This paper proposes a Decentralized File Storage Application utilizing the InterPlanetary File System (IPFS). By distributing file data across a peer-to-peer network, the proposed system ensures high availability, immutability, and resistance to censorship. The application leverages a React.js frontend for user interaction and a Node.js backend to interface with an IPFS node, providing a seamless and secure storage alternative.

**1. Introduction**
The exponential growth of digital data has necessitated robust storage solutions. Traditional centralized storage systems store data on central servers owned by a single entity. While convenient, this model poses significant risks: if the central server fails or is attacked, data becomes inaccessible. Furthermore, users essentially surrender control of their data to service providers. This project aims to address these issues by building a storage application on top of IPFS, a peer-to-peer hypermedia protocol designed to make the web faster, safer, and more open.

**2. Existing System**
Current popular storage solutions (e.g., AWS S3, Google Drive) are centralized.
*   **Architecture**: Client-Server model. Users upload files to a central data center.
*   **Limitations**:
    *   **Single Point of Failure**: Hardware failure or network outage at the data center disrupts service.
    *   **Censorship**: Central authorities can block access to specific content.
    *   **Data Privacy**: Service providers have technical access to user data.
    *   **Bandwidth Costs**: All traffic is routed to central servers, increasing costs and latency.

**3. Proposed System**
The proposed system is a Decentralized Application (DApp) that uses IPFS for storage.
*   **Architecture**: Peer-to-Peer (P2P). Files are broken into chunks, hashed, and distributed across the network.
*   **Advantages**:
    *   **Decentralization**: No central server controls the data.
    *   **Immutability**: Files on IPFS are content-addressed (accessed by hash). If content changes, the hash changes, ensuring data integrity.
    *   **Availability**: Content can be retrieved from any node that possesses it, reducing bottlenecks.
    *   **Deduplication**: Identical files produce the same hash and are stored only once.

**4. Module Description**
The implementation consists of three extensive modules:

*   **A. React Frontend Module**:
    *   Developed using React.js.
    *   Provides a user-friendly interface for file selection and visualization.
    *   **Upload Interface**: Allows users to select files via `FormData`.
    *   **Gallery Interface**: Retrieves file metadata from local storage and displays files (images, videos, documents) in a grid layout.

*   **B. Node.js Middleware Module**:
    *   Acts as a bridge between the client and the IPFS network.
    *   **API Endpoints**:
        *   `/upload`: Receives files and adds them to IPFS. It wraps files in a directory to preserve filenames.
        *   `/download/:hash`: Retrieves file streams from IPFS and serves them to the client with correct MIME types.

*   **C. IPFS Infrastructure Module**:
    *   Powered by **Kubo (go-ipfs)** daemon.
    *   Maintains the P2P network connections (swarm).
    *   Handles the actual block storage, hashing (CID generation), and routing of requests.

**5. Implementation & Results**
The system was implemented with a functional prototype complying with approximately 50% of the final requirements.
*   **Upload Flow**: Users successfully upload files. The backend proxies the data to the local IPFS node, returning a Content Identifier (CID).
*   **Retrieval Flow**: Users access files using the CID. The system resolves the content from the IPFS network.
*   *Screenshots of the working application (Home Page, Upload Success, and Gallery) demonstrate these flows.*

**6. Conclusion**
This project demonstrates the viability of decentralized storage as a robust alternative to centralized cloud services. By integrating IPFS with a modern web stack, we successfully eliminated the single point of failure and introduced a storage model that is inherently more resilient and resistant to censorship. Future work will focus on adding encryption layers to ensure complete data privacy on the public IPFS network.

*(Note to Students: Ensure this content is formatted in Times New Roman, Justified alignment, and printed for verification as per requirements.)*
