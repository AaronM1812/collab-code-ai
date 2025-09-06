// Authentication routes using native MongoDB driver

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id.toString(), username: user.username },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_REFRESH_SECRET || 'devrefreshsecret',
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { username: req.body.username, email: req.body.email });
    console.log('Request body:', req.body);
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      console.log('Missing required fields:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    
    const db = req.app.locals.db;
    console.log('Database connection:', !!db);
    
    // Check if user already exists
    console.log('Checking for existing users...');
    const existingUserByEmail = await User.findByEmail(db, email);
    const existingUserByUsername = await User.findByUsername(db, username);
    console.log('Existing users:', { email: !!existingUserByEmail, username: !!existingUserByUsername });
    
    if (existingUserByEmail || existingUserByUsername) {
      console.log('User already exists');
      return res.status(400).json({ error: 'Username or email already in use.' });
    }
    
    // Create the new user
    console.log('Creating new user...');
    const user = await User.create(db, { username, email, password });
    console.log('User created successfully:', user._id);
    
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;
    
    // Find user by email
    const user = await User.findByEmail(db, email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Compare the password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Generate both access and refresh tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Return the tokens and the user to the frontend
    res.json({ 
      accessToken, 
      refreshToken,
      user: { id: user._id.toString(), username: user.username, email: user.email } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const db = req.app.locals.db;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'devrefreshsecret');
    
    // Find user
    const user = await User.findById(db, decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user._id.toString(), username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout route (optional - for token blacklisting in production)
router.post('/logout', async (req, res) => {
  try {
    // In a production environment, you might want to blacklist the refresh token
    // For now, we'll just return success
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// Validate token route
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    
    // Check if user still exists
    const db = req.app.locals.db;
    const user = await User.findById(db, decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ valid: true, user: { id: user._id.toString(), username: user.username, email: user.email } });
  } catch (err) {
    console.error('Token validation error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user info route
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    
    // Get user info
    const db = req.app.locals.db;
    const user = await User.findById(db, decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ id: user._id.toString(), username: user.username, email: user.email });
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router; 