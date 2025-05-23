import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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

export default api;
