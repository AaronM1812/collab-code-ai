// Authentication routes using native MongoDB driver

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET || 'devrefreshsecret',
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const db = req.app.locals.db;
    
    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(db, email);
    const existingUserByUsername = await User.findByUsername(db, username);
    
    if (existingUserByEmail || existingUserByUsername) {
      return res.status(400).json({ error: 'Username or email already in use.' });
    }
    
    // Create the new user
    const user = await User.create(db, { username, email, password });
    
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
      user: { id: user._id, username: user.username, email: user.email } 
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
      user: { id: user._id, username: user.username, email: user.email }
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

module.exports = router; 