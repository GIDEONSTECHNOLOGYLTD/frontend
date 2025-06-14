import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  searchDocuments, 
  getSearchSuggestions, 
  shareDocument as apiShareDocument,
  getDocumentPermissions,
  updateDocumentPermissions,
  getDocumentVersions,
  restoreDocumentVersion as apiRestoreDocumentVersion
} from '../services/api';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    tags: [],
    folder: '',
    project: '',
    fileType: ''
  });
  const [results, setResults] = useState({
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
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for debouncing
  const searchTimeoutRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  // Search for documents with current query and filters
  const search = useCallback(
    (query = searchQuery, page = 1) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        if (!query.trim()) {
          setResults({
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
          return;
        }


        setIsSearching(true);
        setError(null);

        try {
          const data = await searchDocuments(query, filters, {
            page,
            limit: results.pagination.limit,
            sortBy: '-updatedAt'
          });

          setResults({
            documents: data.documents || [],
            pagination: {
              total: data.pagination?.total || 0,
              totalPages: data.pagination?.totalPages || 0,
              currentPage: data.pagination?.currentPage || 1,
              limit: data.pagination?.limit || 10,
              hasNextPage: data.pagination?.hasNextPage || false,
              hasPreviousPage: data.pagination?.hasPreviousPage || false
            }
          });
        } catch (err) {
          console.error('Search error:', err);
          setError('Failed to perform search. Please try again.');
          setResults({
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
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [searchQuery, filters, results.pagination.limit]
  );

  // Get search suggestions
  const fetchSuggestions = useCallback(
    (query) => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }

      suggestionsTimeoutRef.current = setTimeout(async () => {
        if (!query.trim()) {
          setSuggestions([]);
          return;
        }

        try {
          const suggestions = await getSearchSuggestions(query);
          setSuggestions(suggestions);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        }
      }, 200);
    },
    []
  );

  // Update search query and trigger search
  const updateSearchQuery = useCallback(
    (query) => {
      setSearchQuery(query);
      if (query.trim()) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    },
    [fetchSuggestions]
  );

  // Update filters and trigger search
  const updateFilters = useCallback(
    (newFilters) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
      search(searchQuery, 1); // Reset to first page when filters change
    },
    [filters, search, searchQuery]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      tags: [],
      folder: '',
      project: '',
      fileType: ''
    });
  }, []);

  // Handle pagination
  const goToPage = useCallback(
    (page) => {
      search(searchQuery, page);
    },
    [search, searchQuery]
  );

  // Document sharing functions
  const shareDocument = useCallback(async (documentId, email, permission) => {
    try {
      const response = await apiShareDocument(documentId, email, permission);
      return response;
    } catch (err) {
      console.error('Error sharing document:', err);
      throw err;
    }
  }, []);

  const getDocumentSharing = useCallback(async (documentId) => {
    try {
      const response = await getDocumentPermissions(documentId);
      return response;
    } catch (err) {
      console.error('Error getting document permissions:', err);
      throw err;
    }
  }, []);

  const updateDocumentSharing = useCallback(async (documentId, permissionId, permission) => {
    try {
      const response = await updateDocumentPermissions(documentId, permissionId, permission);
      return response;
    } catch (err) {
      console.error('Error updating document permissions:', err);
      throw err;
    }
  }, []);

  // Version control functions
  const getDocumentVersionsList = useCallback(async (documentId) => {
    try {
      const versions = await getDocumentVersions(documentId);
      return versions;
    } catch (err) {
      console.error('Error getting document versions:', err);
      throw err;
    }
  }, []);

  const restoreDocumentVersion = useCallback(async (documentId, versionId) => {
    try {
      const response = await apiRestoreDocumentVersion(documentId, versionId);
      return response;
    } catch (err) {
      console.error('Error restoring document version:', err);
      throw err;
    }
  }, []);

  const value = {
    searchQuery,
    setSearchQuery: updateSearchQuery,
    filters,
    setFilters: updateFilters,
    clearFilters,
    results,
    suggestions,
    isSearching,
    error,
    search,
    fetchSuggestions,
    goToPage,
    shareDocument,
    getDocumentSharing,
    updateDocumentSharing,
    getDocumentVersions: getDocumentVersionsList,
    restoreDocumentVersion
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;
