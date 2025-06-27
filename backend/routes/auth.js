//this file will define the routes for the authentication

//express used to create the router
const express = require('express');
//bcrypt used to hash the password
const bcrypt = require('bcryptjs');
//jwt used to create the token
const jwt = require('jsonwebtoken');
//user model
const User = require('../models/User');
//creating the router
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

//register a new user

//route to register a new user
router.post('/register', async (req, res) => {
  try {
    //destructure the request body
    const { username, email, password } = req.body;
    //check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      //if user already exists, return an error
      return res.status(400).json({ error: 'Username or email already in use.' });
    }
    //hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    //create and save the new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    //return a success message
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    //if there is an error, return an error message
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

//login a user

//route to login a user
router.post('/login', async (req, res) => {
  try {
    //destructure the request body
    const { email, password } = req.body;
    //find user by email
    const user = await User.findOne({ email });
    if (!user) {
      //if user is not found, return an error
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    //compare the password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      //if the password is not correct, return an error
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Generate both access and refresh tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    //return the tokens and the user to the frontend
    res.json({ 
      accessToken, 
      refreshToken,
      user: { id: user._id, username: user.username, email: user.email } 
    });
  } catch (err) {
    //if there is an error, return an error message
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

//refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'devrefreshsecret');
    
    // Find user
    const user = await User.findById(decoded.userId);
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

//logout route (optional - for token blacklisting in production)
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