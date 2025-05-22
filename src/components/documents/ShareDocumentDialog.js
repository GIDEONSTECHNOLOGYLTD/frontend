import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Close as CloseIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { API_URL } from '../../config';

const PERMISSIONS = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
  { value: 'manage', label: 'Can manage' },
];

const ShareDocumentDialog = ({ open, onClose, document, onShare }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState('view');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('gts_token');
      const response = await fetch(
        `${API_URL}/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const currentUserId = JSON.parse(localStorage.getItem('user'))._id;
      const existingUserIds = document.access.map(a => a.user._id || a.user);
      setUsers(
        data.data.filter(
          user => user._id !== currentUserId && !existingUserIds.includes(user._id)
        )
      );
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, document.access]);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  const handleShare = async () => {
    if (!selectedUser || !permission) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('gts_token');
      const response = await fetch(
        `${API_URL}/documents/${document._id}/share`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: selectedUser._id,
            permission
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to share document');
      }

      const result = await response.json();
      onShare && onShare(result.data);
      handleClose();
    } catch (err) {
      console.error('Error sharing document:', err);
      setError('Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccess = async (userId) => {
    if (window.confirm('Are you sure you want to remove access?')) {
      try {
        setLoading(true);
        const token = localStorage.getItem('gts_token');
        const response = await fetch(
          `${API_URL}/documents/${document._id}/share/${userId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to remove access');
        }

        const result = await response.json();
        onShare && onShare(result.data);
      } catch (err) {
        console.error('Error removing access:', err);
        setError('Failed to remove access');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setPermission('view');
    setError('');
    onClose();
  };

  const getPermissionLabel = (value) => {
    const perm = PERMISSIONS.find(p => p.value === value);
    return perm ? perm.label : value;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>Share "{document?.name}"</span>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Share with people
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.name || option.email}
              value={selectedUser}
              onChange={(_, newValue) => setSelectedUser(newValue)}
              onInputChange={(_, value) => setSearchQuery(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Enter name or email"
                  variant="outlined"
                  size="small"
                  fullWidth
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography>{option.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.email}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText="No users found"
              style={{ flex: 1 }}
            />
            <FormControl variant="outlined" size="small" style={{ minWidth: 150 }}>
              <InputLabel id="permission-label">Permission</InputLabel>
              <Select
                labelId="permission-label"
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                label="Permission"
              >
                {PERMISSIONS.map((perm) => (
                  <MenuItem key={perm.value} value={perm.value}>
                    {perm.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleShare}
              disabled={!selectedUser || loading}
              startIcon={<PersonAddIcon />}
            >
              Share
            </Button>
          </Box>
          {error && (
            <Typography color="error" variant="caption">
              {error}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            People with access
          </Typography>
          {document?.access?.length > 0 ? (
            <List dense>
              {document.access.map((access) => (
                <ListItem key={access.user._id || access.user} divider>
                  <ListItemText
                    primary={access.user.name || access.user.email}
                    secondary={access.user.email}
                  />
                  <ListItemText
                    primary={getPermissionLabel(access.permission)}
                    primaryTypographyProps={{ align: 'right' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveAccess(access.user._id || access.user)}
                      disabled={loading}
                      size="large"
                    >
                      <CloseIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No one else has access to this document
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDocumentDialog;
