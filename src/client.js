const WebSocket = require('uws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  ws.send('Hello server from client');
});

ws.on('message', (data) => {
  global.console.log(JSON.parse(data));
  // flags.binary will be set if a binary data is received.
  // flags.masked will be set if the data was masked.
});
