import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config.js';

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
  Chip,
  Stack,
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

const DocumentsPage = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeFilters, setActiveFilters] = useState([]);

  // Apply search and filters to documents
  const applyFilters = useCallback((docs) => {
    let result = [...docs];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(term) ||
        (doc.description && doc.description.toLowerCase().includes(term)) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      result = result.filter(doc => {
        const type = doc.fileType?.split('/')[0];
        return type === fileTypeFilter;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });
    
    return result;
  }, [searchTerm, fileTypeFilter, sortBy]);
  
  // Update filtered documents when documents or filters change
  useEffect(() => {
    if (documents.length > 0) {
      const filtered = applyFilters(documents);
      setFilteredDocuments(filtered);
    }
  }, [documents, applyFilters]);

  // Update active filters
  useEffect(() => {
    const newFilters = [];
    
    if (searchTerm) {
      newFilters.push({
        key: 'search',
        type: 'search',
        label: `Search: ${searchTerm}`,
        value: searchTerm
      });
    }
    
    if (fileTypeFilter !== 'all') {
      newFilters.push({
        key: 'fileType',
        type: 'fileType',
        label: `Type: ${fileTypeFilter}`,
        value: fileTypeFilter
      });
    }
    
    setActiveFilters(newFilters);
  }, [searchTerm, fileTypeFilter]);

  const fetchDocuments = useCallback(async (folderId = null) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('gts_token');
      
      // Fetch documents
      const docsResponse = await axios.get(`${API_URL}/documents`, {
        params: { folder: folderId, project: projectId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(docsResponse.data.data || []);
      
      // Fetch folders
      const foldersResponse = await axios.get(`${API_URL}/folders`, {
        params: { parent: folderId, project: projectId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(foldersResponse.data.data || []);
      
      // Update current folder if folderId is provided
      if (folderId) {
        const folderResponse = await axios.get(`${API_URL}/folders/${folderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentFolder(folderResponse.data.data);
        
        // Build breadcrumbs
        const breadcrumbs = [];
        let current = folderResponse.data.data;
        
        while (current) {
          breadcrumbs.unshift({
            id: current._id,
            name: current.name,
            type: 'folder'
          });
          
          if (current.parent) {
            const parentResponse = await axios.get(`${API_URL}/folders/${current.parent._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            current = parentResponse.data.data;
          } else {
            current = null;
          }
        }
        
        setBreadcrumbs([
          { id: 'root', name: 'Home', type: 'root' },
          ...breadcrumbs
        ]);
      } else {
        // Root level - fetch folders
        const foldersResponse = await axios.get(
          projectId 
            ? `${API_URL}/folders?project=${projectId}`
            : `${API_URL}/folders`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        setFolders(foldersResponse.data.data || []);
        setBreadcrumbs([{ id: 'root', name: 'Home', type: 'root' }]);
      }
      
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]); // Add projectId as a dependency

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [currentFolder, projectId, fetchDocuments, user]);

  const handleFolderClick = (folderId) => {
    fetchDocuments(folderId);
  };

  const handleBreadcrumbClick = (item) => {
    if (item.id === 'root') {
      fetchDocuments();
    } else {
      fetchDocuments(item.id);
    }
  };

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    fetchDocuments(currentFolder?._id);
  };

  const handleCreateFolderSuccess = () => {
    setFolderDialogOpen(false);
    fetchDocuments(currentFolder?._id);
  };

  const handleDocumentClick = (document) => {
    // Open document preview or details
    console.log('Document clicked:', document);
  };

  if (loading) {
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
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
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
                sx={{ minWidth: 250 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={fileTypeFilter}
                  label="File Type"
                  onChange={(e) => setFileTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                  <MenuItem value="application">Documents</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
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
              
              {(searchTerm || fileTypeFilter !== 'all') && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => {
                    setSearchTerm('');
                    setFileTypeFilter('all');
                    setSortBy('newest');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {activeFilters.map((filter, index) => (
                    <Chip 
                      key={index}
                      label={filter.label}
                      onDelete={() => {
                        if (filter.type === 'search') setSearchTerm('');
                        if (filter.type === 'fileType') setFileTypeFilter('all');
                        setActiveFilters(prev => prev.filter(f => f.key !== filter.key));
                      }}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            
            {/* Breadcrumbs */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 1 }}>
              {breadcrumbs.map((item, index) => (
                <Link
                  key={item.id}
                  color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleBreadcrumbClick(item);
                  }}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  {item.type === 'root' ? (
                    <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
                  ) : (
                    <FolderIcon sx={{ mr: 0.5, fontSize: 20 }} />
                  )}
                  {item.name}
                </Link>
              ))}
            </Breadcrumbs>
          </Grid>
          
          <Grid item>
            <Box sx={{ display: 'flex', gap: 2 }}>
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
                color="primary"
                startIcon={<CreateNewFolderIcon />}
                onClick={() => setFolderDialogOpen(true)}
              >
                New Folder
              </Button>
            </Box>
          </Grid>
        </Grid>

        {error && (
          <Box sx={{ mb: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        <Paper elevation={2} sx={{ p: 3, minHeight: '60vh' }}>
          <DocumentList 
            documents={filteredDocuments}
            folders={folders}
            onFolderClick={handleFolderClick}
            onDocumentClick={handleDocumentClick}
            currentFolder={currentFolder?._id}
            onRefresh={() => fetchDocuments(currentFolder?._id)}
            loading={loading}
          />
        </Paper>
      </Box>

      {/* Dialogs */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        currentFolder={currentFolder?._id}
        projectId={projectId}
      />

      <CreateFolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onSuccess={handleCreateFolderSuccess}
        currentFolder={currentFolder?._id}
        projectId={projectId}
      />
    </Container>
  );
};

export default DocumentsPage;
