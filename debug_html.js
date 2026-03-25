const axios = require('axios');
const fs = require('fs');

async function run() {
  const hash = 'QmPV2W6ePXfHMLkyjQKjcqsmNjPwxwPyBGmJ4Xu11AAUTj';
  const g = 'https://gateway.pinata.cloud';
  try {
     const get = await axios.get(`${g}/ipfs/${hash}`, { responseType: 'text' });
     fs.writeFileSync('gateway_index_debug.html', get.data);
     console.log('HTML saved to gateway_index_debug.html. Check the file!');
  } catch(e) { console.log('ERR:', e.message); }
}
run();
