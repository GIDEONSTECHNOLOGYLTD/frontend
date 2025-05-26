import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  TextField,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CloudOff as DisconnectedIcon, 
  CloudQueue as ConnectingIcon, 
  CloudDone as ConnectedIcon,
  ErrorOutline as ErrorIcon,
  Cached as ReconnectingIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { CONNECTION_STATUS } from '../context/WebSocketContext';
import useWebSocketHook from '../hooks/useWebSocketHook';

const statusIcons = {
  [CONNECTION_STATUS.DISCONNECTED]: <DisconnectedIcon color="error" />,
  [CONNECTION_STATUS.CONNECTING]: <ConnectingIcon color="info" />,
  [CONNECTION_STATUS.CONNECTED]: <ConnectedIcon color="info" />,
  [CONNECTION_STATUS.AUTHENTICATING]: <ConnectingIcon color="info" />,
  [CONNECTION_STATUS.AUTHENTICATED]: <ConnectedIcon color="success" />,
  [CONNECTION_STATUS.ERROR]: <ErrorIcon color="error" />,
  [CONNECTION_STATUS.RECONNECTING]: <ReconnectingIcon color="warning" />,
};

const statusColors = {
  [CONNECTION_STATUS.DISCONNECTED]: 'error',
  [CONNECTION_STATUS.CONNECTING]: 'info',
  [CONNECTION_STATUS.CONNECTED]: 'info',
  [CONNECTION_STATUS.AUTHENTICATING]: 'info',
  [CONNECTION_STATUS.AUTHENTICATED]: 'success',
  [CONNECTION_STATUS.ERROR]: 'error',
  [CONNECTION_STATUS.RECONNECTING]: 'warning',
};

const WebSocketStatus = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  // Initialize WebSocket hook
  const {
    isConnected,
    isAuthenticated,
    connectionStatus,
    connectionId,
    userId,
    sendMessage,
    isConnecting,
    hasError,
    reconnect
  } = useWebSocketHook({
    messageTypes: ['test', 'notification', 'error'],
    onMessage: (message, type) => {
      setMessages(prev => [
        { 
          id: Date.now(),
          type,
          content: message,
          timestamp: new Date().toISOString()
        },
        ...prev
      ].slice(0, 50)); // Keep only the last 50 messages
    }
  });

  // Show snackbar notification
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessage('test', { content: message });
      setMessage('');
      showSnackbar('Message sent successfully', 'success');
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  }, [message, sendMessage, showSnackbar]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    reconnect();
    showSnackbar('Attempting to reconnect...', 'info');
  }, [reconnect, showSnackbar]);

  // Copy connection ID to clipboard
  const copyConnectionId = useCallback(() => {
    if (!connectionId) return;
    navigator.clipboard.writeText(connectionId);
    showSnackbar('Connection ID copied to clipboard', 'success');
  }, [connectionId, showSnackbar]);

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 2 }}>
          {statusIcons[connectionStatus] || <DisconnectedIcon />}
        </Box>
        <Typography variant="h6" component="div">
          WebSocket Status: {connectionStatus}
        </Typography>
        
        {isConnecting && (
          <CircularProgress size={24} sx={{ ml: 2 }} />
        )}
        
        {hasError && (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleReconnect}
            sx={{ ml: 'auto' }}
            startIcon={<ReconnectingIcon />}
          >
            Reconnect
          </Button>
        )}
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="textSecondary">Connection Details</Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Status" 
              secondary={connectionStatus} 
              secondaryTypographyProps={{ 
                color: statusColors[connectionStatus] || 'textSecondary',
                fontWeight: 'medium'
              }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Connection ID" 
              secondary={
                connectionId ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {connectionId}
                    </Typography>
                    <Tooltip title="Copy to clipboard">
                      <IconButton size="small" onClick={copyConnectionId}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ) : 'Not connected'
              } 
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="User ID" 
              secondary={userId || 'Not authenticated'} 
            />
          </ListItem>
          
          <ListItem>
            <ListItemText 
              primary="Authenticated" 
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: isAuthenticated ? 'success.main' : 'error.main',
                      mr: 1
                    }} 
                  />
                  {isAuthenticated ? 'Yes' : 'No'}
                </Box>
              } 
            />
          </ListItem>
        </List>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>Send Test Message</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={!isConnected}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSendMessage}
            disabled={!isConnected || !message.trim()}
            endIcon={<SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>Recent Messages</Typography>
        {messages.length > 0 ? (
          <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'action.hover', borderRadius: 1, p: 1 }}>
            {messages.map((msg) => (
              <ListItem key={msg.id} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {msg.type === 'error' ? 
                    <ErrorIcon color="error" fontSize="small" /> : 
                    <SendIcon color="action" fontSize="small" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary={msg.content?.content || JSON.stringify(msg.content)}
                  secondary={`${new Date(msg.timestamp).toLocaleTimeString()} • ${msg.type}`}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
            No messages received yet
          </Typography>
        )}
      </Box>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default WebSocketStatus;
