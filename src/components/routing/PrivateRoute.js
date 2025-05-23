import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * PrivateRoute component that protects routes requiring authentication
 * @param {Object} props - Component props
 * @param {boolean} [props.adminOnly=false] - If true, only allows access to admin users
 * @returns {JSX.Element} - The rendered component
 */
const PrivateRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If adminOnly is true and user is not an admin, show access denied
  if (adminOnly && user?.role !== 'admin') {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        flexDirection="column"
      >
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  // If authenticated and (not adminOnly or user is admin), render the route
  return <Outlet />;
};

export default PrivateRoute;
