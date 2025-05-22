import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_URL } from '../../config';

// Material-UI components
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const UploadDocumentDialog = ({
  open,
  onClose,
  onSuccess,
  currentFolder = null,
  projectId = null
}) => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [access, setAccess] = useState('private');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        // Set the name from the file name without extension
        const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
        setName(fileName);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);
    if (currentFolder) formData.append('folderId', currentFolder);
    if (projectId) formData.append('projectId', projectId);

    try {
      setUploading(true);
      setError('');
      
      const token = localStorage.getItem('gts_token');
      
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });
      
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(
        err.response?.data?.message || 'Failed to upload file. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setName('');
    setDescription('');
    setTags('');
    setAccess('private');
    setProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={uploading}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Upload Document</Typography>
          <IconButton 
            onClick={handleClose} 
            disabled={uploading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Box mb={2}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          {/* File Upload Area */}
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 4,
              textAlign: 'center',
              mb: 3,
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            
            {file ? (
              <Box>
                <Typography variant="body1">{file.name}</Typography>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  {Math.round(file.size / 1024)} KB
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  disabled={uploading}
                  sx={{ mt: 1 }}
                >
                  Change File
                </Button>
              </Box>
            ) : (
              <Box>
                <CloudUploadIcon fontSize="large" color="action" />
                <Typography variant="body1" mt={1}>
                  Click to select a file or drag and drop
                </Typography>
                <Typography variant="body2" color="textSecondary" mt={1}>
                  Max file size: 50MB
                </Typography>
              </Box>
            )}
            
            {uploading && (
              <Box mt={2}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption">
                  Uploading... {progress}%
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Document Details */}
          <TextField
            label="Document Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={uploading}
          />
          
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
          
          <TextField
            label="Tags (comma separated)"
            fullWidth
            margin="normal"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={uploading}
            placeholder="e.g., report, q1, finance"
          />
          
          <FormControl fullWidth margin="normal" disabled={uploading}>
            <InputLabel>Access Level</InputLabel>
            <Select
              value={access}
              label="Access Level"
              onChange={(e) => setAccess(e.target.value)}
            >
              <MenuItem value="private">Private (Only Me)</MenuItem>
              <MenuItem value="team">Team Members</MenuItem>
              <MenuItem value="public">Public</MenuItem>
            </Select>
            <FormHelperText>
              {access === 'private' && 'Only you can view and edit this document'}
              {access === 'team' && 'All team members can view this document'}
              {access === 'public' && 'Anyone with the link can view this document'}
            </FormHelperText>
          </FormControl>
          
          {currentFolder && (
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary">
                Uploading to: {currentFolder.name || 'Root'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={uploading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

UploadDocumentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  currentFolder: PropTypes.string,
  projectId: PropTypes.string
};

export default UploadDocumentDialog;
