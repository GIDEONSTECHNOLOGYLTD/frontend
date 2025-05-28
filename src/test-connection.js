import axios from 'axios';
import { API_URL, WS_URL } from './config';

/**
 * Comprehensive API connection test
 * Tests all critical endpoints and WebSocket connection
 */
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    console.log(`Using API URL: ${API_URL}`);
    console.log(`Using WebSocket URL: ${WS_URL}`);
    
    // Test results object
    const results = {
      success: false,
      endpoints: {},
      websocket: { tested: false },
      timestamp: new Date().toISOString()
    };
    
    // Test health endpoint
    try {
      console.log('Testing health endpoint...');
      const healthResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      results.endpoints.health = {
        success: true,
        status: healthResponse.status,
        data: healthResponse.data
      };
      console.log('Health endpoint success:', healthResponse.data);
    } catch (healthError) {
      results.endpoints.health = {
        success: false,
        error: healthError.message,
        code: healthError.code || 'UNKNOWN'
      };
      console.error('Health endpoint error:', healthError.message);
    }
    
    // Test status endpoint
    try {
      console.log('Testing status endpoint...');
      const statusResponse = await axios.get(`${API_URL}/status`, { timeout: 5000 });
      results.endpoints.status = {
        success: true,
        status: statusResponse.status,
        data: statusResponse.data
      };
      console.log('Status endpoint success:', statusResponse.data);
    } catch (statusError) {
      results.endpoints.status = {
        success: false,
        error: statusError.message,
        code: statusError.code || 'UNKNOWN'
      };
      console.error('Status endpoint error:', statusError.message);
    }
    
    // Test root API endpoint
    try {
      console.log('Testing root API endpoint...');
      const apiResponse = await axios.get(API_URL, { timeout: 5000 });
      results.endpoints.root = {
        success: true,
        status: apiResponse.status,
        data: apiResponse.data
      };
      console.log('Root API endpoint success:', apiResponse.data);
    } catch (apiError) {
      results.endpoints.root = {
        success: false,
        error: apiError.message,
        code: apiError.code || 'UNKNOWN'
      };
      console.error('Root API endpoint error:', apiError.message);
    }
    
    // Test WebSocket connection if browser environment
    if (typeof window !== 'undefined') {
      try {
        console.log('Testing WebSocket connection...');
        results.websocket.tested = true;
        
        const wsTest = new Promise((resolve, reject) => {
          const ws = new WebSocket(WS_URL);
          
          // Set timeout for connection
          const timeout = setTimeout(() => {
            reject(new Error('WebSocket connection timeout'));
          }, 5000);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            results.websocket.connected = true;
            console.log('WebSocket connection successful');
            
            // Close the connection after successful test
            setTimeout(() => {
              ws.close();
              resolve();
            }, 500);
          };
          
          ws.onerror = (error) => {
            clearTimeout(timeout);
            results.websocket.connected = false;
            results.websocket.error = 'WebSocket connection error';
            console.error('WebSocket error:', error);
            reject(error);
          };
        });
        
        await wsTest;
      } catch (wsError) {
        results.websocket.connected = false;
        results.websocket.error = wsError.message;
        console.error('WebSocket test error:', wsError.message);
      }
    }
    
    // Determine overall success
    const endpointResults = Object.values(results.endpoints);
    results.success = endpointResults.some(result => result.success);
    results.allEndpointsSuccessful = endpointResults.every(result => result.success);
    
    return results;
  } catch (error) {
    console.error('API Connection Test Error:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Export a function to run the test
export const runConnectionTest = () => {
  console.log('Running API connection test...');
  testApiConnection()
    .then(result => {
      console.log('Test result:', result);
    })
    .catch(err => {
      console.error('Test failed:', err);
    });
};
