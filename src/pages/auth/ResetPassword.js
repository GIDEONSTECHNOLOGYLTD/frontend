import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  CircularProgress,
  IconButton,
  InputAdornment as MuiInputAdornment
} from '@mui/material';
import { 
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  
  const { validateResetToken, resetPassword } = useAuth();

  // Validate the reset token when component mounts
  useEffect(() => {
    const checkToken = async () => {
      try {
        setLoading(true);
        await validateResetToken(token);
        setTokenValid(true);
      } catch (err) {
        console.error('Token validation error:', err);
        setError('This password reset link is invalid or has expired.');
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      checkToken();
    } else {
      setError('Invalid reset link');
      setTokenValid(false);
    }
  }, [token, validateResetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      await resetPassword(token, password);
      setSuccess('Your password has been reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful. Please login with your new password.' 
          } 
        });
      }, 3000);
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  if (loading && tokenValid === null) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (tokenValid === false) {
    return (
      <Container component="main" maxWidth="sm">
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
            <Typography component="h1" variant="h5" color="error" sx={{ mb: 3, textAlign: 'center' }}>
              Invalid or Expired Link
            </Typography>
            
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error || 'This password reset link is invalid or has expired. Please request a new one.'}
            </Alert>
            
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/forgot-password"
              fullWidth
              sx={{ mt: 2 }}
            >
              Request New Reset Link
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                  Back to Login
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

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
          <Button
            component={RouterLink}
            to="/forgot-password"
            startIcon={<ArrowBackIcon />}
            sx={{ alignSelf: 'flex-start', mb: 2, textTransform: 'none' }}
          >
            Back
          </Button>
          
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Reset Your Password
          </Typography>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Please enter your new password below.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success ? (
            <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
              {success}
            </Alert>
          ) : (
            <Box 
              component="form" 
              onSubmit={handleSubmit}
              sx={{ width: '100%', mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <MuiInputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </MuiInputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
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
                  'Reset Password'
                )}
              </Button>
            </Box>
          )}
          
          <Box sx={{ textAlign: 'center', mt: 2, width: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'none' }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
