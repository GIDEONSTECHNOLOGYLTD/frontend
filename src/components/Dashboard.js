import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import { Container, Typography, Button, Box, Paper } from '@mui/material';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography component="h1" variant="h4">
            Dashboard
          </Typography>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user?.name}!
          </Typography>
          <Typography variant="body1" paragraph>
            Email: {user?.email}
          </Typography>
          <Typography variant="body1">
            Role: {user?.role}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ '& > *': { m: 1 } }}>
            <Button variant="contained" color="primary">
              View Projects
            </Button>
            <Button variant="contained" color="primary">
              View Team
            </Button>
            <Button variant="contained" color="primary">
              View Reports
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
