// Yjs WebSocket Server for real-time collaboration
const { setupWSConnection } = require('y-websocket');
const http = require('http');

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server is running');
});

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  
  if (pathname === '/') {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }
  
  setupWSConnection(request, socket, head, pathname.slice(1));
});

const PORT = 1234;
server.listen(PORT, () => {
  console.log(`Yjs WebSocket Server running on ws://localhost:${PORT}`);
}); 