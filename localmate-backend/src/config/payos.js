const PayOS = require('@payos/node');

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID || '8ed476a6-f2b8-41ff-8b4b-2fabbade2c67',
  process.env.PAYOS_API_KEY || '7b07f827-e365-4be4-a18a-1de93beef2ed',
  process.env.PAYOS_CHECKSUM_KEY || '2aab57d1aefcfb3a72d2646f54c8087c282a6fda8a548dbfd7a5a92d3dc2b401'
);

module.exports = payOS;
