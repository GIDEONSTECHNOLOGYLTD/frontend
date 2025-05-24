import api from './api';

/**
 * Simple test script to verify API connection
 * Run this with: node -r @babel/register src/utils/testApiConnectionScript.js
 */

async function testApiConnection() {
  console.log('Starting API connection test...');
  
  try {
    // 1. Test health check endpoint
    console.log('\n1. Testing health check endpoint...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // 2. Check authentication status
    console.log('\n2. Checking authentication status...');
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log('🔑 Token found in localStorage');
      try {
        const authResponse = await api.get('/auth/me');
        console.log('✅ Authentication successful:', {
          user: authResponse.data.user,
          permissions: authResponse.data.permissions
        });
        
        // 3. Test protected endpoints if authenticated
        console.log('\n3. Testing protected endpoints...');
        
        // Test documents endpoint
        try {
          const docsResponse = await api.get('/documents');
          console.log('✅ Documents endpoint:', {
            count: Array.isArray(docsResponse.data) ? docsResponse.data.length : 0,
            hasData: !!docsResponse.data
          });
        } catch (docsError) {
          console.error('❌ Failed to access documents:', docsError.response?.data || docsError.message);
        }
        
        // Test folders endpoint
        try {
          const foldersResponse = await api.get('/folders');
          console.log('✅ Folders endpoint:', {
            count: Array.isArray(foldersResponse.data) ? foldersResponse.data.length : 0,
            hasData: !!foldersResponse.data
          });
        } catch (foldersError) {
          console.error('❌ Failed to access folders:', foldersError.response?.data || foldersError.message);
        }
        
      } catch (authError) {
        console.warn('⚠️ Authentication failed with existing token:', authError.message);
      }
    } else {
      console.log('ℹ️ No authentication token found. Some tests will be skipped.');
    }
    
    console.log('\n🎉 API connection test completed!');
    
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    console.error('Error config:', error.config);
  }
}

// Run the test
testApiConnection().catch(console.error);
