import { renderHook, act } from '@testing-library/react-hooks';
import { SearchProvider, useSearch } from '../SearchContext';
import * as api from '../../services/api';

// Mock the API module
jest.mock('../../services/api');

describe('SearchContext', () => {
  const wrapper = ({ children }) => (
    <SearchProvider>{children}</SearchProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.filters).toEqual({
      tags: [],
      folder: '',
      project: '',
      fileType: ''
    });
    expect(result.current.results.documents).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update search query', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    act(() => {
      result.current.setSearchQuery('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
  });

  it('should update filters', async () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    const newFilters = {
      fileType: 'pdf',
      tags: ['important']
    };

    api.searchDocuments.mockResolvedValueOnce({
      documents: [],
      pagination: {
        total: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
      }
    });

    act(() => {
      result.current.setFilters(newFilters);
      result.current.search('test');
    });

    expect(api.searchDocuments).toHaveBeenCalledWith('test', newFilters, {
      page: 1,
      limit: 10,
      sortBy: '-updatedAt'
    });
  });

  it('should perform search with filters', async () => {
    const mockResults = {
      documents: [{ id: '1', name: 'Test Document' }],
      pagination: {
        total: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
    
    // Setup mock implementation
    api.searchDocuments.mockResolvedValue(mockResults);

    const { result, waitForNextUpdate } = renderHook(() => useSearch(), { wrapper });

    act(() => {
      result.current.setSearchQuery('test');
      result.current.setFilters({ fileType: 'pdf' });
      result.current.search('test');
    });

    expect(result.current.isSearching).toBe(true);
    expect(api.searchDocuments).toHaveBeenCalledWith('test', { fileType: 'pdf' }, { page: 1, limit: 10 });

    await waitForNextUpdate();

    expect(result.current.isSearching).toBe(false);
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.error).toBeNull();
  });

  it('should handle document sharing', async () => {
    const mockResponse = { success: true };
    api.shareDocument.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    await act(async () => {
      const response = await result.current.shareDocument('doc123', 'user@example.com', 'edit');
      expect(response).toEqual(mockResponse);
      expect(api.shareDocument).toHaveBeenCalledWith('doc123', 'user@example.com', 'edit');
    });
  });

  it('should handle version control operations', async () => {
    const mockVersions = [{ version: 1, timestamp: '2023-01-01' }];
    api.getDocumentVersions.mockResolvedValue(mockVersions);
    
    const { result } = renderHook(() => useSearch(), { wrapper });
    
    await act(async () => {
      const versions = await result.current.getDocumentVersions('doc123');
      expect(versions).toEqual(mockVersions);
      expect(api.getDocumentVersions).toHaveBeenCalledWith('doc123');
    });
  });

  it('should handle search errors', async () => {
    const error = new Error('Search failed');
    api.searchDocuments.mockRejectedValueOnce(error);

    const { result, waitForNextUpdate } = renderHook(() => useSearch(), { wrapper });

    await act(async () => {
      result.current.search('test');
      await waitForNextUpdate();
    });

    expect(result.current.error).toBe('Failed to perform search. Please try again.');
    expect(result.current.isSearching).toBe(false);
  });
});
