import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';

/**
 * Enhanced loading screen with backend connectivity check
 * Shows loading indicator and provides retry option if backend is unreachable
 */
const LoadingScreen = ({ message = "Loading Gideon's Tech Suite..." }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Check backend connectivity
  const checkBackendStatus = async () => {
    try {
      setStatus('loading');
      setError('');
      
      // Try to connect to the backend public test endpoint (doesn't require auth)
      await axios.get(`${API_URL}/public-test`, { 
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      
      setStatus('connected');
      console.log('Successfully connected to backend API');
    } catch (err) {
      console.error('Backend connection error:', err);
      setStatus('error');
      
      if (err.code === 'ECONNABORTED') {
        setError('Connection timed out. The server may be temporarily unavailable.');
      } else if (!err.response) {
        setError('Cannot connect to the server. Please check your internet connection.');
      } else {
        setError(`Server error: ${err.response?.status || 'Unknown'} - ${err.response?.data?.message || ''}`);
      }
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
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: 2,
          padding: 4,
          boxShadow: 3,
          textAlign: 'center',
          maxWidth: 400
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          {message}
        </Typography>
        
        {status === 'loading' && (
          <>
            <CircularProgress size={60} sx={{ my: 3 }} />
            <Typography variant="body1">
              Please wait while we connect to the server...
            </Typography>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Typography variant="body1" color="error" sx={{ my: 2 }}>
              {error || 'An error occurred while connecting to the server.'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The backend server may be temporarily unavailable or still starting up.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRetry}
              sx={{ mt: 1 }}
            >
              Retry Connection
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default LoadingScreen;
