//this is the class of a document, now using native monogoDB
class Document {
  //constructor to initialize the document
  constructor(data = {}) {
    this.name = data.name || '';
    this.content = data.content || '// Start coding here!';
    this.language = data.language || 'javascript';
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

  //find all documents
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

  //find documets by name (for searching)
  static async findByName(db, name) {
    //find the documents by the name
    return await db.collection('documents').find({
      name: { $regex: name, $options: 'i' }
    }).toArray();
  }
}

module.exports = Document; 