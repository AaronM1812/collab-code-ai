//this file will define the structure of a user in the database

//importing mongoose, a library for interacting with mongodb
const mongoose = require('mongoose');

//defining the schema for the user
const userSchema = new mongoose.Schema({
  //username is a string and is required and unique
  username: { type: String, required: true, unique: true },
  //email is a string and is required and unique
  email:    { type: String, required: true, unique: true },
  //password is a string and is required, it is also hased, timestamps will add createdAt and updatedAt fields to the schema
  password: { type: String, required: true },
}, { timestamps: true });

//defining the model for the user
module.exports = mongoose.model('User', userSchema); 