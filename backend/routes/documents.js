//this is the API routines, think of routes as the menu items in a restaurant, routes are needed for communication between frontend and backend

//importing express to create a router
const express = require('express');
//importing object id from mongodb
const { ObjectId } = require('mongodb');
//importing the document model from models folder
const Document = require('../models/Document');
//importing the authentication middleware
const authMiddleware = require('../middleware/auth');
//creating a router
const router = express.Router();

// Apply authentication middleware to all document routes
router.use(authMiddleware);

//get all documents route (now user-specific)
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find all documents for the current user
    const documents = await Document.findAllByUser(db, req.user.userId);
    //res used to send data to the frontend
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

//get owned documents route
router.get('/owned', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find documents owned by the current user
    const documents = await Document.findAllOwnedByUser(db, req.user.userId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching owned documents:', error);
    res.status(500).json({ error: 'Failed to fetch owned documents' });
  }
});

//get shared documents route
router.get('/shared', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find documents shared with the current user
    const documents = await Document.findAllSharedWithUser(db, req.user.userId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching shared documents:', error);
    res.status(500).json({ error: 'Failed to fetch shared documents' });
  }
});

//get document by id route (with user ownership check)
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const documentId = new ObjectId(req.params.id);
    
    // Check user access to this document
    const accessCheck = await Document.checkUserAccess(db, documentId, req.user.userId);
    if (!accessCheck || !accessCheck.access) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    //function call to find the document by the id form document model
    const document = await Document.findById(db, documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

//create new document route (now includes userId)
router.post('/', async (req, res) => {
  try {
    //destructure the request body
    const { name, content, language } = req.body;
    //if no name, return an error
    if (!name) {
      return res.status(400).json({ error: 'Document name is required' });
    }
    
    //get the database reference from the request
    const db = req.app.locals.db;
    //function call to create a new document form document model
    const document = await Document.create(db, {
      name,
      content: content || '// Start coding here!',
      language: language || 'javascript',
      userId: req.user.userId, // Add the current user's ID (now a string)
      owner: req.user.username // Add the owner name
    });
    
    //send the created document to the frontend
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

//update document route (with user ownership check)
router.put('/:id', async (req, res) => {
  try {
    //destructure the request body
    const { name, content, language } = req.body;
    //get the database reference from the request
    const db = req.app.locals.db;
    const documentId = new ObjectId(req.params.id);

    // Check user access and permissions
    const accessCheck = await Document.checkUserAccess(db, documentId, req.user.userId);
    if (!accessCheck || !accessCheck.access) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Only allow write operations if user has write permission or is owner
    if (accessCheck.permission === 'read' && accessCheck.permission !== 'owner') {
      return res.status(403).json({ error: 'Read-only access' });
    }

    //function call to update the document by the id form document model
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (language !== undefined) updateData.language = language;
    
    //function call to update the document by the id form document model
    const result = await Document.updateById(db, documentId, updateData);
    
    //if no document found, return an error
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    //function call to find the updated document by the id form document model
    const updatedDocument = await Document.findById(db, documentId);
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

//delete document route (with user ownership check)
router.delete('/:id', async (req, res) => {
  try {
    //get the database reference from the request
    const db = req.app.locals.db;
    const documentId = new ObjectId(req.params.id);

    // Check user access and permissions - only owners can delete
    const accessCheck = await Document.checkUserAccess(db, documentId, req.user.userId);
    if (!accessCheck || !accessCheck.access || accessCheck.permission !== 'owner') {
      return res.status(403).json({ error: 'Only document owners can delete documents' });
    }

    //function call to delete the document by the id form document model
    const result = await Document.deleteById(db, documentId);
    
    //if no document found, return an error
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    //send a success message to the frontend
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

//search documents by name route (now user-specific)
router.get('/search/:query', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find the documents by the name for the current user
    const documents = await Document.findByNameAndUser(db, req.params.query, req.user.userId);
    res.json(documents);
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

module.exports = router;