import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { API_URL } from '../config';
import axios from 'axios';

/**
 * Component for testing API connectivity
 */
const TestApi = () => {
  const [status, setStatus] = useState({
    loading: false,
    success: null,
    error: null,
    data: null
  });

  const testApiConnection = async () => {
    setStatus({ loading: true, success: null, error: null, data: null });
    
    try {
      // API_URL already includes /api/v1 from config.js
      const response = await axios.get(`${API_URL}/health`);
      setStatus({
        loading: false,
        success: true,
        error: null,
        data: response.data
      });
    } catch (error) {
      console.error('API test error:', error);
      setStatus({
        loading: false,
        success: false,
        error: error.message || 'Failed to connect to API',
        data: null
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>API Connection Test</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          This page tests the connection to the backend API. Click the button below to test the connection.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testApiConnection}
          disabled={status.loading}
          sx={{ mb: 3 }}
        >
          {status.loading ? <CircularProgress size={24} /> : 'Test API Connection'}
        </Button>
        
        {status.success === true && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Successfully connected to the API!
          </Alert>
        )}
        
        {status.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {status.error}
          </Alert>
        )}
        
        {status.data && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>API Response:</Typography>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', maxHeight: '400px', overflow: 'auto' }}>
              <pre>{JSON.stringify(status.data, null, 2)}</pre>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TestApi;
