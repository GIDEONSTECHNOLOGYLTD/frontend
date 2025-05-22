import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { Close, Download, Fullscreen, FullscreenExit } from '@mui/icons-material';

const DocumentPreview = ({ open, onClose, document, onDownload }) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [previewContent, setPreviewContent] = React.useState(null);

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
        <Typography variant="h6" noWrap>
          {document.name}
        </Typography>
        <Box>
          <IconButton onClick={() => onDownload(document)} title="Download">
            <Download />
          </IconButton>
          <IconButton 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
          <IconButton onClick={onClose} title="Close">
            <Close />
          </IconButton>
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
    </Dialog>
  );
};

export default DocumentPreview;
