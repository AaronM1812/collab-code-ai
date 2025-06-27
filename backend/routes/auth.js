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
    //else create a jwt token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '7d' }
    );
    //return the token and the user to the frontend
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    //if there is an error, return an error message
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router; 