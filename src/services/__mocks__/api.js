// Mock implementation of the API service
export const searchDocuments = jest.fn(() => 
  Promise.resolve({
    documents: [],
    pagination: {
      total: 0,
      totalPages: 1,
      currentPage: 1,
      limit: 10,
      hasNextPage: false,
      hasPreviousPage: false
    }
  })
);

export const getSearchSuggestions = jest.fn(() => 
  Promise.resolve([])
);

// Mock for document sharing
export const shareDocument = jest.fn(() => Promise.resolve({}));
export const getDocumentPermissions = jest.fn(() => Promise.resolve({}));
export const updateDocumentPermissions = jest.fn(() => Promise.resolve({}));

// Mock for version control
export const getDocumentVersions = jest.fn(() => Promise.resolve([]));
export const restoreDocumentVersion = jest.fn(() => Promise.resolve({}));
