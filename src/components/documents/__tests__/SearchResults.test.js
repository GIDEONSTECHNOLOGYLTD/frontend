import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SearchResults from '../SearchResults';

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 days ago'
}));

// Mock Material-UI components with simplified implementations
jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material');
  return {
    ...original,
    LinearProgress: () => <div data-testid="loading-indicator">Loading...</div>,
    Typography: ({ children }) => <div>{children}</div>,
    Box: ({ children }) => <div>{children}</div>,
    Card: ({ children }) => <div className="card">{children}</div>,
    CardContent: ({ children }) => <div className="card-content">{children}</div>,
    CardActionArea: ({ children }) => <div className="card-action-area">{children}</div>,
    CardActions: ({ children }) => <div className="card-actions">{children}</div>,
    Chip: ({ label }) => <span className="chip">{label}</span>,
    Pagination: () => <nav className="pagination">Pagination</nav>,
    Stack: ({ children }) => <div className="stack">{children}</div>,
    useMediaQuery: () => false,
  };
});

// Mock Material-UI icons
jest.mock('@mui/icons-material', () => ({
  InsertDriveFile: () => '📄',
  Folder: () => '📁',
  Person: () => '👤',
  Schedule: () => '⏰',
  SearchOff: () => '🔍',
}));

// Mock the SearchContext
const mockUseSearch = jest.fn();
const mockGoToPage = jest.fn();

jest.mock('../../../context/SearchContext', () => ({
  ...jest.requireActual('../../../context/SearchContext'),
  useSearch: () => mockUseSearch(),
}));

// Helper function to create test documents
const createTestDocument = (overrides = {}) => ({
  _id: Math.random().toString(36).substr(2, 9),
  name: 'Test Document',
  description: 'This is a test document',
  tags: ['test', 'document'],
  createdBy: { name: 'Test User', _id: 'user1' },
  fileType: 'pdf',
  fileSize: 1024,
  folder: null,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Create a custom theme for testing
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  spacing: (factor) => `${0.25 * factor}rem`,
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
});

// Helper function to render the component with the necessary providers
const renderSearchResults = async (customProps = {}) => {
  const defaultProps = {
    results: {
      documents: [],
      pagination: {
        total: 0,
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
      },
    },
    isSearching: false,
    error: null,
    searchDocuments: jest.fn(),
    setQuery: jest.fn(),
    setFilters: jest.fn(),
    setSort: jest.fn(),
    setPage: jest.fn(),
    setPageSize: jest.fn(),
    ...customProps,
  };
  
  mockUseSearch.mockReturnValue(defaultProps);
  
  let renderResult;
  await act(async () => {
    renderResult = render(
      <ThemeProvider theme={theme}>
        <SearchResults />
      </ThemeProvider>
    );
  });
  return renderResult;
};

describe('SearchResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await renderSearchResults();
    expect(screen.getByText('No documents found')).toBeInTheDocument();
  });

  it('displays loading state', async () => {
    await renderSearchResults({ isSearching: true });
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('displays error message', async () => {
    const errorMessage = 'Failed to load documents';
    await renderSearchResults({ error: errorMessage });
    expect(screen.getByText(errorMessage, { exact: false })).toBeInTheDocument();
  });

  it('displays document information', async () => {
    const testDocument = createTestDocument();
    await renderSearchResults({
      results: {
        documents: [testDocument],
        pagination: {
          total: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10,
        },
      },
    });

    // Check for main document information
    expect(screen.getByText(testDocument.name)).toBeInTheDocument();
    expect(screen.getByText(testDocument.description)).toBeInTheDocument();
    
    // Check for tags
    testDocument.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
    
    // Check for user information
    expect(screen.getByText(testDocument.createdBy.name)).toBeInTheDocument();
    expect(screen.getByText('👤')).toBeInTheDocument();
    
    // Check for date and size
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    
    // Check for file type
    expect(screen.getByText(testDocument.fileType.toUpperCase())).toBeInTheDocument();
  });

  it('handles different document types', async () => {
    const testCases = [
      { type: 'pdf', expectedDisplay: 'PDF' },
      { type: 'docx', expectedDisplay: 'DOCX' },
      { type: 'xlsx', expectedDisplay: 'XLSX' },
      { type: 'jpg', expectedDisplay: 'JPG' },
    ];

    for (const { type, expectedDisplay } of testCases) {
      const testDocument = createTestDocument({ fileType: type });
      await renderSearchResults({
        results: {
          documents: [testDocument],
          pagination: {
            total: 1,
            currentPage: 1,
            totalPages: 1,
            pageSize: 10,
          },
        },
      });

      // Check that the file type is displayed in uppercase
      expect(screen.getByText(expectedDisplay)).toBeInTheDocument();
      
      // Clean up
      await act(async () => {
        render(null);
      });
    }
  });

  it('handles long document names and descriptions', async () => {
    const longName = 'a'.repeat(200);
    const longDescription = 'b'.repeat(500);
    
    const testDocument = createTestDocument({
      name: longName,
      description: longDescription
    });
    
    await renderSearchResults({
      results: {
        documents: [testDocument],
        pagination: {
          total: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10,
        },
      },
    });

    // Check that the component renders the full text (not truncated in the DOM)
    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('displays pagination when there are multiple pages', async () => {
    const documents = Array(15).fill().map((_, i) => 
      createTestDocument({ _id: `doc-${i}`, name: `Document ${i + 1}` })
    );
    
    await renderSearchResults({
      results: {
        documents,
        pagination: {
          total: 15,
          currentPage: 1,
          totalPages: 2,
          pageSize: 10,
        },
      },
    });

    expect(screen.getByText('Pagination')).toBeInTheDocument();
  });

  it('handles documents with missing optional fields', async () => {
    const minimalDocument = {
      _id: 'min-doc',
      name: 'Minimal Document',
      createdBy: { name: 'System' },
      fileType: 'txt',
      fileSize: 100,
      updatedAt: new Date().toISOString(),
    };
    
    await renderSearchResults({
      results: {
        documents: [minimalDocument],
        pagination: {
          total: 1,
          currentPage: 1,
          totalPages: 1,
          pageSize: 10,
        },
      },
    });

    expect(screen.getByText(minimalDocument.name)).toBeInTheDocument();
    expect(screen.getByText(minimalDocument.createdBy.name)).toBeInTheDocument();
  });
});
