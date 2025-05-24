import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const DeleteAccountDialog = ({ open, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirmDelete) {
      setError('Please confirm that you understand this action cannot be undone');
      return;
    }
    
    if (confirmText.toLowerCase() !== 'delete my account') {
      setError('Please type "delete my account" to confirm');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Here you would typically make an API call to delete the account
      // await deleteAccount();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to home or login page after successful deletion
      // This would typically be handled by the auth context
      window.location.href = '/';
      
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="delete-account-dialog-title"
    >
      <DialogTitle id="delete-account-dialog-title" sx={{ color: 'error.main' }}>
        <Box display="flex" alignItems="center">
          <WarningIcon sx={{ mr: 1 }} />
          Delete Account
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            This action is permanent and cannot be undone. All your data will be permanently deleted, 
            including your profile, documents, and any other information associated with your account.
          </DialogContentText>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              To confirm, type <strong>delete my account</strong> below:
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete my account"
              disabled={loading}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                color="primary"
                disabled={loading}
              />
            }
            label={
              <Typography variant="body2" color="textSecondary">
                I understand that this action cannot be undone and all my data will be permanently deleted.
              </Typography>
            }
            sx={{ mb: 2 }}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={onClose} 
            disabled={loading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={loading || !confirmDelete || confirmText.toLowerCase() !== 'delete my account'}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Deleting...' : 'Permanently Delete Account'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DeleteAccountDialog;
