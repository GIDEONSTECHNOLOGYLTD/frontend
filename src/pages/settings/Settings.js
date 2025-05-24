import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Switch, 
  FormControlLabel, 
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Palette as PaletteIcon, 
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordDialog from '../../components/settings/ChangePasswordDialog';
import DeleteAccountDialog from '../../components/settings/DeleteAccountDialog';

const Settings = () => {
  const theme = useTheme();
  useMediaQuery(theme.breakpoints.down('md')); // Keep for responsive design
  const { user, updateUserPreferences } = useAuth();
  
  const [settings, setSettings] = useState({
    darkMode: user?.preferences?.darkMode || false,
    emailNotifications: user?.preferences?.emailNotifications || true,
    pushNotifications: user?.preferences?.pushNotifications || true,
    language: user?.preferences?.language || 'en',
  });
  
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update settings when user preferences change
  useEffect(() => {
    if (user?.preferences) {
      setSettings({
        darkMode: user.preferences.darkMode || false,
        emailNotifications: user.preferences.emailNotifications !== false, // Default to true if not set
        pushNotifications: user.preferences.pushNotifications !== false, // Default to true if not set
        language: user.preferences.language || 'en',
      });
    }
  }, [user?.preferences]);

  const handleSettingChange = (setting) => (event) => {
    const newValue = event.target.checked;
    setSettings({
      ...settings,
      [setting]: newValue
    });
    
    // If dark mode is toggled, update the theme immediately
    if (setting === 'darkMode') {
      // This would typically be handled by your theme provider
      document.body.classList.toggle('dark-mode', newValue);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Here you would typically make an API call to save the settings
      await updateUserPreferences(settings);
      
      setSuccess('Settings saved successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original settings
    setSettings({
      darkMode: user?.preferences?.darkMode || false,
      emailNotifications: user?.preferences?.emailNotifications !== false,
      pushNotifications: user?.preferences?.pushNotifications !== false,
      language: user?.preferences?.language || 'en',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: <AccountIcon />,
      items: [
        {
          id: 'account',
          primary: 'Account Information',
          secondary: 'Update your account details',
          icon: <AccountIcon color="primary" />,
          action: () => console.log('Navigate to account info'),
        },
        {
          id: 'password',
          primary: 'Change Password',
          secondary: 'Update your password',
          icon: <VpnKeyIcon color="primary" />,
          action: () => setOpenPasswordDialog(true),
        },
      ],
    },
    {
      title: 'Preferences',
      icon: <PaletteIcon />,
      items: [
        {
          id: 'darkMode',
          primary: 'Dark Mode',
          secondary: 'Switch between light and dark theme',
          icon: settings.darkMode ? <DarkModeIcon color="primary" /> : <LightModeIcon color="primary" />,
          action: (
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleSettingChange('darkMode')}
                  color="primary"
                  disabled={!isEditing}
                />
              }
              label={settings.darkMode ? 'On' : 'Off'}
            />
          ),
        },
        {
          id: 'emailNotifications',
          primary: 'Email Notifications',
          secondary: 'Receive email notifications',
          icon: <EmailIcon color="primary" />,
          action: (
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={handleSettingChange('emailNotifications')}
                  color="primary"
                  disabled={!isEditing}
                />
              }
              label={settings.emailNotifications ? 'On' : 'Off'}
            />
          ),
        },
        {
          id: 'pushNotifications',
          primary: 'Push Notifications',
          secondary: 'Receive push notifications',
          icon: <NotificationsIcon color="primary" />,
          action: (
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={handleSettingChange('pushNotifications')}
                  color="primary"
                  disabled={!isEditing}
                />
              }
              label={settings.pushNotifications ? 'On' : 'Off'}
            />
          ),
        },
      ],
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      items: [
        {
          id: 'privacy',
          primary: 'Privacy Settings',
          secondary: 'Manage your privacy preferences',
          icon: <SecurityIcon color="primary" />,
          action: () => console.log('Navigate to privacy settings'),
        },
        {
          id: 'deleteAccount',
          primary: 'Delete Account',
          secondary: 'Permanently delete your account',
          icon: <DeleteIcon color="error" />,
          action: () => setOpenDeleteDialog(true),
          isDanger: true,
        },
      ],
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
        {isEditing ? (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancel}
              disabled={saving}
              startIcon={<CancelIcon />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsEditing(true)}
            startIcon={<SaveIcon />}
          >
            Edit Settings
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {settingsSections.map((section) => (
          <Grid item xs={12} key={section.title}>
            <Paper elevation={2}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {React.cloneElement(section.icon, { sx: { fontSize: 20 } })}
                <Typography variant="h6" component="h2">
                  {section.title}
                </Typography>
              </Box>
              <List>
                {section.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      button 
                      onClick={item.action}
                      disabled={!isEditing && typeof item.action !== 'function'}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        ...(item.isDanger && {
                          '&:hover': {
                            bgcolor: 'error.light',
                            '& .MuiListItemText-secondary': {
                              color: 'error.contrastText',
                            },
                          },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.primary} 
                        secondary={item.secondary}
                        primaryTypographyProps={{
                          color: item.isDanger ? 'error' : 'textPrimary',
                          fontWeight: 'medium'
                        }}
                        secondaryTypographyProps={{
                          color: item.isDanger ? 'error.main' : 'textSecondary',
                          variant: 'body2'
                        }}
                      />
                      {typeof item.action === 'function' ? (
                        <ListItemSecondaryAction>
                          <Button 
                            variant={item.isDanger ? 'outlined' : 'text'} 
                            color={item.isDanger ? 'error' : 'primary'}
                            onClick={item.action}
                            size="small"
                            endIcon={item.isDanger && <DeleteIcon />}
                          >
                            {item.isDanger ? 'Delete' : 'View'}
                          </Button>
                        </ListItemSecondaryAction>
                      ) : (
                        <ListItemSecondaryAction>
                          {item.action}
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Dialogs */}
      <ChangePasswordDialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
      />
      
      <DeleteAccountDialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
      />
    </Container>
  );
};

export default Settings;
