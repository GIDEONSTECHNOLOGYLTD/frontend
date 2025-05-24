import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Button,
  Paper
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: '8rem',
              fontWeight: 'bold',
              color: 'primary.main',
              lineHeight: 1,
              mb: 2,
            }}
          >
            404
          </Typography>
          
          <Typography variant="h4" component="h1" gutterBottom>
            Oops! Page not found
          </Typography>
          
          <Typography variant="body1" color="textSecondary" paragraph sx={{ maxWidth: '600px', mb: 4 }}>
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/"
            size="large"
            startIcon={<HomeIcon />}
            sx={{ mt: 2 }}
          >
            Go to Homepage
          </Button>
          
          <Box sx={{ mt: 6, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Here are some helpful links:
            </Typography>
            <Button 
              component={RouterLink} 
              to="/dashboard" 
              variant="text" 
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Dashboard
            </Button>
            <Button 
              component={RouterLink} 
              to="/profile" 
              variant="text" 
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Profile
            </Button>
            <Button 
              component={RouterLink} 
              to="/settings" 
              variant="text" 
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Settings
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
