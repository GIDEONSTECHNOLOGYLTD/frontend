import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Container, 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  Divider, 
  Grid,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Styled hidden input for file upload
const StyledFileInput = styled('input')({
  display: 'none'
});

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || ''
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    setAvatarFile(null);
    // You might want to call an API to remove the avatar from the server
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      // Replace with your actual API endpoint
      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      const data = await response.json();
      return data.avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let avatarUrl = user?.avatar || '';
      
      // Upload new avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      } else if (avatarPreview === '' && user?.avatar) {
        // Avatar was removed
        // Call API to remove avatar
        await fetch('/api/users/remove-avatar', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        avatarUrl = '';
      }
      
      // Update profile with new data
      await updateProfile({
        ...formData,
        ...(avatarUrl !== undefined && { avatar: avatarUrl })
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || ''
    });
    setIsEditing(false);
  };

  const renderField = (label, name, value, Icon) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Icon color="action" sx={{ mr: 2 }} />
      {isEditing ? (
        <TextField
          fullWidth
          label={label}
          name={name}
          value={value}
          onChange={handleChange}
          variant="outlined"
          size="small"
        />
      ) : (
        <Box>
          <Typography variant="caption" color="textSecondary">
            {label}
          </Typography>
          <Typography variant="body1">
            {value || 'Not provided'}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Set default avatar if none is provided
  const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography variant="h4" component="h1" sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              My Profile
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your personal information
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 } }}>
            {!isEditing ? (
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant="outlined" 
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading || isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={(loading || isUploading) ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading || isUploading}
                >
                  {isUploading ? 'Uploading...' : loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </Box>
        </Box>

        {error && (
          <Box sx={{ mb: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              position: 'sticky',
              top: 16,
              zIndex: 1,
              boxShadow: 3
            }}
          >
            {success}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar 
                  src={avatarPreview || user?.avatar || defaultAvatar} 
                  sx={{ 
                    width: 150, 
                    height: 150, 
                    fontSize: '3rem',
                    border: '3px solid',
                    borderColor: 'primary.main',
                    boxShadow: 3
                  }}
                >
                  {!avatarPreview && !user?.avatar && (user?.name?.charAt(0) || 'U')}
                </Avatar>
                
                {isEditing && (
                  <>
                    <Tooltip title="Change photo">
                      <IconButton
                        color="primary"
                        aria-label="upload picture"
                        component="label"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'background.paper',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          boxShadow: 2
                        }}
                      >
                        <StyledFileInput 
                          accept="image/*" 
                          type="file" 
                          onChange={handleImageChange}
                          ref={fileInputRef}
                        />
                        <CameraIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {(avatarPreview || user?.avatar) && (
                      <Tooltip title="Remove photo">
                        <IconButton
                          color="error"
                          aria-label="remove picture"
                          onClick={handleRemoveAvatar}
                          disabled={isUploading}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bgcolor: 'background.paper',
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'error.contrastText'
                            },
                            boxShadow: 2
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
              </Box>
              
              <Typography variant="h6" align="center">{user?.name || 'User'}</Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                {user?.email}
              </Typography>
              {user?.role && (
                <Box 
                  sx={{
                    mt: 1,
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'medium',
                    textTransform: 'capitalize'
                  }}
                >
                  {user.role}
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Personal Information
                  </Typography>
                  {renderField('Full Name', 'name', formData.name, PersonIcon)}
                  <Divider sx={{ my: 2 }} />
                  {renderField('Email', 'email', formData.email, EmailIcon)}
                  <Divider sx={{ my: 2 }} />
                  {renderField('Phone', 'phone', formData.phone, PhoneIcon)}
                  <Divider sx={{ my: 2 }} />
                  {renderField('Location', 'location', formData.location, LocationIcon)}
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Account Security
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Password</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ********
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small"
                      component={RouterLink}
                      to="/change-password"
                      startIcon={<VpnKeyIcon />}
                    >
                      Change
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">Dark Mode</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Switch between light and dark theme
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small">
                    {user?.darkMode ? 'Light Mode' : 'Dark Mode'}
                  </Button>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Member since {new Date(user?.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </form>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile;
