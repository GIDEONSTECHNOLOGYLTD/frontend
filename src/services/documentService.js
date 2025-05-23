import axios from 'axios';
import { API_URL } from '../config.js';

/**
 * Search for documents
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Number of items per page
 * @param {string} params.sortBy - Field to sort by
 * @param {'asc'|'desc'} params.sortOrder - Sort order
 * @returns {Promise<Object>} Search results
 */
export const searchDocuments = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/documents/search`, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Get a document by ID
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Document data
 */
export const getDocument = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting document ${id}:`, error);
    throw error;
  }
};

/**
 * Upload a new document
 * @param {FormData} formData - Document data including file
 * @returns {Promise<Object>} Uploaded document data
 */
export const uploadDocument = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

/**
 * Update a document
 * @param {string} id - Document ID
 * @param {Object} updates - Document updates
 * @returns {Promise<Object>} Updated document data
 */
export const updateDocument = async (id, updates) => {
  try {
    const response = await axios.put(`${API_URL}/documents/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error(`Error updating document ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} id - Document ID
 * @returns {Promise<boolean>} True if successful
 */
export const deleteDocument = async (id) => {
  try {
    await axios.delete(`${API_URL}/documents/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error);
    throw error;
  }
};

/**
 * Download a document
 * @param {string} id - Document ID
 * @returns {Promise<Blob>} Document file as Blob
 */
export const downloadDocument = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error(`Error downloading document ${id}:`, error);
    throw error;
  }
};

/**
 * Get a preview URL for a document
 * @param {string} id - Document ID
 * @returns {Promise<string>} Preview URL
 */
export const getDocumentPreviewUrl = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/documents/${id}/preview`);
    return response.data.url;
  } catch (error) {
    console.error(`Error getting preview URL for document ${id}:`, error);
    throw error;
  }
};

const documentService = {
  searchDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  updateDocument,
  downloadDocument,
  getDocumentPreviewUrl,
};

export default documentService;
