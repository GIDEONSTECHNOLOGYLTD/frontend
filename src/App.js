import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/routing/PrivateRoute';
import TaskRoutes from './routes/TaskRoutes';
import DocumentRoutes from './routes/DocumentRoutes';
import SearchPage from './pages/SearchPage';
import { AdminDashboard, AuditLogs, Settings } from './pages/admin';
import TestApi from './components/TestApi';

// Main app layout with navigation
const AppLayout = ({ children }) => (
  <Layout>{children}</Layout>
);

// Main App component with routing
function App() {
  return (
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
            
            {/* Admin routes - only accessible to admin users */}
            <Route element={<PrivateRoute adminOnly={true} />}>
              <Route path="/admin">
                <Route 
                  index 
                  element={
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="audit-logs" 
                  element={
                    <AppLayout>
                      <AuditLogs />
                    </AppLayout>
                  } 
                />
                <Route 
                  path="settings" 
                  element={
                    <AppLayout>
                      <Settings />
                    </AppLayout>
                  } 
                />
              </Route>
            </Route>
            
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
            
            {/* Test API route - for development only */}
            <Route 
              path="/test-api" 
              element={
                <AppLayout>
                  <TestApi />
                </AppLayout>
              } 
            />
            
            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('Error caught by ErrorBoundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // You can log the error to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          p={3}
          sx={{
            backgroundColor: 'background.default',
            color: 'text.primary'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            We're sorry for the inconvenience. The error has been logged.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            size="large"
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
