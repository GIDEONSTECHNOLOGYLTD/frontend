import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import axios from 'axios';
import { API_URL } from '../../config';

/**
 * Loading screen component
 * Shows loading indicator and provides retry option if backend is unreachable
 */
const LoadingScreen = ({ message = "Loading Gideon's Tech Suite..." }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Check backend API connectivity
  const checkBackendStatus = async () => {
    try {
      setStatus('loading');
      setError('');
      console.log('Testing backend API connectivity...');
      
      try {
        const response = await axios.get(`${API_URL}/health`, { 
          timeout: 5000
        });
        
        if (response.status === 200) {
          console.log('Backend API connection successful:', response.data);
          setStatus('connected');
        } else {
          throw new Error(`Unexpected status: ${response.status}`);
        }
      } catch (err) {
        console.error('Backend API connection failed:', err);
        setStatus('error');
        
        if (err.code === 'ECONNABORTED') {
          setError('Connection timed out. The server may be temporarily unavailable.');
        } else if (!err.response) {
          setError('Cannot connect to the server. Please check your internet connection or make sure the backend server is running at http://localhost:5000.');
        } else if (err.response?.status === 401) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(`Server error: ${err.response?.status || 'Unknown'} - ${err.response?.data?.message || err.message || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Unexpected error during connectivity check:', err);
      setStatus('error');
      setError(`Unexpected error: ${err.message}`);
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
              Make sure it's running on http://localhost:5000.
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
