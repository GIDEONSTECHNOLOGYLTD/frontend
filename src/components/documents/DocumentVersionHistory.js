import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  CircularProgress,
  Box,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import {
  History as HistoryIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { API_URL } from '../config';
import { format } from 'date-fns';

const DocumentVersionHistory = ({ document, open, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const fetchVersionsMemoized = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('gts_token');
      const response = await fetch(`${API_URL}/documents/${document._id}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }
      
      const data = await response.json();
      setVersions(data.data);
    } catch (error) {
      console.error('Error fetching versions:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  }, [document?._id]);

  useEffect(() => {
    if (open && document?._id) {
      fetchVersionsMemoized();
    }
  }, [open, document, fetchVersionsMemoized]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('gts_token');
      const response = await fetch(`${API_URL}/documents/${document._id}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }
      
      const data = await response.json();
      setVersions(data.data);
    } catch (error) {
      console.error('Error fetching versions:', error);
      // TODO: Show error notification
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, version) => {
    setAnchorEl(event.currentTarget);
    setSelectedVersion(version);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVersion(null);
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    
    try {
      setRestoring(true);
      const token = localStorage.getItem('gts_token');
      const response = await fetch(
        `${API_URL}/documents/${document._id}/versions/${selectedVersion.versionNumber}/restore`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to restore version');
      }
      
      // Refresh versions and close menu
      await fetchVersions();
      handleMenuClose();
      // TODO: Show success notification
      
      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error restoring version:', error);
      // TODO: Show error notification
    } finally {
      setRestoring(false);
    }
  };

  const handleDownload = async (version) => {
    try {
      const token = localStorage.getItem('gts_token');
      const response = await fetch(
        `${API_URL}/documents/${document._id}/versions/${version.versionNumber}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to download version');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.name} (v${version.versionNumber})`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading version:', error);
      // TODO: Show error notification
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <HistoryIcon sx={{ mr: 1 }} />
          Version History: {document?.name}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" p={2}>
            No previous versions found
          </Typography>
        ) : (
          <List>
            {versions.map((version) => (
              <React.Fragment key={version._id || version.versionNumber}>
                <ListItem 
                  button
                  selected={version.isCurrent}
                  onClick={() => handleDownload(version)}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="more"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(e, version);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`Version ${version.versionNumber}${version.isCurrent ? ' (Current)' : ''}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {version.uploadedBy?.name || 'System'}
                        </Typography>
                        {` — ${format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}`}
                        {version.changes && (
                          <Typography component="div" variant="body2" color="textSecondary">
                            {version.changes}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </Box>

      {/* Version actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={() => handleDownload(selectedVersion)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download this version" />
        </MenuItem>
        <MenuItem 
          onClick={handleRestore}
          disabled={!selectedVersion || selectedVersion.isCurrent || restoring}
        >
          <ListItemIcon>
            {restoring ? (
              <CircularProgress size={20} />
            ) : (
              <RestoreIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={restoring ? 'Restoring...' : 'Restore this version'} 
          />
        </MenuItem>
      </Menu>
    </Dialog>
  );
};

export default DocumentVersionHistory;
