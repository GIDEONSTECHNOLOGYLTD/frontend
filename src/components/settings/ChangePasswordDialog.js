import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Lock as LockIcon } from '@mui/icons-material';

const ChangePasswordDialog = ({ open, onClose }) => {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTogglePassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Here you would typically make an API call to change the password
      // await changePassword(formData.currentPassword, formData.newPassword);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Password changed successfully!');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Alert severity="success">
              {success}
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type={showPassword.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleTogglePassword('current')}
                        edge="end"
                      >
                        {showPassword.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showPassword.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleTogglePassword('new')}
                        edge="end"
                      >
                        {showPassword.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type={showPassword.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => handleTogglePassword('confirm')}
                        edge="end"
                      >
                        {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Typography variant="caption" color="textSecondary">
                Password must be at least 8 characters long
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        {!success && (
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
};

export default ChangePasswordDialog;
