import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchPage } from '../SearchPage';

// Mock the SearchContext
jest.mock('../../context/SearchContext', () => ({
  ...jest.requireActual('../../context/SearchContext'),
  useSearch: () => ({
    searchQuery: '',
    setSearchQuery: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    search: jest.fn().mockResolvedValue({
      documents: [
        {
          id: '1',
          name: 'Test Document',
          description: 'This is a test document',
          tags: ['test'],
          fileType: 'pdf',
          fileSize: 1024,
          updatedAt: new Date().toISOString(),
          createdBy: { name: 'Test User' }
        }
      ],
      pagination: {
        total: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }),
    results: {
      documents: [
        {
          id: '1',
          name: 'Test Document',
          description: 'This is a test document',
          tags: ['test'],
          fileType: 'pdf',
          fileSize: 1024,
          updatedAt: new Date().toISOString(),
          createdBy: { name: 'Test User' }
        }
      ],
      pagination: {
        total: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false
      }
    },
    isSearching: false,
    error: null,
    suggestions: [],
    getSuggestions: jest.fn()
  })
}));

// Mock the DocumentCard component
jest.mock('../../components/documents/DocumentCard', () => ({
  __esModule: true,
  default: ({ document }) => (
    <div data-testid="document-card">
      <h3>{document.name}</h3>
      <p>{document.description}</p>
    </div>
  )
}));

// Mock the SearchBar component
jest.mock('../../components/documents/SearchBar', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="search-bar">
      <input data-testid="search-input" />
      <button data-testid="search-button">Search</button>
    </div>
  )
}));

const renderSearchPage = () => {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>
  );
};

describe('SearchPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders search page with initial state', async () => {
    renderSearchPage();
    
    // Check if search bar is rendered
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    
    // Check if document card is rendered with mock data
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.getByText('This is a test document')).toBeInTheDocument();
    });
  });
  
  it('handles search functionality', async () => {
    renderSearchPage();
    
    // Simulate typing in the search input
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Simulate clicking the search button
    const searchButton = screen.getByTestId('search-button');
    fireEvent.click(searchButton);
    
    // Check if search was called with the right query
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    
    // Submit the search
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    // Check if loading state is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    
    // Check if the document details are displayed
    expect(screen.getByText('This is a test document')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    renderSearchPage();
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('testing')).toBeInTheDocument();
      expect(screen.getByText('test document')).toBeInTheDocument();
    });
  });

  it('applies filters and updates search', async () => {
    renderSearchPage();
    
    // Open filters
    const filterButton = screen.getByLabelText('filters');
    fireEvent.click(filterButton);
    
    // Select PDF file type
    const fileTypeSelect = screen.getByLabelText('File Type');
    fireEvent.mouseDown(fileTypeSelect);
    const pdfOption = screen.getByText('PDF');
    fireEvent.click(pdfOption);
    
    // Apply filters
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);
    
    // Check if search was called with the correct filters
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search/documents'),
        expect.objectContaining({
          params: expect.objectContaining({
            fileType: 'pdf'
          })
        })
      );
    });
  });

  it('handles errors gracefully', async () => {
    // Mock an error response
    axios.get.mockRejectedValueOnce(new Error('Network Error'));
    
    renderSearchPage();
    
    // Perform a search
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'error' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('Failed to perform search. Please try again.')).toBeInTheDocument();
    });
  });
});
