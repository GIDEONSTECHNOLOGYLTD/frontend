import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
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

const DocumentPreview = ({ open, onClose, document, onDownload, onEdit, onDelete, onShare }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  React.useEffect(() => {
    if (!open || !document) return;
    
    const loadPreview = async () => {
      setLoading(true);
      try {
        const response = await fetch(document.fileUrl);
        const blob = await response.blob();
        
        if (document.fileType.startsWith('image/')) {
          setPreviewContent(URL.createObjectURL(blob));
        } else if (document.fileType === 'application/pdf') {
          setPreviewContent(URL.createObjectURL(blob));
        } else {
          // For unsupported preview types
          setPreviewContent(null);
        }
      } catch (error) {
        console.error('Error loading preview:', error);
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

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleVersionHistoryOpen = () => {
    setShowVersionHistory(true);
    handleMenuClose();
  };

  const handleVersionHistoryClose = () => {
    setShowVersionHistory(false);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit && onEdit();
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete && onDelete();
  };

  const handleShare = () => {
    handleMenuClose();
    onShare && onShare();
  };

  // Clean up object URLs on unmount or when document changes
  useEffect(() => {
    return () => {
      if (previewContent) {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [previewContent]);

  if (!document) return null;

  const renderPreview = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
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
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh',
              objectFit: 'contain' 
            }} 
          />
        </Box>
      );
    }

    if (document.fileType === 'application/pdf') {
      return (
        <Box width="100%" height="80vh">
          <iframe
            src={`${previewContent}#view=fitH`}
            title={document.name}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      );
    }

    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{document?.name}</Typography>
          <Box display="flex" alignItems="center">
            <Tooltip title="Download">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(document);
                }}
                color="primary"
                sx={{ mr: 1 }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Version History">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleVersionHistoryOpen();
                }}
                color="primary"
                sx={{ mr: 1 }}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="More actions">
              <IconButton
                onClick={handleMenuClick}
                color="primary"
                sx={{ mr: 1 }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(!isFullscreen);
                }}
                color="primary"
                sx={{ mr: 1 }}
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }} 
              color="primary"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden'
      }}>
        {renderPreview()}
      </DialogContent>
      
      {/* Document actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare}>
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
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Version History Dialog */}
      {document && (
        <DocumentVersionHistory
          document={document}
          open={showVersionHistory}
          onClose={handleVersionHistoryClose}
        />
      )}
    </Dialog>
  );
};

export default DocumentPreview;
