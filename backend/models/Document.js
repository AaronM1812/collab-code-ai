//this is the class of a document, now using native monogoDB
class Document {
  //constructor to initialize the document
  constructor(data = {}) {
    this.name = data.name || '';
    this.content = data.content || '// Start coding here!';
    this.language = data.language || 'javascript';
    this.userId = data.userId || null;
    this.owner = data.owner || null;
    this.collaborators = data.collaborators || [];
    this.isPublic = data.isPublic || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  //create a new document
  static async create(db, documentData) {
    //create a new document
    const document = new Document(documentData);
    //insert the document into the database
    const result = await db.collection('documents').insertOne(document);
    //return the document with the id
    return { ...document, _id: result.insertedId };
  }

  //find document by the id
  static async findById(db, id) {
    //find the document by the id
    return await db.collection('documents').findOne({ _id: id });
  }

  //find all documents for a specific user (owned + shared)
  static async findAllByUser(db, userId) {
    //find all documents where user is owner or collaborator
    return await db.collection('documents').find({
      $or: [
        { userId: userId },
        { 'collaborators.userId': userId }
      ]
    }).toArray();
  }

  //find all documents owned by a user
  static async findAllOwnedByUser(db, userId) {
    return await db.collection('documents').find({ userId: userId }).toArray();
  }

  //find all documents shared with a user
  static async findAllSharedWithUser(db, userId) {
    return await db.collection('documents').find({
      $and: [
        { 'collaborators.userId': userId },
        { userId: { $ne: userId } } // Exclude documents owned by the user
      ]
    }).toArray();
  }

  //find all documents (for admin purposes, or remove this method)
  static async findAll(db) {
    //find all documents
    return await db.collection('documents').find({}).toArray();
  }

  //update document by the id
  static async updateById(db, id, updateData) {
    const update = {
      ...updateData,
      updatedAt: new Date()
    };
    //update the document by the id
    return await db.collection('documents').updateOne(
      { _id: id },
      { $set: update }
    );
  }

  //delete document by the id
  static async deleteById(db, id) {
    //delete the document by the id
    return await db.collection('documents').deleteOne({ _id: id });
  }

  //find documents by name for a specific user
  static async findByNameAndUser(db, name, userId) {
    //find the documents by the name and user
    return await db.collection('documents').find({
      name: { $regex: name, $options: 'i' },
      $or: [
        { userId: userId },
        { 'collaborators.userId': userId }
      ]
    }).toArray();
  }

  //find documets by name (for searching) - keep for backward compatibility
  static async findByName(db, name) {
    //find the documents by the name
    return await db.collection('documents').find({
      name: { $regex: name, $options: 'i' }
    }).toArray();
  }

  //add collaborator to document
  static async addCollaborator(db, documentId, collaboratorData) {
    return await db.collection('documents').updateOne(
      { _id: documentId },
      { 
        $addToSet: { 
          collaborators: {
            userId: collaboratorData.userId,
            username: collaboratorData.username,
            email: collaboratorData.email,
            permission: collaboratorData.permission || 'read', // 'read' or 'write'
            addedAt: new Date()
          }
        }
      }
    );
  }

  //remove collaborator from document
  static async removeCollaborator(db, documentId, userId) {
    return await db.collection('documents').updateOne(
      { _id: documentId },
      { 
        $pull: { 
          collaborators: { userId: userId }
        }
      }
    );
  }

  //update collaborator permission
  static async updateCollaboratorPermission(db, documentId, userId, permission) {
    return await db.collection('documents').updateOne(
      { 
        _id: documentId,
        'collaborators.userId': userId
      },
      { 
        $set: { 
          'collaborators.$.permission': permission
        }
      }
    );
  }

  //check if user has access to document
  static async checkUserAccess(db, documentId, userId) {
    const document = await this.findById(db, documentId);
    if (!document) return null;

    // Check if user is owner
    if (document.userId === userId) {
      return { access: true, permission: 'owner' };
    }

    // Check if user is collaborator
    const collaborator = document.collaborators.find(c => c.userId === userId);
    if (collaborator) {
      return { access: true, permission: collaborator.permission };
    }

    // Check if document is public
    if (document.isPublic) {
      return { access: true, permission: 'read' };
    }

    return { access: false, permission: null };
  }
}

module.exports = Document; 