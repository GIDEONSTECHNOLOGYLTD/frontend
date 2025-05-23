import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://gideons-tech-suite.onrender.com/api/v1' 
    : 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies, authorization headers with HTTPS
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('No authentication token found'));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh-token`,
            { refreshToken }
          );
          
          const { token, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    // If the error is 401 and we already tried to refresh, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Search for documents with optional filters
 * @param {string} query - Search query string
 * @param {Object} filters - Additional filters (tags, folder, project, fileType)
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Search results with pagination
 */
export const searchDocuments = async (query = '', filters = {}, options = {}) => {
  const params = new URLSearchParams();
  
  // Add search query if provided
  if (query) {
    params.append('q', query);
  }
  
  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value) && value.length > 0) {
        params.append(key, value.join(','));
      } else if (typeof value === 'string' && value.trim() !== '') {
        params.append(key, value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        params.append(key, value.toString());
      }
    }
  });
  
  // Add pagination and sorting options
  const { page = 1, limit = 10, sortBy = '-updatedAt' } = options;
  params.append('page', page);
  params.append('limit', limit);
  params.append('sortBy', sortBy);
  
  try {
    const response = await api.get('/search/documents', { params });
    return response.data;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Get search suggestions based on query
 * @param {string} query - Search query string
 * @returns {Promise<Array>} Array of search suggestions
 */
export const getSearchSuggestions = async (query) => {
  if (!query || query.trim() === '') {
    return [];
  }
  
  try {
    const response = await api.get('/search/suggestions', {
      params: { q: query }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Share a document with other users
 * @param {string} documentId - ID of the document to share
 * @param {string} userId - ID of the user to share with
 * @param {string} permission - Permission level ('view', 'edit', 'manage')
 * @returns {Promise<Object>} Response from the API
 */
export const shareDocument = async (documentId, userId, permission = 'view') => {
  try {
    const response = await api.post(`/documents/${documentId}/share`, {
      userId,
      permission
    });
    return response.data;
  } catch (error) {
    console.error('Error sharing document:', error);
    throw error;
  }
};

/**
 * Get permissions for a specific document
 * @param {string} documentId - ID of the document
 * @returns {Promise<Object>} Document permissions
 */
export const getDocumentPermissions = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}/permissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document permissions:', error);
    throw error;
  }
};

/**
 * Update permissions for a specific document
 * @param {string} documentId - ID of the document
 * @param {Object} permissions - New permissions object
 * @returns {Promise<Object>} Updated document permissions
 */
export const updateDocumentPermissions = async (documentId, permissions) => {
  try {
    const response = await api.put(`/documents/${documentId}/permissions`, permissions);
    return response.data;
  } catch (error) {
    console.error('Error updating document permissions:', error);
    throw error;
  }
};

/**
 * Get version history for a specific document
 * @param {string} documentId - ID of the document
 * @returns {Promise<Array>} Array of document versions
 */
export const getDocumentVersions = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}/versions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document versions:', error);
    throw error;
  }
};

/**
 * Restore a specific version of a document
 * @param {string} documentId - ID of the document
 * @param {string} versionId - ID of the version to restore
 * @returns {Promise<Object>} Restored document data
 */
export const restoreDocumentVersion = async (documentId, versionId) => {
  try {
    const response = await api.post(`/documents/${documentId}/versions/${versionId}/restore`);
    return response.data;
  } catch (error) {
    console.error('Error restoring document version:', error);
    throw error;
  }
};

export default api;
