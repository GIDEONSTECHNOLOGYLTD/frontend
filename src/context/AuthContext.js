import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';
import { AUTH_TOKEN } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user from token
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN);
    if (!token) {
      setIsLoading(false);
      return null;
    }

    try {
      // Set auth token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user data from token
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check token expiration
      if (decoded.exp < currentTime) {
        localStorage.removeItem(AUTH_TOKEN);
        delete api.defaults.headers.common['Authorization'];
        return null;
      }

      // Fetch user data from API
      const response = await api.get('/auth/me');
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Error loading user', err);
      localStorage.removeItem(AUTH_TOKEN);
      delete api.defaults.headers.common['Authorization'];
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login user
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem(AUTH_TOKEN, token);
      
      // Set auth token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user in state
      setUser(user);
      
      // Redirect to intended location or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
      return user;
    } catch (err) {
      console.error('Login error', err);
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = useCallback(() => {
    // Remove token from localStorage
    localStorage.removeItem(AUTH_TOKEN);
    
    // Remove auth header
    delete api.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    
    // Redirect to login
    navigate('/login');
  }, [navigate]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  // Check if user has admin role
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Load user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      await loadUser();
    };
    
    initializeAuth();
  }, [loadUser]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        error,
        login, 
        logout, 
        isAuthenticated,
        isAdmin,
        loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
