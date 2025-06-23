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
//mongoose for working with mongodb database
const { MongoClient } = require('mongodb');
//import the document routes
const documentRoutes = require('./routes/documents');
const aiRoutes = require('./routes/ai');

//creates the server
const app = express();
//port num the server will listen on, first tries the one in .env file (port 5000 is blocked)
const PORT = process.env.PORT || 3001;

// Middleware
//allows frontend to communicate with backend
app.use(cors());
//backend can understand json data sent by frontend
app.use(express.json());

//connect to mongodb database, now using local host
const client = new MongoClient('mongodb://localhost:27017/collab-code-ai', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

client.connect()
.then(() => {
  console.log('Connected to MongoDB');
  const db = client.db('collab-code-ai');
  // Store db reference for use in routes
  app.locals.db = db;
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Please check your MONGODB_URI in the .env file');
});

// Test route
//simple route and message
app.get('/', (req, res) => {
  res.send('Hello from Collab Code AI backend!');
});

//app.use is used to handle routes, it is a middleware function that is used to handle routes
// Document routes
app.use('/api/documents', documentRoutes);
//ai routes
app.use('/api/ai', aiRoutes);

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
    console.log('=== JOIN DOCUMENT REQUEST RECEIVED ===');
    console.log('User:', socket.id);
    console.log('Document ID:', documentId);
    
    socket.join(documentId);
    
    console.log(`User ${socket.id} joined document ${documentId}`);
    console.log(`Users in room ${documentId}:`, socket.adapter.rooms.get(documentId)?.size || 0);
  });

  //handle code changes from users
  socket.on('code-change', (data) => {
    console.log('=== RECEIVED CODE CHANGE ===');
    console.log('From user:', socket.id);
    console.log('Document ID:', data.documentId);
    console.log('Code length:', data.code.length);
    
    // Send the change to all other users in the same document
    socket.to(data.documentId).emit('code-update', {
      code: data.code,
      userId: socket.id
    });
    
    console.log(`Broadcasted code change to room: ${data.documentId}`);
    console.log(`Users in room ${data.documentId}:`, socket.adapter.rooms.get(data.documentId)?.size || 0);
  });

  //log when user leaves
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
}); 