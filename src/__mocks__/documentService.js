// Mock implementation of the documentService
export const searchDocuments = jest.fn().mockResolvedValue({
  documents: [],
  pagination: { total: 0, currentPage: 1, totalPages: 1, pageSize: 10 }
});

export const getDocument = jest.fn().mockResolvedValue({
  id: '1',
  name: 'Test Document',
  type: 'pdf',
  size: 1024,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const uploadDocument = jest.fn().mockResolvedValue({
  id: '1',
  name: 'Uploaded Document',
  type: 'pdf',
  size: 2048,
  url: '/uploads/test.pdf',
});

export const deleteDocument = jest.fn().mockResolvedValue(true);

export const updateDocument = jest.fn().mockImplementation((id, updates) => {
  return Promise.resolve({
    id,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
});

export const downloadDocument = jest.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }));

export const getDocumentPreviewUrl = jest.fn().mockResolvedValue('https://example.com/preview/1');

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
