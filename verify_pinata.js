const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

async function testPinataIntegration() {
    console.log("Starting Pinata Integration Test...");
    const filePath = path.join(__dirname, 'test_pinata.txt');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    let hash;

    // 1. Test Upload
    try {
        console.log("1. Testing Upload to /upload endpoint...");
        const uploadRes = await axios.post('http://localhost:5002/upload', formData, {
            headers: formData.getHeaders()
        });
        hash = uploadRes.data.hash;
        console.log(`✅ Upload Success! Received IPFS Hash: ${hash}`);
    } catch (err) {
        console.error("❌ Upload Failed!");
        console.error(err.response ? err.response.data : err.message);
        process.exit(1);
    }

    // 2. Test Download
    try {
        console.log(`2. Testing Download from /download/${hash}...`);
        const downloadRes = await axios.get(`http://localhost:5002/download/${hash}`);
        const content = downloadRes.data;
        if (content.includes("Hello IPFS Pinata Verification!")) {
             console.log("✅ Download & Content Verification Success!");
        } else {
             console.error("❌ Download Succeeded but Content Mismatch!");
             console.log("Received:", content);
             process.exit(1);
        }
    } catch (err) {
        console.error("❌ Download Failed!");
        console.error(err.response ? err.response.data : err.message);
        process.exit(1);
    }

    console.log("🎉 All backend Pinata integration tests passed successfully!");
}

testPinataIntegration();
