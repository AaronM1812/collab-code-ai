// yjs-server.js
// Starts a Yjs WebSocket server for collaborative editing

const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils.js');

const port = 1234;
const server = http.createServer();

server.on('upgrade', (request, socket, head) => {
  setupWSConnection(socket, request);
});

server.listen(port, () => {
  console.log(`Yjs WebSocket server running on ws://localhost:${port}`);
}); 