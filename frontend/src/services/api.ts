import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Document {
  _id: string;
  name: string;
  content: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentData {
  name: string;
  content?: string;
  language?: string;
}

export interface UpdateDocumentData {
  name?: string;
  content?: string;
  language?: string;
}

// API service class
class ApiService {
  // Get all documents
  async getDocuments(): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents`);
    return response.data;
  }

  // Get document by ID
  async getDocument(id: string): Promise<Document> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`);
    return response.data;
  }

  // Create new document
  async createDocument(data: CreateDocumentData): Promise<Document> {
    const response = await axios.post(`${API_BASE_URL}/documents`, data);
    return response.data;
  }

  // Update document
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    const response = await axios.put(`${API_BASE_URL}/documents/${id}`, data);
    return response.data;
  }

  // Delete document
  async deleteDocument(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/documents/${id}`);
    return response.data;
  }

  // Search documents by name
  async searchDocuments(query: string): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/search/${query}`);
    return response.data;
  }
}

export const apiService = new ApiService(); 