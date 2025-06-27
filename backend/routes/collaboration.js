// Collaboration routes for document sharing and permissions

const express = require('express');
const { ObjectId } = require('mongodb');
const Document = require('../models/Document');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all collaboration routes
router.use(authMiddleware);

// Get all users (for sharing suggestions)
router.get('/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const users = await User.find({}).select('username email').exec();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Share document with user
router.post('/share/:documentId', async (req, res) => {
  try {
    const { email, permission = 'read' } = req.body;
    const documentId = req.params.documentId;
    const db = req.app.locals.db;

    // Check if user has permission to share this document
    const accessCheck = await Document.checkUserAccess(db, new ObjectId(documentId), req.user.userId);
    if (!accessCheck || accessCheck.permission === 'read') {
      return res.status(403).json({ error: 'You do not have permission to share this document' });
    }

    // Find the user to share with
    const userToShareWith = await User.findOne({ email }).exec();
    if (!userToShareWith) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already shared
    const document = await Document.findById(db, new ObjectId(documentId));
    const alreadyShared = document.collaborators.find(c => c.userId === userToShareWith._id.toString());
    if (alreadyShared) {
      return res.status(400).json({ error: 'Document is already shared with this user' });
    }

    // Add collaborator
    await Document.addCollaborator(db, new ObjectId(documentId), {
      userId: userToShareWith._id.toString(),
      username: userToShareWith.username,
      email: userToShareWith.email,
      permission
    });

    res.json({ message: 'Document shared successfully' });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
});

// Remove collaborator from document
router.delete('/share/:documentId/:userId', async (req, res) => {
  try {
    const { documentId, userId } = req.params;
    const db = req.app.locals.db;

    // Check if user has permission to manage this document
    const accessCheck = await Document.checkUserAccess(db, new ObjectId(documentId), req.user.userId);
    if (!accessCheck || accessCheck.permission === 'read') {
      return res.status(403).json({ error: 'You do not have permission to manage this document' });
    }

    await Document.removeCollaborator(db, new ObjectId(documentId), userId);
    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// Update collaborator permission
router.put('/share/:documentId/:userId/permission', async (req, res) => {
  try {
    const { documentId, userId } = req.params;
    const { permission } = req.body;
    const db = req.app.locals.db;

    if (!['read', 'write'].includes(permission)) {
      return res.status(400).json({ error: 'Invalid permission level' });
    }

    // Check if user has permission to manage this document
    const accessCheck = await Document.checkUserAccess(db, new ObjectId(documentId), req.user.userId);
    if (!accessCheck || accessCheck.permission === 'read') {
      return res.status(403).json({ error: 'You do not have permission to manage this document' });
    }

    await Document.updateCollaboratorPermission(db, new ObjectId(documentId), userId, permission);
    res.json({ message: 'Permission updated successfully' });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

// Get document collaborators
router.get('/share/:documentId/collaborators', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const db = req.app.locals.db;

    // Check if user has access to this document
    const accessCheck = await Document.checkUserAccess(db, new ObjectId(documentId), req.user.userId);
    if (!accessCheck) {
      return res.status(403).json({ error: 'You do not have access to this document' });
    }

    const document = await Document.findById(db, new ObjectId(documentId));
    res.json(document.collaborators || []);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

// Get shared documents (documents shared with current user)
router.get('/shared', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documents = await Document.findAllSharedWithUser(db, req.user.userId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching shared documents:', error);
    res.status(500).json({ error: 'Failed to fetch shared documents' });
  }
});

// Get owned documents
router.get('/owned', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documents = await Document.findAllOwnedByUser(db, req.user.userId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching owned documents:', error);
    res.status(500).json({ error: 'Failed to fetch owned documents' });
  }
});

module.exports = router; 