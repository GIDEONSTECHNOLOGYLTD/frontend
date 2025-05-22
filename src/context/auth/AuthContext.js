import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL, AUTH_TOKEN } from '../../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN);
      
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setUser(res.data.data);
    } catch (err) {
      console.error('Error loading user', err);
      localStorage.removeItem(AUTH_TOKEN);
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
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      
      if (res.data.token) {
        localStorage.setItem(AUTH_TOKEN, res.data.token);
        await loadUser();
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.error || 'Login failed'
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
        error,
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
