// apps/dns-service/test-query.js
const dns2 = require('dns2');

const client = new dns2({
  nameServers: ['127.0.0.1'],
  port: 5300,
});

(async () => {
  try {
    const result = await client.resolveA('xvideos.com');
    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.log('ERROR:', err.message);
  }
})();