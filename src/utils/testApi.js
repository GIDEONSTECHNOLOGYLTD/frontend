import axios from 'axios';

const testApi = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5005/api/v1/health');
    console.log('Health check passed:', healthResponse.data);
    
    // Test authentication
    console.log('Testing authentication...');
    const authResponse = await axios.post('http://localhost:5005/api/v1/auth/login', {
      email: 'ceo@gideonstechnology.com',
      password: process.env.REACT_APP_TEST_PASSWORD || 'your-password-here'
    });
    
    console.log('Authentication successful:', authResponse.data);
    const token = authResponse.data.token;
    
    // Test authenticated endpoint
    console.log('Testing authenticated endpoint...');
    const userResponse = await axios.get('http://localhost:5005/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('User data:', userResponse.data);
    return { success: true };
  } catch (error) {
    console.error('API test failed:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

export default testApi;
