import React, { useState, useEffect, useCallback } from 'react';
// Redux dispatch is not currently used in this component
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Fullscreen as FullscreenIcon, 
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import DocumentVersionHistory from './DocumentVersionHistory';
import ShareDocumentDialog from './ShareDocumentDialog';
import TagManager from './TagManager';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `document-tab-${index}`,
    'aria-controls': `document-tabpanel-${index}`,
  };
}

const DocumentPreview = ({
  open,
  onClose,
  document,
  onDownload,
  onEdit,
  onDelete,
  onDocumentUpdated
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [error, setError] = useState('');

  // Load document preview
  useEffect(() => {
    if (!open || !document) return;
    
    const loadPreview = async () => {
      setLoading(true);
      try {
        const response = await fetch(document.fileUrl);
        const blob = await response.blob();
        
        if (document.fileType.startsWith('image/') || document.fileType === 'application/pdf') {
          setPreviewContent(URL.createObjectURL(blob));
        } else {
          setPreviewContent(null);
        }
        setError('');
      } catch (err) {
        console.error('Error loading preview:', err);
        setError('Failed to load document preview');
        setPreviewContent(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadPreview();
    
    return () => {
      if (previewContent) {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [open, document, previewContent]);

  const handleDocumentUpdated = useCallback((updatedDocument) => {
    if (onDocumentUpdated) {
      onDocumentUpdated(updatedDocument);
    }
  }, [onDocumentUpdated]);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
    handleCloseMenu();
  };

  const handleShareClose = () => {
    setShowShareDialog(false);
  };

  const handleVersionHistoryOpen = () => {
    setShowVersionHistory(true);
    handleCloseMenu();
  };

  const handleEdit = () => {
    handleCloseMenu();
    onEdit && onEdit();
  };

  const handleDelete = () => {
    handleCloseMenu();
    onDelete && onDelete();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocumentContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      );
    }


    if (error) {
      return (
        <Box textAlign="center" p={4}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (!previewContent) {
      return (
        <Box textAlign="center" p={4}>
          <Typography variant="body1">
            Preview not available for this file type.
          </Typography>
        </Box>
      );
    }

    if (document.fileType.startsWith('image/')) {
      return (
        <Box display="flex" justifyContent="center" p={2}>
          <img 
            src={previewContent} 
            alt={document.name}
            style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </Box>
      );
    }

    if (document.fileType === 'application/pdf') {
      return (
        <Box height="70vh">
          <iframe
            src={previewContent}
            title={document.name}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      );
    }

    return (
      <Box p={2}>
        <Typography variant="body1">
          Preview not available for this file type.
        </Typography>
      </Box>
    );
  };

  if (!document) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        style: {
          height: isFullscreen ? '100%' : '90vh',
          maxHeight: '90vh',
          width: isFullscreen ? '100%' : '90vw',
          maxWidth: '1200px',
          margin: isFullscreen ? 0 : '32px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        padding: '8px 16px 8px 24px'
      }}>
        <Typography variant="h6" noWrap sx={{ flex: 1, mr: 2 }}>
          {document.name}
        </Typography>
        <Box display="flex" alignItems="center">
          <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <IconButton
              onClick={() => setIsFullscreen(!isFullscreen)}
              size="small"
              sx={{ mr: 1 }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <Paper square sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" px={2}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              aria-label="document tabs"
            >
              <Tab label="Preview" {...a11yProps(0)} />
              <Tab label="Details" {...a11yProps(1)} />
              <Tab label="Tags" {...a11yProps(2)} />
            </Tabs>
            <Box display="flex" alignItems="center">
              <Tooltip title="Download">
                <IconButton
                  onClick={() => onDownload && onDownload(document)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton
                  onClick={handleShareClick}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="More actions">
                <IconButton
                  onClick={handleMenuClick}
                  size="small"
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
        
        <Box flex={1} overflow="auto">
          <TabPanel value={tabValue} index={0}>
            {renderDocumentContent()}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box p={3}>
              <Typography variant="subtitle1" gutterBottom>
                {document.description || 'No description available'}
              </Typography>
              <Box mt={3}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Document Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="grid" gridTemplateColumns="150px 1fr" gap={2}>
                  <Typography variant="body2" color="textSecondary">File Name:</Typography>
                  <Typography variant="body2">{document.name}</Typography>
                  
                  <Typography variant="body2" color="textSecondary">File Type:</Typography>
                  <Typography variant="body2">{document.fileType}</Typography>
                  
                  <Typography variant="body2" color="textSecondary">File Size:</Typography>
                  <Typography variant="body2">{formatFileSize(document.fileSize)}</Typography>
                  
                  <Typography variant="body2" color="textSecondary">Created:</Typography>
                  <Typography variant="body2">
                    {document.createdAt ? new Date(document.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary">Last Modified:</Typography>
                  <Typography variant="body2">
                    {document.updatedAt ? new Date(document.updatedAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
              
              {document.versions && document.versions.length > 1 && (
                <Box mt={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Version History
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={handleVersionHistoryOpen}
                    >
                      View All
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    Current Version: {document.currentVersion || '1'}
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Box p={3}>
              <TagManager 
                documentId={document._id} 
                documentTags={document.tags || []} 
                onTagsUpdate={handleDocumentUpdated}
              />
            </Box>
          </TabPanel>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 2, py: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
          <Box>
            {document.tags && document.tags.length > 0 && (
              <Box display="flex" gap={1} flexWrap="wrap">
                {document.tags.map((tag, index) => (
                  <Box 
                    key={index}
                    component="span"
                    sx={{
                      bgcolor: tag.color || 'primary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                  >
                    {tag.name || tag}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          <Box>
            <Button onClick={onClose} color="primary">
              Close
            </Button>
          </Box>
        </Box>
      </DialogActions>
      
      {/* Share Document Dialog */}
      {showShareDialog && (
        <ShareDocumentDialog
          open={showShareDialog}
          onClose={handleShareClose}
          documentId={document._id}
          onShareSuccess={handleDocumentUpdated}
        />
      )}
      
      {/* Version History Dialog */}
      {showVersionHistory && (
        <DocumentVersionHistory
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          documentId={document._id}
          currentVersion={document.currentVersion}
          onVersionRestore={onDocumentUpdated}
        />
      )}
      
      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShareClick}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleVersionHistoryOpen}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Version History</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>
            Delete Document
          </ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

DocumentPreview.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  document: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    fileType: PropTypes.string.isRequired,
    fileSize: PropTypes.number,
    fileUrl: PropTypes.string.isRequired,
    tags: PropTypes.array,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    versions: PropTypes.array,
    currentVersion: PropTypes.number
  }),
  onDownload: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onShare: PropTypes.func,
  onDocumentUpdated: PropTypes.func
};

export default DocumentPreview;
