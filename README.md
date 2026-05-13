# IPFS Secure Storage Application

A decentralized, cryptographically private file management application built with React, Node.js, and IPFS (Pinata + Kubo).

## Overview
This application provides a modern Virtual File System with zero-knowledge AES-256 client-side encryption. Files are encrypted in the browser before being pinned to the IPFS network, ensuring complete privacy, censorship resistance, and immutability.

## 🚀 Getting Started

Follow these steps to set up and run the project on your local machine.

### Prerequisites
- **Node.js** (v16 or higher)
- **Git**
- A free account on [Pinata.cloud](https://pinata.cloud/)

### Installation & Setup

**1. Clone the repository**
```bash
git clone https://github.com/shaahinnn/ipfs-storage-app.git
cd ipfs-storage-app
```

**2. Install Dependencies**
Install the necessary packages for both the React frontend and Node backend:
```bash
npm install
```

**3. Configure Environment Variables**
The application requires your Pinata API credentials to upload files to the IPFS network.
- Copy the `.env.example` file and rename it to `.env`.
- Log in to your Pinata account, generate an API Key (JWT), and paste it into the `PINATA_JWT` field in your `.env` file.

**4. Setup Local IPFS Daemon (Kubo)**
The startup script expects a local IPFS daemon to be present.
- Download the IPFS Kubo executable for Windows from the [official IPFS releases page](https://github.com/ipfs/kubo/releases).
- Extract the zip file and place the `ipfs.exe` file inside a new folder named `kubo` in the root of this project (`ipfs-storage-app/kubo/ipfs.exe`).

### Running the Application

**1. Start the Project**
For Windows users, we've provided an automated startup script that launches the IPFS Daemon, the Node.js backend, and the React frontend simultaneously:
Right-click `start_project.ps1` and select **Run with PowerShell**, or run it from your terminal:
```powershell
.\start_project.ps1
```

**2. Access the Application**
Once started, the application will be available at:
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5002`

### 📱 LAN / Cross-Device Access
If you want to access the app from your mobile phone (on the same Wi-Fi network) using the in-app QR code scanner:
1. Run PowerShell as an Administrator.
2. Execute the firewall configuration script:
```powershell
.\allow_lan_access.ps1
```
This will open ports 3000 and 5002 on your Windows Defender Firewall to allow local network traffic.

## 📚 Documentation
For a deep dive into the system architecture, security model, and implementation details, please read the [FINAL_PROJECT_DOCUMENTATION.md](./FINAL_PROJECT_DOCUMENTATION.md).
