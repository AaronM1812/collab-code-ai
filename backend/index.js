//this files the main entry point for the backend which starts and controls the serverr

//libraries used in this file
//express used to build the web servers in node.js(javascript runtime environment)
const express = require('express');
//cores allows frontend to talk to backend 
const cors = require('cors');
//dontenv lets you use .env file to store private info outside of code
require('dotenv').config();

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

// Start server
//tells app to start listening on the port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 