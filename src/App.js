import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/auth/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { SearchProvider } from './context/SearchContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/routing/PrivateRoute';
import TaskRoutes from './routes/TaskRoutes';
import DocumentRoutes from './routes/DocumentRoutes';
import SearchPage from './pages/SearchPage';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

// Main app layout with navigation
const AppLayout = ({ children }) => {
  return <Layout>{children}</Layout>;
};

// Main App component with routing
function App() {
  return (
    <WebSocketProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SearchProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected routes */}
                  <Route element={<PrivateRoute />}>
                    {/* Dashboard route */}
                    <Route 
                      path="/" 
                      element={
                        <AppLayout>
                          <Dashboard />
                        </AppLayout>
                      } 
                    />
                    
                    {/* Tasks routes */}
                    <Route 
                      path="/tasks/*" 
                      element={
                        <AppLayout>
                          <TaskRoutes />
                        </AppLayout>
                      } 
                    />
                    
                    {/* Documents routes */}
                    <Route 
                      path="/documents/*" 
                      element={
                        <AppLayout>
                          <DocumentRoutes />
                        </AppLayout>
                      } 
                    />
                    
                    {/* Search route */}
                    <Route 
                      path="/search" 
                      element={
                        <AppLayout>
                          <SearchPage />
                        </AppLayout>
                      } 
                    />
                    
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </div>
            </Router>
          </SearchProvider>
        </AuthProvider>
      </ThemeProvider>
    </WebSocketProvider>
  );
}

export default App;
