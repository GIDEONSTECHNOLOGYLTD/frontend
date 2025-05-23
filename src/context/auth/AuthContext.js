import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL, AUTH_TOKEN } from '../../config.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed unused error state to clean up the code

  // Check if user is logged in on initial load
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN);
      
      if (!token) {
        console.log('No auth token found in localStorage');
        setLoading(false);
        return;
      }

      console.log('Loading user with token:', token.substring(0, 10) + '...');
      
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('User loaded successfully:', res.data.data);
      setUser(res.data.data);
    } catch (err) {
      console.error('Error loading user:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Clear invalid token
      localStorage.removeItem(AUTH_TOKEN);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, formData);
      
      if (res.data.token) {
        localStorage.setItem(AUTH_TOKEN, res.data.token);
        await loadUser();
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || 'Registration failed'
      };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      console.log('Attempting login with:', formData.email);
      const res = await axios.post(`${API_URL}/auth/login`, formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (res.data.token) {
        console.log('Login successful, token received');
        localStorage.setItem(AUTH_TOKEN, res.data.token);
        await loadUser();
        return { success: true };
      }
      
      throw new Error('No token received in response');
    } catch (err) {
      console.error('Login error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      
      return {
        success: false,
        message: err.response?.data?.error || 'Login failed. Please check your credentials.'
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: !!user
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
