import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import axios from 'axios';
import { FRONTEND_API_URL } from '../../config';

/**
 * Enhanced loading screen with backend connectivity check
 * Shows loading indicator and provides retry option if backend is unreachable
 */
const LoadingScreen = ({ message = "Loading Gideon's Tech Suite..." }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Check API connectivity using the frontend API endpoints
  const checkBackendStatus = async () => {
    try {
      setStatus('loading');
      setError('');
      
      // First check if the frontend API is accessible
      console.log('Testing API connectivity with frontend health endpoint...');
      const healthResponse = await axios.get(`${FRONTEND_API_URL}/health`, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      console.log('Frontend API health check successful:', healthResponse.data);
      
      // Then check database connectivity
      console.log('Testing database connectivity...');
      const dbResponse = await axios.get(`${FRONTEND_API_URL}/db-status`, {
        timeout: 8000,
        headers: { 'Accept': 'application/json' }
      });
      console.log('Database connectivity check:', dbResponse.data);
      
      // If we get here, both checks passed
      setStatus('connected');
      console.log('Successfully connected to API and database');
    } catch (err) {
      console.error('Connection error:', err);
      setStatus('error');
      
      if (err.code === 'ECONNABORTED') {
        setError('Connection timed out. The server may be temporarily unavailable.');
      } else if (!err.response) {
        setError('Cannot connect to the server. Please check your internet connection.');
      } else if (err.response?.data?.error?.message) {
        setError(`Error: ${err.response.data.error.message}`);
      } else {
        setError(`Server error: ${err.response?.status || 'Unknown'} - ${err.response?.data?.message || 'Unknown error'}`);
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
