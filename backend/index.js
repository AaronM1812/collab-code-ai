//this files the main entry point for the backend which starts and controls the serverr

//libraries used in this file
//express used to build the web servers in node.js(javascript runtime environment)
const express = require('express');
//cores allows frontend to talk to backend 
const cors = require('cors');
//dontenv lets you use .env file to store private info outside of code
require('dotenv').config();
//imports socket.io library for real-time communication
const { Server } = require('socket.io');

//creates the server
const app = express();
//port num the server will listen on, first tries the one in .env file (port 5000 is blocked)
const PORT = process.env.PORT || 3001;

// Middleware
//allows frontend to communicate with backend
app.use(cors());
//backend can understand json data sent by frontend
app.use(express.json());

// Test route
//simple route and message
app.get('/', (req, res) => {
  res.send('Hello from Collab Code AI backend!');
});

//route to create a new document
app.post('/documents', (req, res) => {
  //extracts the name from the request body
  const { name } = req.body;
  //if no name is provided then it sends a 400 error
  if (!name) {
    return res.status(400).json({ message: 'Document name is required' });
  }
  // In the future, you'll save the document to the database here
  //201 status code to return whether it was created successfuly, returing the message data using standard json
  res.status(201).json({ message: `Document "${name}" created!` });
});

// Start server
//tells app to start listening on the port
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//the socket.io setup
//creates socket.io server attached to the http server above
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

//handle socket connections, each user gets a unique socket id
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  //handle user joining a document
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`User ${socket.id} joined document ${documentId}`);
  });

  //handle code changes from users
  socket.on('code-change', (data) => {
    //sends the change to all other users in the same document except the sender
    socket.to(data.documentId).emit('code-update', {
      code: data.code,
      userId: socket.id
    });
    //log the change
    console.log(`Code change from ${socket.id} in document ${data.documentId}`);
  });

  //log when user leaves
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
}); 