import React, { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { API_URL, FRONTEND_API_URL } from '../config';
import axios from 'axios';

/**
 * Component for testing API connectivity and providing troubleshooting steps
 */
const ApiConnectionTest = () => {
  const [status, setStatus] = useState({
    loading: false,
    success: null,
    error: null,
    data: null,
    testResults: []
  });

  const runDiagnostics = async () => {
    setStatus({
      loading: true,
      success: null,
      error: null,
      data: null,
      testResults: []
    });
    
    const results = [];
    let overallSuccess = true;
    
    // Test 1: Check if frontend API is accessible
    try {
      results.push({ name: 'Testing frontend API endpoint', status: 'running' });
      setStatus(prev => ({ ...prev, testResults: [...results] }));
      
      const response = await axios.get(`${FRONTEND_API_URL}/v1/health`, { timeout: 5000 });
      
      results[results.length - 1] = {
        name: 'Frontend API endpoint',
        status: 'success',
        message: 'Successfully connected to the frontend API endpoint',
        data: response.data
      };
    } catch (error) {
      overallSuccess = false;
      results[results.length - 1] = {
        name: 'Frontend API endpoint',
        status: 'error',
        message: `Error connecting to frontend API: ${error.message}`,
        error
      };
    }
    
    // Test 2: Check if API v1 is accessible
    try {
      results.push({ name: 'Testing API v1 endpoint', status: 'running' });
      setStatus(prev => ({ ...prev, testResults: [...results] }));
      
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      
      results[results.length - 1] = {
        name: 'API v1 endpoint',
        status: 'success',
        message: 'Successfully connected to the API v1 endpoint',
        data: response.data
      };
    } catch (error) {
      overallSuccess = false;
      results[results.length - 1] = {
        name: 'API v1 endpoint',
        status: 'error',
        message: `Error connecting to API v1: ${error.message}`,
        error
      };
    }
    
    // Test 3: Check MongoDB connection
    try {
      results.push({ name: 'Testing MongoDB connection', status: 'running' });
      setStatus(prev => ({ ...prev, testResults: [...results] }));
      
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      const dbStatus = response.data?.database?.status === 'connected' ? 'success' : 'error';
      
      results[results.length - 1] = {
        name: 'MongoDB connection',
        status: dbStatus,
        message: dbStatus === 'success' 
          ? 'Successfully connected to MongoDB' 
          : 'Failed to connect to MongoDB',
        data: response.data?.database
      };
      
      if (dbStatus === 'error') overallSuccess = false;
    } catch (error) {
      overallSuccess = false;
      results[results.length - 1] = {
        name: 'MongoDB connection',
        status: 'error',
        message: `Error checking MongoDB connection: ${error.message}`,
        error
      };
    }
    
    setStatus({
      loading: false,
      success: overallSuccess,
      error: overallSuccess ? null : 'Some tests failed',
      data: null,
      testResults: results
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>API Connection Diagnostics</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          There seems to be an issue connecting to the backend API. Let's run some diagnostics to identify the problem.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={runDiagnostics}
          disabled={status.loading}
          sx={{ mb: 3 }}
        >
          {status.loading ? <CircularProgress size={24} /> : 'Run Diagnostics'}
        </Button>
        
        {status.testResults.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Diagnostic Results:</Typography>
            
            {status.testResults.map((test, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                    {test.name}
                  </Typography>
                  {test.status === 'running' && <CircularProgress size={20} />}
                  {test.status === 'success' && (
                    <Alert severity="success" sx={{ py: 0 }}>Success</Alert>
                  )}
                  {test.status === 'error' && (
                    <Alert severity="error" sx={{ py: 0 }}>Failed</Alert>
                  )}
                </Box>
                
                <Typography variant="body2">{test.message}</Typography>
                
                {test.data && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption">Response data:</Typography>
                    <Box sx={{ maxHeight: '100px', overflow: 'auto', fontSize: '0.75rem' }}>
                      <pre>{JSON.stringify(test.data, null, 2)}</pre>
                    </Box>
                  </Box>
                )}
              </Paper>
            ))}
            
            {!status.success && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>Troubleshooting Steps:</Typography>
                <ol>
                  <li>
                    <Typography variant="body2" paragraph>
                      Make sure the backend server is running. Try running <code>./start-local-dev.sh</code> in your project directory.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      Check if MongoDB is running. You can run <code>mongod --version</code> to verify MongoDB is installed.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      Verify the API endpoint in <code>frontend/src/config.js</code> is correct. It should be <code>http://localhost:5001/api/v1</code>.
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" paragraph>
                      Check the backend logs for any errors. Look for messages in the terminal where the backend is running.
                    </Typography>
                  </li>
                </ol>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ApiConnectionTest;
