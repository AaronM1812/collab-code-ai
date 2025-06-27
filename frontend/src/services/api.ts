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

//this is the structure of the request to the AI, defines the shape of the data sent to and recieved from the backend for AI suggestions, helps to catch mistakes and gives autocomplete
export interface AISuggestionRequest {
  code: string;
  prompt: string;
}

//this is the structure of the response from the AI
export interface AISuggestionResponse {
  suggestion: string;
}
//these interfaces define the shape of data for registration login and response from the backend, whih gives type safety plus automplete in the ediotr
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

//this is the API service class
class ApiService {
  // Helper method to get auth headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  //get all documents
  async getDocuments(): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  //get document by id
  async getDocument(id: string): Promise<Document> {
    const response = await axios.get(`${API_BASE_URL}/documents/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  //create new document
  async createDocument(data: CreateDocumentData): Promise<Document> {
    const response = await axios.post(`${API_BASE_URL}/documents`, data, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  //update document
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    const response = await axios.put(`${API_BASE_URL}/documents/${id}`, data, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  //delete document
  async deleteDocument(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/documents/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  //search documents by name
  async searchDocuments(query: string): Promise<Document[]> {
    const response = await axios.get(`${API_BASE_URL}/documents/search/${query}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  //get AI suggestion for code
  async getAISuggestion(data: AISuggestionRequest): Promise<AISuggestionResponse> {
    //post request to the AI route with code and prompt
    const response = await axios.post(`${API_BASE_URL}/ai/suggest`, data, {
      headers: this.getAuthHeaders()
    });
    //send the response to the frontend
    return response.data;
  }

  //send registeration data to backend and returns response
  async registerUser(data: RegisterData): Promise<{ message: string }> {
    //sends a POST request to /api/auth/register with username, email, and password  
    const response = await axios.post(`${API_BASE_URL}/auth/register`, data);
    return response.data;
  }

  //send login data to backend and returns response
  async loginUser(data: LoginData): Promise<AuthResponse> {
    //sends a POST request to /api/auth/login with email and password
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response.data;
  }
}

export const apiService = new ApiService(); 