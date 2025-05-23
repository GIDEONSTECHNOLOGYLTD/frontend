import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/auth/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Snackbar,
  Alert,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Delete, AdminPanelSettings, Person } from '@mui/icons-material';

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get token from localStorage
      const token = localStorage.getItem('gts_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching users with token:', token.substring(0, 10) + '...');
      
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Users fetched successfully:', response.data.data);
      setUsers(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      console.error('Error fetching users:', {
        error: errorMessage,
        status: err.response?.status,
        data: err.response?.data
      });
      
      setError(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        // Clear any existing auth data
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleMakeAdmin = async (userId) => {
    try {
      setLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('gts_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Find the user to update
      const userToUpdate = users.find(u => u._id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }
      
      console.log('Promoting user to admin:', {
        userId: userToUpdate._id,
        email: userToUpdate.email
      });
      
      // Make the API call to promote user to admin
      const response = await axios.post(
        `${API_URL}/admin/make-admin`,
        { email: userToUpdate.email },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Promote to admin response:', response.data);
      
      // Refresh the users list
      await fetchUsers();
      
      // Show success message
      showSnackbar(
        response.data.message || 'User promoted to admin successfully', 
        'success'
      );
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         err.message || 
                         'Failed to promote user to admin';
      
      console.error('Error promoting user to admin:', {
        error: errorMessage,
        status: err.response?.status,
        data: err.response?.data
      });
      
      showSnackbar(errorMessage, 'error');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('authToken');
        await axios.delete(`${API_URL}/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUsers(users.filter(user => user._id !== userId));
        showSnackbar('User deleted successfully', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.error || 'Failed to delete user', 'error');
      }
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/admin/make-admin`,
        { email },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setEmail('');
      setOpenDialog(false);
      await fetchUsers();
      showSnackbar('User promoted to admin successfully', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to add admin', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  if (user?.role !== 'admin') {
    return (
      <Box textAlign="center" mt={4}>
        <Typography variant="h6">Access Denied</Typography>
        <Typography>You don't have permission to access this page.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Admin Panel</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
          startIcon={<AdminPanelSettings />}
        >
          Add Admin
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((userItem) => (
                <TableRow key={userItem._id}>
                  <TableCell>{userItem.name}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {userItem.role === 'admin' ? (
                        <>
                          <AdminPanelSettings color="primary" style={{ marginRight: 8 }} />
                          Admin
                        </>
                      ) : (
                        <>
                          <Person style={{ marginRight: 8 }} />
                          User
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {userItem.role !== 'admin' && (
                      <IconButton
                        color="primary"
                        onClick={() => handleMakeAdmin(userItem._id)}
                        title="Make Admin"
                        disabled={userItem._id === user._id}
                      >
                        <AdminPanelSettings />
                      </IconButton>
                    )}
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteUser(userItem._id)}
                      disabled={userItem._id === user._id}
                      title="Delete User"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <form onSubmit={handleAddAdmin}>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="User Email"
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mt: 2, minWidth: '400px' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" color="primary" variant="contained">
              Add Admin
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;
