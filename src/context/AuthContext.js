import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock login/logout functions for testing
  const login = async (credentials) => {
    // This would be an actual API call in production
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    setUser(mockUser);
    return mockUser;
  };

  const logout = async () => {
    setUser(null);
  };

  useEffect(() => {
    // Check for existing session
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
