import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import api from '../services/api';

// Material-UI components
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  CircularProgress,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'; 
import SearchIcon from '@mui/icons-material/Search';

// Icons
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';

// Components
import DocumentList from '../components/documents/DocumentList';
import UploadDocumentDialog from '../components/documents/UploadDocumentDialog';
import CreateFolderDialog from '../components/documents/CreateFolderDialog';

// Main component
const DocumentsPage = () => {
  // Hooks must be called at the top level
  const { isAuthenticated } = useAuth();
  const isMounted = useRef(true);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs] = useState([{ id: 'root', name: 'Home', type: 'root' }]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true
  });
  
  // Loading states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Apply search and filters to documents (client-side fallback)
  const applyFilters = useCallback((docs, search, type, sort) => {
    let result = [...docs];
    
    // Apply search term filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        (doc.description && doc.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply file type filter
    if (type !== 'all') {
      result = result.filter(doc => doc.type === type);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sort === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sort === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
    
    return result;
  }, []);
  
  // Handle folder click
  const handleFolderClick = useCallback((folderId) => {
    setCurrentFolder(folderId);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFileTypeFilter('all');
    setSortBy('newest');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Handle search form submission
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Export handleFolderClick for use in other components if needed
  useEffect(() => {
    window.handleFolderClick = handleFolderClick;
    return () => {
      delete window.handleFolderClick;
    };
  }, [handleFolderClick]);
  
  // Cleanup on unmount
  useEffect(() => (() => {
    isMounted.current = false;
  }), []);
  
  // Fetch documents with pagination
  const fetchDocuments = useCallback(async (isLoadMore = false) => {
    if ((!isLoadMore && loading) || (isLoadMore && isLoadingMore)) return;

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await api.get('/api/documents', {
        params: {
          page: isLoadMore ? pagination.page + 1 : 1,
          limit: pagination.limit,
          folder: currentFolder?._id,
          search: searchTerm,
          type: fileTypeFilter,
          sort: sortBy
        },
        signal
      });
      
      if (!isMounted.current) return;
      
      const { data: newDocuments, total } = response.data;
      
      setPagination(prev => ({
        ...prev,
        page: isLoadMore ? prev.page + 1 : 1,
        total,
        hasMore: (isLoadMore ? documents.length : 0) + newDocuments.length < total
      }));
      
      setDocuments(prev => isLoadMore ? [...prev, ...newDocuments] : newDocuments);
      setFilteredDocuments(prev => isLoadMore ? [...prev, ...newDocuments] : newDocuments);
      
    } catch (err) {
      if (!isMounted.current || err.name === 'AbortError') return;
      setError('Failed to fetch documents');
      console.error(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
    
    return () => controller.abort();
  }, [pagination, currentFolder, searchTerm, fileTypeFilter, sortBy, loading, isLoadingMore, documents.length]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && pagination.hasMore) {
      fetchDocuments(true);
    }
  }, [isLoadingMore, pagination.hasMore, fetchDocuments]);

  // Initial fetch and refetch when dependencies change
  useEffect(() => {
    fetchDocuments();
    
    return () => {
      isMounted.current = false;
    };
  }, [currentFolder?._id, searchTerm, fileTypeFilter, sortBy, pagination.limit, fetchDocuments]);
  
  // Update filtered documents when documents or filters change
  useEffect(() => {
    if (documents.length > 0) {
      const filtered = applyFilters(documents, searchTerm, fileTypeFilter, sortBy);
      setFilteredDocuments(filtered);
    }
  }, [documents, searchTerm, fileTypeFilter, sortBy, applyFilters]);
  
  // Early return for unauthenticated users - must be after all hooks
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Get active filters for display
  const activeFilters = [];
  if (searchTerm) {
    activeFilters.push({
      key: 'search',
      label: `Search: ${searchTerm}`,
      onRemove: () => setSearchTerm('')
    });
  }
  
  if (fileTypeFilter !== 'all') {
    activeFilters.push({
      key: 'fileType',
      label: `Type: ${fileTypeFilter}`,
      onRemove: () => setFileTypeFilter('all')
    });
  }

  // Handle breadcrumb click
  const handleBreadcrumbClick = (item) => {
    if (item.id === 'root') {
      setCurrentFolder(null);
    } else {
      setCurrentFolder(item.id);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    fetchDocuments();
  };

  // Handle create folder success
  const handleCreateFolderSuccess = () => {
    setFolderDialogOpen(false);
    fetchDocuments();
  };

  // Handle document click
  const handleDocumentClick = (document) => {
    // Open document preview or details
    console.log('Document clicked:', document);
  };

  if (loading && documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom>
              Documents
            </Typography>
            
            {/* Search and Filter Bar */}
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={fileTypeFilter}
                  label="File Type"
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="doc">Word</MenuItem>
                  <MenuItem value="xls">Excel</MenuItem>
                  <MenuItem value="img">Image</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                disabled={searchTerm === '' && fileTypeFilter === 'all' && sortBy === 'newest'}
              >
                Clear Filters
              </Button>
            </Box>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {activeFilters.map(filter => (
                  <Button
                    key={filter.key}
                    size="small"
                    variant="outlined"
                    color="primary"
                    endIcon={filter.onRemove ? <span>&times;</span> : null}
                    onClick={filter.onRemove}
                    sx={{ textTransform: 'none' }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadFileIcon />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload
            </Button>
            <Button
              variant="outlined"
              startIcon={<CreateNewFolderIcon />}
              onClick={() => setFolderDialogOpen(true)}
            >
              New Folder
            </Button>
          </Grid>
        </Grid>
        
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            {breadcrumbs.map((item, index) => (
              <Link
                key={index}
                color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleBreadcrumbClick(item);
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {item.type === 'root' ? (
                  <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                ) : (
                  <FolderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                )}
                {item.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
        
        <Paper elevation={2} sx={{ p: 3, minHeight: '60vh' }}>
          {/* Document list */}
          <DocumentList 
            documents={filteredDocuments}
            loading={loading}
            onDocumentClick={handleDocumentClick}
            onFolderClick={handleFolderClick}
            showSkeleton={loading && documents.length === 0}
          />
          
          {/* Load more button */}
          {pagination.hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                startIcon={isLoadingMore ? <CircularProgress size={20} /> : null}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Dialogs */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        currentFolder={currentFolder}
      />
      
      <CreateFolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSuccess={handleCreateFolderSuccess}
        parentFolder={currentFolder}
      />
      
      {/* Error Snackbar */}
      {error && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1400 }}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: 'error.main', color: 'white' }}>
            <Typography>{error}</Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default DocumentsPage;
