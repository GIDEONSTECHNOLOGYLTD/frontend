import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Button,
  useTheme 
} from '@mui/material';

/**
 * PrivateRoute component that protects routes requiring authentication
 * @param {Object} props - Component props
 * @param {boolean} [props.adminOnly=false] - If true, only allows access to admin users
 * @returns {JSX.Element} - The rendered component
 */
const PrivateRoute = ({ adminOnly = false, children = <Outlet /> }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const theme = useTheme();

  // Show loading state
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
        sx={{
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If adminOnly is true and user is not an admin, show access denied
  if (adminOnly && !(user?.role === 'admin')) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        flexDirection="column"
        p={3}
        sx={{
          textAlign: 'center',
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" gutterBottom>
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.history.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  // If we get here, user is authenticated and has the required role
  return children;
};

export default PrivateRoute;
