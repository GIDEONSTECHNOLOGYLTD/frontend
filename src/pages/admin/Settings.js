import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  IconButton,
  Collapse,
  Paper,
  Fade
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Send as SendIcon, 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  VpnKey as VpnKeyIcon,
  Email as EmailIcon,
  Dns as DnsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/auth/AuthContext';
import { settings as settingsApi } from '../../services/api';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  section: {
    marginBottom: theme.spacing(4),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  testSection: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  statusSuccess: {
    color: theme.palette.success.main,
  },
  statusError: {
    color: theme.palette.error.main,
  },
  statusWarning: {
    color: theme.palette.warning.main,
  },
  formRow: {
    marginBottom: theme.spacing(3),
  },
  actionButtons: {
    marginTop: theme.spacing(3),
    '& > *': {
      marginRight: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
  },
  testResults: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
}));

const Settings = () => {
  const classes = useStyles();
  const { user } = useAuth();
  
  // Loading and UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [expanded, setExpanded] = useState({
    smtp: true,
    test: false
  });
  
  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Test result states
  const [testResult, setTestResult] = useState(null);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  
  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: user?.email || '',
    fromName: user?.name || 'Gideon\'s Tech Suite',
    testEmail: user?.email || ''
  });
  
  // Toggle section expansion
  const handleExpandClick = (section) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

  /**
   * Test the SMTP connection with current settings
   */
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    
    try {
      await settingsApi.testEmailConnection();
      setConnectionTestResult({
        success: true,
        message: 'Successfully connected to the SMTP server',
        timestamp: new Date().toISOString()
      });
      showSnackbar('SMTP connection test successful!', 'success');
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      setConnectionTestResult({
        success: false,
        message: error.response?.data?.message || 'Failed to connect to SMTP server',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      showSnackbar('SMTP connection test failed', 'error');
    } finally {
      setTestingConnection(false);
    }
  };
  
  /**
   * Send a test email using the current settings
   */
  const handleTestEmail = async () => {
    if (!emailSettings.testEmail) {
      showSnackbar('Please enter a test email address', 'warning');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailSettings.testEmail)) {
      showSnackbar('Please enter a valid email address', 'warning');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const { data } = await settingsApi.sendTestEmail({ email: emailSettings.testEmail });
      const result = {
        success: true,
        message: 'Test email sent successfully!',
        messageId: data.messageId,
        timestamp: data.timestamp || new Date().toISOString()
      };
      setTestResult(result);
      setTestDialogOpen(true);
      showSnackbar('Test email sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending test email:', error);
      const result = {
        success: false,
        message: error.response?.data?.message || 'Failed to send test email',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setTestResult(result);
      setTestDialogOpen(true);
      showSnackbar('Failed to send test email', 'error');
    } finally {
      setTesting(false);
    }
  };
  
  // Removed unused handleCloseTestDialog

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Removed unused handleCloseSnackbar

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Format last tested timestamp
  const formatLastTested = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" gutterBottom className={classes.sectionTitle}>
          <SettingsIcon /> Email Settings
        </Typography>
        
        <Paper elevation={2} className={classes.section}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            className={classes.sectionTitle}
            onClick={() => handleExpandClick('smtp')}
            style={{ cursor: 'pointer' }}
          >
            <Box display="flex" alignItems="center">
              <DnsIcon />
              <Typography variant="h6">SMTP Server Configuration</Typography>
            </Box>
            <IconButton size="small">
              {expanded.smtp ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={expanded.smtp} timeout="auto" unmountOnExit>
            <Box p={3}>
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
                      label={
                        <Box>
                          <Typography>Enable Email Notifications</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {emailSettings.enabled ? 'Email notifications are enabled' : 'Email notifications are disabled'}
                          </Typography>
                        </Box>
                      }
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
                      required={emailSettings.enabled}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DnsIcon />
                          </InputAdornment>
                        ),
                      }}
                      helperText="e.g., smtp.example.com"
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
                      required={emailSettings.enabled}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SettingsIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        min: 1,
                        max: 65535,
                        step: 1
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
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
                      label={
                        <Box>
                          <Typography>Use SSL/TLS</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {emailSettings.secure 
                              ? 'Connection will be encrypted with SSL/TLS' 
                              : 'Connection will not be encrypted (not recommended)'}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SMTP Username"
                      name="username"
                      value={emailSettings.username}
                      onChange={handleChange}
                      margin="normal"
                      disabled={!emailSettings.enabled}
                      required={emailSettings.enabled}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SMTP Password"
                      name="password"
                      type="password"
                      value={emailSettings.password}
                      onChange={handleChange}
                      margin="normal"
                      disabled={!emailSettings.enabled}
                      required={emailSettings.enabled}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKeyIcon />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Leave blank to keep current password"
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
                      required={emailSettings.enabled}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                      helperText="The email address that will appear in the 'From' field"
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
                      required={emailSettings.enabled}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                      helperText="The name that will appear in the 'From' field"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="subtitle1">Connection Status</Typography>
                        <Typography variant="body2" color="textSecondary">
                          Last tested: {formatLastTested(connectionTestResult?.timestamp)}
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleTestConnection}
                          disabled={!emailSettings.enabled || testingConnection}
                          startIcon={testingConnection ? <CircularProgress size={20} /> : <RefreshIcon />}
                        >
                          {testingConnection ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </Box>
                    </Box>
                    
                    {connectionTestResult && (
                      <Fade in={!!connectionTestResult}>
                        <Box mt={2}>
                          <Alert 
                            severity={connectionTestResult.success ? 'success' : 'error'}
                            icon={connectionTestResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                          >
                            <Typography variant="body1">
                              {connectionTestResult.message}
                            </Typography>
                            {connectionTestResult.error && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {connectionTestResult.error}
                              </Typography>
                            )}
                          </Alert>
                        </Box>
                      </Fade>
                    )}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box className={classes.actionButtons}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                        disabled={!emailSettings.enabled || saving}
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => setTestDialogOpen(true)}
                        disabled={!emailSettings.enabled || saving}
                        startIcon={<SendIcon />}
                      >
                        Send Test Email
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Collapse>
        </Paper>
        
        {/* Test Email Dialog */}
        <Dialog 
          open={testDialogOpen} 
          onClose={() => setTestDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogContent>
            <DialogContentText gutterBottom>
              Enter an email address to send a test message and verify your email settings.
            </DialogContentText>
            
            <TextField
              autoFocus
              margin="dense"
              id="test-email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={emailSettings.testEmail}
              onChange={(e) => setEmailSettings({
                ...emailSettings,
                testEmail: e.target.value
              })}
              disabled={testing}
              sx={{ mt: 2 }}
            />
            
            {testResult && (
              <Box mt={2}>
                <Alert 
                  severity={testResult.success ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body1">
                    {testResult.message}
                  </Typography>
                  {testResult.messageId && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Message ID: {testResult.messageId}
                    </Typography>
                  )}
                  {testResult.error && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {testResult.error}
                    </Typography>
                  )}
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setTestDialogOpen(false);
                setTestResult(null);
              }}
              disabled={testing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleTestEmail} 
              color="primary"
              variant="contained"
              disabled={!emailSettings.testEmail || testing}
              startIcon={testing ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {testing ? 'Sending...' : 'Send Test Email'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Settings;
