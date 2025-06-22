//this is the API routines, think of routes as the menu items in a restaurant, routes are needed for communication between frontend and backend

//importing express to create a router
const express = require('express');
//importing object id from mongodb
const { ObjectId } = require('mongodb');
//importing the document model from models folder
const Document = require('../models/Document');
//creating a router
const router = express.Router();

//get all documents route
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find all documents form document model
    const documents = await Document.findAll(db);
    //res used to send data to the frontend
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

//get document by id route
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find the document by the id form document model
    const document = await Document.findById(db, new ObjectId(req.params.id));
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

//create new document route
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
      language: language || 'javascript'
    });
    
    //send the created document to the frontend
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

//update document route
router.put('/:id', async (req, res) => {
  try {
    //destructure the request body
    const { name, content, language } = req.body;
    //get the database reference from the request
    const db = req.app.locals.db;
    //function call to update the document by the id form document model
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) updateData.content = content;
    if (language !== undefined) updateData.language = language;
    
    //function call to update the document by the id form document model
    const result = await Document.updateById(db, new ObjectId(req.params.id), updateData);
    
    //if no document found, return an error
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    //function call to find the updated document by the id form document model
    const updatedDocument = await Document.findById(db, new ObjectId(req.params.id));
    res.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

//delete document route
router.delete('/:id', async (req, res) => {
  try {
    //get the database reference from the request
    const db = req.app.locals.db;
    //function call to delete the document by the id form document model
    const result = await Document.deleteById(db, new ObjectId(req.params.id));
    
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

//search documents by name route
router.get('/search/:query', async (req, res) => {
  try {
    const db = req.app.locals.db;
    //function call to find the documents by the name form document model
    const documents = await Document.findByName(db, req.params.query);
    res.json(documents);
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

module.exports = router;