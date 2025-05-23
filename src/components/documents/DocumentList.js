import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_URL } from '../../config.js';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Card,
  CardActionArea,
  Chip,
  Tooltip
} from '@mui/material';

// Icons
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Components
import DocumentPreview from './DocumentPreview';

const DocumentList = ({
  documents = [],
  folders = [],
  onFolderClick,
  onDocumentClick,
  onRefresh,
  currentFolder = null,
  loading = false
}) => {
  const [previewDocument, setPreviewDocument] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Handle loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Handle empty state
  const hasNoContent = documents.length === 0 && folders.length === 0;
  if (hasNoContent) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="textSecondary">
          {currentFolder ? 'This folder is empty' : 'No documents found'}
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          {currentFolder ? 'Upload files or create subfolders to get started' : 'Upload your first document to get started'}
        </Typography>
      </Box>
    );
  }

  const handleMenuOpen = (event, item, type) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem({ ...item, type });
  };

    const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDocumentClick = (document) => {
    // Open preview for supported file types
    const supportedTypes = ['image/', 'application/pdf'];
    if (supportedTypes.some(type => document.fileType.startsWith(type))) {
      setPreviewDocument(document);
    }
    onDocumentClick && onDocumentClick(document);
  };

  const handleEditDocument = (document) => {
    // TODO: Implement document edit functionality
    console.log('Edit document:', document);
  };

  const handleDeleteDocument = async (document) => {
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      try {
        const token = localStorage.getItem('gts_token');
        await axios.delete(`${API_URL}/documents/${document._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        onRefresh && onRefresh();
      } catch (error) {
        console.error('Error deleting document:', error);
        // TODO: Show error notification
      }
    }
  };

  const handleShareDocument = (document) => {
    // TODO: Implement document sharing
    console.log('Share document:', document);
  };
  
  const handleDownload = async (document) => {
    try {
      const token = localStorage.getItem('gts_token');
      const response = await axios.get(`${API_URL}/documents/${document._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // TODO: Show error notification
    }
  };

  const handleAction = async (action) => {
    handleMenuClose();
    
    if (!selectedItem) return;
    
    try {
      const token = localStorage.getItem('gts_token');
      
      switch (action) {
        case 'download':
          const response = await axios.get(`${API_URL}/documents/${selectedItem._id}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          });
          
          // Create a temporary URL for the blob
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', selectedItem.name);
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
          break;
          
        case 'delete':
          // Handle delete
          console.log('Delete:', selectedItem);
          break;
          
        case 'edit':
          // Handle edit
          console.log('Edit:', selectedItem);
          break;
          
        case 'share':
          // Handle share
          console.log('Share:', selectedItem);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      // You might want to show an error message to the user here
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <InsertDriveFileIcon />;
    
    const type = fileType.split('/')[0];
    const extension = fileType.split('/')[1];
    
    switch (type) {
      case 'image':
        return <InsertDriveFileIcon color="primary" />;
      case 'application':
        if (['pdf'].includes(extension)) {
          return <InsertDriveFileIcon color="error" />;
        } else if (['msword', 'vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(extension)) {
          return <InsertDriveFileIcon color="info" />;
        } else if (['vnd.ms-excel', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(extension)) {
          return <InsertDriveFileIcon sx={{ color: 'success.main' }} />;
        } else if (['vnd.ms-powerpoint', 'vnd.openxmlformats-officedocument.presentationml.presentation'].includes(extension)) {
          return <InsertDriveFileIcon color="warning" />;
        }
        return <InsertDriveFileIcon />;
      default:
        return <InsertDriveFileIcon />;
    }
  };



  return (
    <Box>
      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          open={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          document={previewDocument}
          onDownload={handleDownload}
          onEdit={handleEditDocument}
          onDelete={handleDeleteDocument}
          onShare={handleShareDocument}
          onDocumentUpdated={() => {
            // Refresh the document list to reflect changes
            onRefresh && onRefresh();
          }}
        />
      )}
      {/* Folders */}
      {folders.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            Folders
          </Typography>
          <Grid container spacing={2}>
            {folders.map((folder) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={folder._id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 3,
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => onFolderClick && onFolderClick(folder._id)}
                >
                  <CardActionArea sx={{ flexGrow: 1, p: 2 }}>
                    <Box display="flex" alignItems="center">
                      <FolderIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                      <Box flexGrow={1}>
                        <Box display="flex" alignItems="center">
                          <Typography variant="subtitle1" noWrap>
                            {folder.name}
                          </Typography>
                          {folder.fileType.startsWith('image/') || folder.fileType === 'application/pdf' ? (
                            <Tooltip title="Click to preview">
                              <VisibilityIcon color="action" fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                            </Tooltip>
                          ) : null}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {folder.documentCount || 0} items
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, folder, 'folder')}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            {folders.length > 0 ? 'Files' : 'Documents'}
          </Typography>
          <Grid container spacing={2}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc._id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 3,
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => handleDocumentClick(doc)}
                >
                  <CardActionArea sx={{ flexGrow: 1, p: 2 }}>
                    <Box display="flex" alignItems="center">
                      <Box sx={{ mr: 2 }}>
                        {getFileIcon(doc.fileType)}
                      </Box>
                      <Box flexGrow={1} minWidth={0}>
                        <Box display="flex" alignItems="center">
                          <Typography variant="subtitle1" noWrap>
                            {doc.name}
                          </Typography>
                          {doc.fileType.startsWith('image/') || doc.fileType === 'application/pdf' ? (
                            <Tooltip title="Click to preview">
                              <VisibilityIcon color="action" fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                            </Tooltip>
                          ) : null}
                        </Box>
                        <Typography variant="subtitle1" noWrap>
                          {doc.name}
                        </Typography>
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {formatFileSize(doc.fileSize)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" mx={1}>•</Typography>
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        {doc.tags && doc.tags.length > 0 && (
                          <Box mt={1}>
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                            {doc.tags.length > 2 && (
                              <Chip
                                label={`+${doc.tags.length - 2}`}
                                size="small"
                                sx={{ mb: 0.5 }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, doc, 'document');
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedItem?.type === 'document' && (
          <>
            <MenuItem onClick={() => handleAction('download')}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <ShareIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Share</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction('edit')}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          </>
        )}
        
        {selectedItem?.type === 'folder' && (
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem 
          onClick={() => handleAction('delete')}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

DocumentList.propTypes = {
  documents: PropTypes.array,
  folders: PropTypes.array,
  onFolderClick: PropTypes.func,
  onDocumentClick: PropTypes.func,
  onRefresh: PropTypes.func,
  currentFolder: PropTypes.string,
  loading: PropTypes.bool
};

export default DocumentList;
