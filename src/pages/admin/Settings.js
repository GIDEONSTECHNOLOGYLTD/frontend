import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent,
  TextField, 
  Button, 
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { Save as SaveIcon, Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../../context/auth/AuthContext';
import { settings as settingsApi } from '../../services/api';

const Settings = () => {
  // Initialize auth context
  useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [testResult, setTestResult] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
    fromName: 'Gideon\'s Tech Suite',
    testEmail: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await settingsApi.getEmailSettings();
        if (data) {
          setEmailSettings(prev => ({
            ...prev,
            ...data,
            password: '' // Don't show actual password
          }));
        }
      } catch (error) {
        console.error('Error fetching email settings:', error);
        showSnackbar('Failed to load email settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data } = await settingsApi.updateEmailSettings(emailSettings);
      setEmailSettings(prev => ({
        ...prev,
        ...data,
        password: '' // Clear password field after save
      }));
      showSnackbar('Email settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving email settings:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to save email settings', 
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!emailSettings.testEmail) {
      showSnackbar('Please enter a test email address', 'warning');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const result = await settingsApi.sendTestEmail(emailSettings.testEmail);
      setTestResult({
        success: true,
        message: 'Test email sent successfully!',
        previewUrl: result.previewUrl
      });
      setTestDialogOpen(true);
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send test email'
      });
      setTestDialogOpen(true);
    } finally {
      setTesting(false);
    }
  };
  
  const handleCloseTestDialog = () => {
    setTestDialogOpen(false);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          System Settings
        </Typography>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Email Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure your email server settings for system notifications and user communications.
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailSettings.enabled}
                        onChange={handleChange}
                        name="enabled"
                        color="primary"
                      />
                    }
                    label="Enable Email Notifications"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    name="host"
                    value={emailSettings.host}
                    onChange={handleChange}
                    margin="normal"
                    disabled={!emailSettings.enabled}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    name="port"
                    type="number"
                    value={emailSettings.port}
                    onChange={handleChange}
                    margin="normal"
                    disabled={!emailSettings.enabled}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={emailSettings.username}
                    onChange={handleChange}
                    margin="normal"
                    disabled={!emailSettings.enabled}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={emailSettings.password}
                    onChange={handleChange}
                    margin="normal"
                    placeholder={emailSettings.password ? '••••••••' : ''}
                    disabled={!emailSettings.enabled}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailSettings.secure}
                        onChange={handleChange}
                        name="secure"
                        color="primary"
                        disabled={!emailSettings.enabled}
                      />
                    }
                    label="Use SSL/TLS"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="From Email"
                    name="fromEmail"
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={handleChange}
                    margin="normal"
                    disabled={!emailSettings.enabled}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="From Name"
                    name="fromName"
                    value={emailSettings.fromName}
                    onChange={handleChange}
                    margin="normal"
                    disabled={!emailSettings.enabled}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      disabled={saving || !emailSettings.enabled}
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Test Email Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Send a test email to verify your email settings are working correctly.
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={2} mt={2}>
                    <TextField
                      label="Test Email Address"
                      name="testEmail"
                      type="email"
                      value={emailSettings.testEmail}
                      onChange={handleChange}
                      disabled={!emailSettings.enabled}
                      sx={{ flexGrow: 1, maxWidth: 400 }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleTestEmail}
                      disabled={!emailSettings.enabled || !emailSettings.testEmail || testing}
                      startIcon={testing ? <CircularProgress size={20} /> : <SendIcon />}
                    >
                      {testing ? 'Sending...' : 'Send Test Email'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Test Email Result Dialog */}
      <Dialog open={testDialogOpen} onClose={handleCloseTestDialog}>
        <DialogTitle>
          {testResult?.success ? 'Test Email Sent' : 'Error Sending Test Email'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {testResult?.message}
          </DialogContentText>
          {testResult?.previewUrl && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                You can view your test email at: 
                <Link href={testResult.previewUrl} target="_blank" rel="noopener">
                  {testResult.previewUrl}
                </Link>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTestDialog} color="primary">
            Close
          </Button>
          {testResult?.previewUrl && (
            <Button 
              onClick={() => {
                window.open(testResult.previewUrl, '_blank');
                handleCloseTestDialog();
              }}
              color="primary"
              variant="contained"
              startIcon={<SendIcon />}
            >
              View Email
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
