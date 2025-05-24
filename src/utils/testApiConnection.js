import api from '../services/api';

/**
 * Test API connection and authentication
 * @returns {Promise<Array>} Array of test results
 */
async function testApiConnection() {
  const results = [];
  const startTime = Date.now();
  
  // Helper function to add test result
  const addResult = (name, status, message, details = null) => {
    const result = {
      name,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (details) {
      result.details = details;
    }
    
    results.push(result);
    return result;
  };

  try {
    // 1. Test health check endpoint
    try {
      const healthResponse = await api.get('/health');
      addResult(
        'Health Check',
        'success',
        'API is responding',
        healthResponse.data
      );
    } catch (error) {
      addResult(
        'Health Check',
        'error',
        'Failed to connect to API',
        error.response?.data || error.message
      );
      // If health check fails, no point in continuing other tests
      return results;
    }
    
    // 2. Test authentication
    const token = localStorage.getItem('token');
    let isAuthenticated = false;
    
    if (token) {
      try {
        const authResponse = await api.get('/auth/me');
        addResult(
          'Authentication',
          'success',
          'Successfully authenticated with existing token',
          {
            user: authResponse.data.user,
            permissions: authResponse.data.permissions
          }
        );
        isAuthenticated = true;
      } catch (authError) {
        addResult(
          'Authentication',
          'warning',
          'Existing token is invalid or expired',
          authError.response?.data || authError.message
        );
        
        // Try to login with test credentials if available
        const testEmail = process.env.REACT_APP_TEST_EMAIL || 'ceo@gideonstechnology.com';
        const testPassword = process.env.REACT_APP_TEST_PASSWORD;
        
        if (testPassword) {
          try {
            const loginResponse = await api.post('/auth/login', {
              email: testEmail,
              password: testPassword
            });
            
            if (loginResponse.data.token) {
              localStorage.setItem('token', loginResponse.data.token);
              addResult(
                'Authentication',
                'success',
                'Successfully logged in with test credentials',
                {
                  user: loginResponse.data.user,
                  token: '***' // Don't expose the actual token
                }
              );
              isAuthenticated = true;
            } else {
              addResult(
                'Authentication',
                'error',
                'Login succeeded but no token was returned'
              );
            }
          } catch (loginError) {
            addResult(
              'Authentication',
              'error',
              'Failed to login with test credentials',
              loginError.response?.data || loginError.message
            );
          }
        } else {
          addResult(
            'Authentication',
            'info',
            'Skipped login test: No test password provided in environment variables'
          );
        }
      }
    } else {
      addResult(
        'Authentication',
        'info',
        'No authentication token found. Some tests may be skipped.'
      );
    }
    
    // 3. Test protected endpoints if authenticated
    if (isAuthenticated) {
      try {
        // Test documents endpoint
        const docsResponse = await api.get('/documents');
        addResult(
          'Documents API',
          'success',
          'Successfully accessed documents',
          {
            count: Array.isArray(docsResponse.data) ? docsResponse.data.length : 0,
            hasData: !!docsResponse.data
          }
        );
        
        // Test folders endpoint
        const foldersResponse = await api.get('/folders');
        addResult(
          'Folders API',
          'success',
          'Successfully accessed folders',
          {
            count: Array.isArray(foldersResponse.data) ? foldersResponse.data.length : 0,
            hasData: !!foldersResponse.data
          }
        );
        
      } catch (apiError) {
        addResult(
          'Protected Endpoints',
          'error',
          'Failed to access protected endpoints',
          apiError.response?.data || apiError.message
        );
      }
    }
    
    // Add summary
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const total = results.length;
    
    addResult(
      'Test Summary',
      failed === 0 ? 'success' : failed === total ? 'error' : 'warning',
      `Completed ${total} tests: ${passed} passed, ${failed} failed`,
      {
        total,
        passed,
        failed,
        duration: `${Date.now() - startTime}ms`
      }
    );
    
  } catch (error) {
    addResult(
      'Test Runner',
      'error',
      'An unexpected error occurred during testing',
      error.message
    );
  }
  
  return results;
}

export default testApiConnection;
