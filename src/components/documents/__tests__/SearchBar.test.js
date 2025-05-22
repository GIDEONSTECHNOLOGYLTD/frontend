import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { SearchProvider } from '../../../context/SearchContext';

// Mock the SearchContext
jest.mock('../../../context/SearchContext', () => ({
  ...jest.requireActual('../../../context/SearchContext'),
  useSearch: () => ({
    searchQuery: '',
    setSearchQuery: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    search: jest.fn(),
    suggestions: [],
    isSearching: false
  })
}));

const renderWithProviders = (ui, options = {}) => {
  return render(
    <SearchProvider>
      {ui}
    </SearchProvider>,
    options
  );
};

describe('SearchBar', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    renderWithProviders(<SearchBar />);
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
  });

  it('updates search query on input change', () => {
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input.value).toBe('test query');
  });

  it('calls search on enter key press', () => {
    const searchMock = jest.fn();
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      search: searchMock,
      searchQuery: '',
      setSearchQuery: () => {},
      filters: {},
      setFilters: () => {},
      clearFilters: () => {},
      suggestions: [],
      isSearching: false
    }));

    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(searchMock).toHaveBeenCalledWith('test');
  });

  it('shows clear button when there is text', () => {
    renderWithProviders(<SearchBar />);
    const input = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByLabelText('clear search')).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', () => {
    const setSearchQueryMock = jest.fn();
    jest.spyOn(React, 'useContext').mockImplementation(() => ({
      search: () => {},
      searchQuery: 'test',
      setSearchQuery: setSearchQueryMock,
      filters: {},
      setFilters: () => {},
      clearFilters: () => {},
      suggestions: [],
      isSearching: false
    }));

    renderWithProviders(<SearchBar />);
    const clearButton = screen.getByLabelText('clear search');
    fireEvent.click(clearButton);
    expect(setSearchQueryMock).toHaveBeenCalledWith('');
  });
});
