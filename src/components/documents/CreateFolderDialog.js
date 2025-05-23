import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_URL } from '../config';

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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  CircularProgress
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

const CreateFolderDialog = ({
  open,
  onClose,
  onSuccess,
  currentFolder = null,
  projectId = null
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [access, setAccess] = useState('team');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('gts_token');
      const folderData = {
        name: name.trim(),
        description: description.trim(),
        parent: currentFolder || null,
        project: projectId || null,
        access
      };
      
      await axios.post(`${API_URL}/folders`, folderData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(
        err.response?.data?.message || 'Failed to create folder. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setAccess('team');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <CreateNewFolderIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Create New Folder</Typography>
          </Box>
          <IconButton 
            onClick={handleClose} 
            disabled={loading}
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
          
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
          
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel>Access Level</InputLabel>
            <Select
              value={access}
              label="Access Level"
              onChange={(e) => setAccess(e.target.value)}
            >
              <MenuItem value="private">Private (Only Me)</MenuItem>
              <MenuItem value="team">Team Members</MenuItem>
            </Select>
            <FormHelperText>
              {access === 'private' 
                ? 'Only you can view and manage this folder' 
                : 'All team members can view this folder'}
            </FormHelperText>
          </FormControl>
          
          {(currentFolder || projectId) && (
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary">
                Location: {currentFolder ? `Inside "${currentFolder.name}"` : `In Project ${projectId}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!name.trim() || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Folder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

CreateFolderDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  currentFolder: PropTypes.object,
  projectId: PropTypes.string
};

export default CreateFolderDialog;
