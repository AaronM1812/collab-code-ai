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
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

//this is the API service class
class ApiService {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  // Helper method to get auth headers
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Helper method to refresh token
  private async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post<RefreshResponse>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Update tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return accessToken;
    } catch (error) {
      // If refresh fails, clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.reload(); // This will redirect to login
      return null;
    }
  }

  // Helper method to handle 401 errors and token refresh
  private async handleAuthError(error: any): Promise<any> {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (this.isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          this.failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      this.isRefreshing = true;

      try {
        const token = await this.refreshToken();
        if (token) {
          this.processQueue(null, token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        } else {
          this.processQueue(new Error('Token refresh failed'), null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        this.processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        this.isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }

  //get all documents
  async getDocuments(): Promise<Document[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  //get document by id
  async getDocument(id: string): Promise<Document> {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  //create new document
  async createDocument(data: CreateDocumentData): Promise<Document> {
    try {
      const response = await axios.post(`${API_BASE_URL}/documents`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  //update document
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    try {
      const response = await axios.put(`${API_BASE_URL}/documents/${id}`, data, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  //delete document
  async deleteDocument(id: string): Promise<{ message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/documents/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  //search documents by name
  async searchDocuments(query: string): Promise<Document[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/search/${query}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  //get AI suggestion for code
  async getAISuggestion(data: AISuggestionRequest): Promise<AISuggestionResponse> {
    try {
      //post request to the AI route with code and prompt
      const response = await axios.post(`${API_BASE_URL}/ai/suggest`, data, {
        headers: this.getAuthHeaders()
      });
      //send the response to the frontend
      return response.data;
    } catch (error) {
      return this.handleAuthError(error);
    }
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

  //logout user
  async logoutUser(): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      // Even if logout fails, clear local storage
      return { message: 'Logged out successfully' };
    }
  }
}

export const apiService = new ApiService(); 