import axios from 'axios';

// Constants
const API_TIMEOUT = 15000; // 15 seconds

// Helper function to get cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Helper function to create a cancellable request
const createCancellableRequest = () => {
  const source = axios.CancelToken.source();
  
  const cancel = (message = 'Request cancelled by the user') => {
    source.cancel(message);
  };

  return {
    cancel,
    token: source.token
  };
};

// Helper function to handle API errors consistently
const handleApiError = (error) => {
  if (error.isCancelled) {
    return Promise.reject(error);
  }

  // Handle network errors
  if (error.isNetworkError) {
    return Promise.reject({
      message: error.message || 'Network error occurred',
      isNetworkError: true,
      originalError: error.originalError
    });
  }

  // Handle authentication errors
  if (error.isAuthError) {
    return Promise.reject({
      message: error.message || 'Authentication required',
      isAuthError: true,
      statusCode: error.statusCode
    });
  }

  // Handle validation errors
  if (error.response?.status === 422) {
    return Promise.reject({
      message: 'Validation failed',
      isValidationError: true,
      errors: error.response.data?.errors || {},
      statusCode: 422
    });
  }

  // Handle server errors
  if (error.response?.status >= 500) {
    return Promise.reject({
      message: 'Server error occurred. Please try again later.',
      isServerError: true,
      statusCode: error.response.status,
      originalError: error
    });
  }

  // Handle other errors
  return Promise.reject({
    message: error.response?.data?.message || 'An unexpected error occurred',
    statusCode: error.response?.status,
    originalError: error
  });
};

// Export utility functions
export { createCancellableRequest, handleApiError };

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5005/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true,
  timeout: API_TIMEOUT,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  validateStatus: function (status) {
    // Resolve for all status codes less than 500
    return status < 500;
  }
});

// Debug log API configuration
if (process.env.NODE_ENV === 'development') {
  console.log('API Configuration:', {
    baseURL: api.defaults.baseURL,
    timeout: api.defaults.timeout,
    withCredentials: api.defaults.withCredentials
  });
}

// Request interceptor for adding auth token and request tracking
api.interceptors.request.use(
  (config) => {
    // Create a new CancelToken for each request
    const source = axios.CancelToken.source();
    config.cancelToken = source.token;

    // Add request timestamp for timeout handling
    config.metadata = { 
      startTime: new Date(),
      retryCount: 0,
      source
    };

    // Add CORS headers for all requests
    config.headers['Access-Control-Allow-Origin'] = window.location.origin;
    config.headers['Access-Control-Allow-Credentials'] = 'true';

    // Check if this is an auth or health check endpoint
    const isAuthEndpoint = config.url.includes('/auth/') || 
                         config.url.endsWith('/auth') ||
                         config.url.includes('/health');
                         
    // Add CSRF token for non-GET requests
    if (config.method !== 'get' && config.method !== 'head' && config.method !== 'options') {
      const csrfToken = getCookie('XSRF-TOKEN');
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists and it's not an auth endpoint, add it to the headers
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking if not already set
    if (!config.headers['x-request-id']) {
      config.headers['x-request-id'] = crypto.randomUUID();
    }

    // Add CORS headers for non-simple requests
    if (config.method !== 'get' && config.method !== 'head') {
      config.headers['Content-Type'] = 'application/json';
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API]', config.method.toUpperCase(), config.url, {
        params: config.params,
        data: config.data,
        headers: config.headers
      });
    }

    return config;
  },
  (error) => {
    // Handle request error
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Request Error:', error);
    }
    return Promise.reject(handleApiError(error));
  }
);

// Response interceptor for handling responses and errors
api.interceptors.response.use(
  (response) => {
    // Log successful API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
        headers: response.headers
      });
    }
    
    // Return the response data directly for successful responses
    return response.data;
  },
  (error) => {
    // Enhanced error handling
    const errorResponse = {
      message: 'An error occurred',
      isNetworkError: false,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error
    };

    // Handle network errors (no response from server)
    if (!error.response) {
      errorResponse.message = 'Unable to connect to the server. Please check your internet connection.';
      errorResponse.isNetworkError = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Network Error:', error.message);
      }
      
      return Promise.reject(handleApiError(errorResponse));
    }

    // Handle HTTP status codes
    const { status } = error.response;
    const { statusText, data } = error.response;
    const endTime = new Date();
    const duration = error.config?.metadata?.startTime 
      ? endTime - error.config.metadata.startTime 
      : 0;

    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API] ${status} ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'unknown-url'} (${duration}ms)`, {
        status,
        statusText,
        data,
        error: error.message,
        config: error.config
      });
    }

    // Handle different HTTP status codes
    switch (status) {
      case 400:
        errorResponse.message = data?.message || 'Bad request';
        break;
        
      case 401:
        errorResponse.message = data?.message || 'Your session has expired. Please log in again.';
        errorResponse.isAuthError = true;
        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          const returnUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?sessionExpired=true&returnUrl=${encodeURIComponent(returnUrl)}`;
        }
        break;
        
      case 403:
        errorResponse.message = 'You do not have permission to perform this action';
        errorResponse.isForbidden = true;
        break;
        
      case 404:
        errorResponse.message = 'The requested resource was not found';
        errorResponse.isNotFound = true;
        break;
        
      case 422:
        errorResponse.message = 'Validation failed';
        errorResponse.isValidationError = true;
        errorResponse.errors = data?.errors || {};
        break;
        
      case 429:
        errorResponse.message = 'Too many requests. Please try again later.';
        errorResponse.isRateLimited = true;
        break;
        
      case 500:
        errorResponse.message = 'An unexpected server error occurred. Please try again later.';
        errorResponse.isServerError = true;
        break;
        
      default:
        errorResponse.message = data?.message || 'An error occurred';
    }
    
    // Return the error response
    return Promise.reject(handleApiError(errorResponse));
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

// Audit Logs API
const auditLogs = {
  /**
   * Get audit logs with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} [params.action] - Filter by action type
   * @param {string} [params.entity] - Filter by entity type
   * @param {string} [params.status] - Filter by status (success/failure)
   * @param {string} [params.search] - Search query
   * @param {Date} [params.startDate] - Start date for filtering
   * @param {Date} [params.endDate] - End date for filtering
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @returns {Promise<Object>} Audit logs with pagination
   */
  getAuditLogs: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          queryParams.append(key, value.toISOString());
        } else {
          queryParams.append(key, value);
        }
      }
    });
    
    return api.get(`/admin/audit-logs?${queryParams.toString()}`);
  },
  
  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Promise<Object>} Audit log details
   */
  getAuditLogById: (id) => {
    return api.get(`/admin/audit-logs/${id}`);
  },
  
  /**
   * Get current user's audit logs
   * @param {Object} params - Query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=20] - Items per page
   * @returns {Promise<Object>} User's audit logs with pagination
   */
  getMyAuditLogs: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    return api.get(`/admin/audit-logs/me?${queryParams.toString()}`);
  },
  
  /**
   * Get audit log statistics
   * @returns {Promise<Object>} Audit log statistics
   */
  getAuditStats: () => {
    return api.get('/admin/audit-logs/stats');
  }
};

// Email Settings API
const settings = {
  /**
   * Get email settings
   * @returns {Promise<Object>} Email settings
   */
  getEmailSettings: async () => {
    const response = await api.get('/admin/settings/email');
    return response.data;
  },

  /**
   * Update email settings
   * @param {Object} settings - Email settings to update
   * @returns {Promise<Object>} Updated email settings
   */
  updateEmailSettings: async (settings) => {
    const response = await api.put('/admin/settings/email', settings);
    return response.data;
  },

  /**
   * Send test email
   * @param {string} email - Email address to send test to
   * @returns {Promise<Object>} Test email result
   */
  sendTestEmail: async (email) => {
    const response = await api.post('/admin/settings/email/test', { email });
    return response.data;
  },

  /**
   * Test email connection with current settings
   * @returns {Promise<Object>} Test connection result
   */
  testEmailConnection: async () => {
    const response = await api.post('/admin/settings/email/test-connection');
    return response.data;
  }
};

export { auditLogs, settings };

export default api;
