import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import axios from 'axios';
import { API_URL, AUTH_TOKEN } from '../../config';

/**
 * Enhanced loading screen with backend connectivity check
 * Shows loading indicator and provides retry option if backend is unreachable
 */
const LoadingScreen = ({ message = "Loading Gideon's Tech Suite..." }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Check API connectivity with fallback options
  const checkBackendStatus = async () => {
    try {
      setStatus('loading');
      setError('');
      
      // Try multiple approaches to check connectivity
      let connected = false;
      let errorDetails = '';
      
      // Approach 1: Try direct backend connection
      try {
        console.log('Testing direct backend connection...');
        const directResponse = await axios.get(`${API_URL}/health`, { 
          timeout: 5000,
          headers: { 'Accept': 'application/json' }
        });
        
        if (directResponse.status === 200) {
          console.log('Direct backend connection successful:', directResponse.data);
          connected = true;
        }
      } catch (directErr) {
        console.warn('Direct backend connection failed:', directErr.message);
        errorDetails = `Direct API: ${directErr.message}`;
        
        // Check if this is a Vercel authentication issue (401)
        const isVercelAuth = directErr.response?.status === 401 && 
                            directErr.response?.data?.includes('Vercel Authentication');
        
        if (isVercelAuth) {
          console.warn('Detected Vercel authentication requirement');
          errorDetails += ' (Vercel authentication required)';
        }
      }
      
      // Approach 2: Try frontend API endpoints if available
      if (!connected) {
        try {
          console.log('Testing frontend API endpoints...');
          const frontendResponse = await axios.get(`${window.location.origin}/api/health`, {
            timeout: 5000
          });
          
          if (frontendResponse.status === 200) {
            console.log('Frontend API connection successful:', frontendResponse.data);
            connected = true;
          }
        } catch (frontendErr) {
          console.warn('Frontend API connection failed:', frontendErr.message);
          errorDetails += `, Frontend API: ${frontendErr.message}`;
        }
      }
      
      // Approach 3: Check if we have a valid auth token
      const token = localStorage.getItem(AUTH_TOKEN);
      if (token) {
        try {
          // Try to decode the token to check if it's valid
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const expiry = payload.exp * 1000; // Convert to milliseconds
          
          if (expiry > Date.now()) {
            console.log('Valid authentication token found');
            // Even if API checks failed, we might still be able to proceed with the token
            connected = true;
          } else {
            console.warn('Authentication token is expired');
            errorDetails += ', Auth token expired';
          }
        } catch (tokenErr) {
          console.warn('Invalid authentication token:', tokenErr.message);
          errorDetails += ', Invalid auth token';
        }
      } else {
        console.warn('No authentication token found');
        errorDetails += ', No auth token';
      }
      
      // Set final status based on connectivity checks
      if (connected) {
        setStatus('connected');
        console.log('Successfully connected to backend');
      } else {
        setStatus('error');
        setError(`Could not connect to backend services. ${errorDetails}

Please try the connection test page for more details.`);
      }
    } catch (err) {
      console.error('Unexpected error during connectivity check:', err);
      setStatus('error');
      setError(`Unexpected error: ${err.message}. Please try the connection test page.`);
    }
  };

  // Check backend status on component mount and when attempts change
  useEffect(() => {
    checkBackendStatus();
  }, [attempts]);

  // Handle retry button click
  const handleRetry = () => {
    setAttempts(prev => prev + 1);
  };

  return (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
      {status === 'loading' && (
        <>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h5">{message}</Typography>
        </>
      )}
      
      {status === 'error' && (
        <>
          <Typography variant="h5" color="error" gutterBottom>
            Connection Error
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3, maxWidth: '80%' }}>
            {error}
          </Typography>
          <Box display="flex" flexDirection="column" gap={2} alignItems="center">
            <Button variant="contained" onClick={handleRetry}>
              Retry Connection
            </Button>
            <Button 
              variant="outlined" 
              color="primary"
              component="a" 
              href="/connection-test.html" 
              target="_blank"
            >
              Open Connection Test Page
            </Button>
            <Typography variant="body2" color="textSecondary" mt={2} align="center">
              If you continue to experience issues, please contact support or try accessing the{' '}
              <Button 
                variant="text" 
                component="a" 
                href="/login.html" 
                target="_blank"
                size="small"
              >
                login page
              </Button>
              {' '}directly.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default LoadingScreen;
