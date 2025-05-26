import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * PublicRoute component that redirects authenticated users away from public routes
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.children] - Child elements to render
 * @param {string} [props.redirectTo] - Path to redirect to if user is authenticated
 * @returns {JSX.Element} - The rendered component
 */
const PublicRoute = ({ 
  children = <Outlet />, 
  redirectTo = '/dashboard' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // If authenticated, redirect to the specified route or home
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If not authenticated, render the public route
  return children;
};

export default PublicRoute;
