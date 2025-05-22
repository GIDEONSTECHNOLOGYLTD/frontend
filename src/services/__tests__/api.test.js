import axios from 'axios';
import { searchDocuments, getSearchSuggestions } from '../api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const mockToken = 'test-token';

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => mockToken),
    };
    global.localStorage = localStorageMock;
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('searchDocuments', () => {
    it('makes a GET request to search documents with correct parameters', async () => {
      const mockResponse = {
        data: {
          documents: [],
          pagination: {
            total: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 10
          }
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);

      const query = 'test';
      const filters = { tags: ['tag1'], fileType: 'pdf' };
      const options = { page: 1, limit: 10 };

      const result = await searchDocuments(query, filters, options);

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/search/documents`,
        {
          params: {
            q: query,
            tags: 'tag1',
            fileType: 'pdf',
            page: 1,
            limit: 10
          },
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('handles errors gracefully', async () => {
      const errorMessage = 'Network Error';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(searchDocuments('test')).rejects.toThrow(errorMessage);
    });
  });

  describe('getSearchSuggestions', () => {
    it('makes a GET request to get search suggestions', async () => {
      const mockResponse = {
        data: {
          suggestions: ['test', 'testing', 'test document']
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);

      const query = 'test';
      const result = await getSearchSuggestions(query);

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/search/suggestions`,
        {
          params: { q: query },
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );
      expect(result).toEqual(mockResponse.data.suggestions);
    });
  });
});
