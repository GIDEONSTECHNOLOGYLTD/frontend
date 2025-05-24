import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Paper,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      await forgotPassword(email);
      setSuccess('Password reset link has been sent to your email address');
      
      // Clear form
      setEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Forgot Password
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
              {success}
            </Alert>
          )}
          
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ width: '100%', mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Remember your password?{' '}
                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
