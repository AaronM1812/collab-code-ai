// User model using native MongoDB driver

const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(db, userData) {
    const { username, email, password } = userData;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  // Find user by email
  static async findByEmail(db, email) {
    return await db.collection('users').findOne({ email });
  }

  // Find user by username
  static async findByUsername(db, username) {
    return await db.collection('users').findOne({ username });
  }

  // Find user by ID
  static async findById(db, userId) {
    return await db.collection('users').findOne({ _id: userId });
  }

  // Check if email exists
  static async emailExists(db, email) {
    const user = await db.collection('users').findOne({ email });
    return !!user;
  }

  // Check if username exists
  static async usernameExists(db, username) {
    const user = await db.collection('users').findOne({ username });
    return !!user;
  }

  // Update user
  static async updateById(db, userId, updateData) {
    const update = {
      ...updateData,
      updatedAt: new Date()
    };
    
    return await db.collection('users').updateOne(
      { _id: userId },
      { $set: update }
    );
  }

  // Delete user
  static async deleteById(db, userId) {
    return await db.collection('users').deleteOne({ _id: userId });
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 