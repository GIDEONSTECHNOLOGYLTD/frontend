import React, { useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { Container, Box, Typography } from '@mui/material';
import SearchBar from '../components/documents/SearchBar';
import SearchResults from '../components/documents/SearchResults';

const SearchPage = () => {
  const { searchQuery, search } = useSearch();

  // Initial search when component mounts or search query changes
  useEffect(() => {
    if (searchQuery) {
      search();
    }
  }, [searchQuery, search]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Documents
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Find documents by name, content, or tags. Use filters to narrow down your search results.
        </Typography>
        <SearchBar />
      </Box>
      
      <SearchResults />
    </Container>
  );
};

export default SearchPage;
