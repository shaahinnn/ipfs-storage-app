const axios = require('axios');
const hash = 'QmPV2W6ePXfHMLkyjQKjcqsmNjPwxwPyBGmJ4Xu11AAUTj';
async function run() {
  const g = 'https://gateway.pinata.cloud';
  const url = `${g}/ipfs/${hash}`;
  try {
     const head = await axios.head(url);
     console.log('HEAD:', head.headers['content-type']);
     const get = await axios.get(url, { responseType: 'text' });
     console.log('BODY snippet:', get.data.substring(0, 500));
     
     const match = get.data.match(new RegExp(`href="/ipfs/${hash}/([^"]*)"`));
     console.log('MATCH:', match ? match[1] : 'NONE');
  } catch(e) { console.log('ERR:', e.message, e.response?.status); }
}
run();
