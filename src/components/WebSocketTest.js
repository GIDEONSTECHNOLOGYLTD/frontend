import React, { useState, useEffect } from 'react';
import { useWebSocket, useWebSocketStatus } from '../context/WebSocketContext';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';

const WebSocketTest = () => {
  const { socket } = useWebSocket();
  const connectionStatus = useWebSocketStatus();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { 
          type: 'received', 
          text: JSON.stringify(data, null, 2),
          timestamp: new Date().toLocaleTimeString()
        }]);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  // Update connection status
  useEffect(() => {
    setIsConnected(connectionStatus === 'connected');
  }, [connectionStatus]);

  const sendMessage = () => {
    if (!socket || !isConnected || !inputMessage.trim()) return;

    try {
      const message = {
        type: 'ECHO',
        content: inputMessage,
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(message));
      
      setMessages(prev => [...prev, {
        type: 'sent',
        text: inputMessage,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        text: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const theme = useTheme();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
      case 'reconnecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMessageBgColor = (type) => {
    switch (type) {
      case 'sent':
        return theme.palette.primary.light;
      case 'received':
        return theme.palette.success.light;
      case 'error':
        return theme.palette.error.light;
      default:
        return theme.palette.grey[100];
    }
  };

  const getMessageTextColor = (type) => {
    switch (type) {
      case 'sent':
        return theme.palette.primary.contrastText;
      case 'received':
        return theme.palette.success.contrastText;
      case 'error':
        return theme.palette.error.contrastText;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              WebSocket Connection Test
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item>
                  <Typography variant="subtitle1" component="span">
                    Status:
                  </Typography>
                </Grid>
                <Grid item>
                  <Chip 
                    label={connectionStatus} 
                    color={getStatusColor()}
                    size="small"
                  />
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary">
                {socket ? `Connected to: ${socket.url}` : 'Not connected'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Grid container spacing={1} alignItems="flex-end">
                <Grid item xs>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message to echo..."
                    disabled={!isConnected}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={!isConnected || !inputMessage.trim()}
                    sx={{ height: '40px' }}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary">
                {isConnected 
                  ? 'Type a message and press Enter or click Send to test the WebSocket connection.'
                  : 'Connect to the server to send messages.'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Message Log
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: 300, 
                overflow: 'auto',
                bgcolor: 'background.default'
              }}
            >
              {messages.length === 0 ? (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height="100%"
                >
                  <Typography color="text.secondary">
                    No messages yet
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ '& > *': { mb: 1 } }}>
                  {messages.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: getMessageBgColor(msg.type),
                        color: getMessageTextColor(msg.type),
                        maxWidth: '80%',
                        ml: msg.type === 'received' ? 'auto' : 0,
                        mr: msg.type === 'sent' ? 'auto' : 0,
                        mb: 1.5,
                      }}
                    >
                      <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography variant="subtitle2" component="span">
                          {msg.type === 'sent' ? 'Sent' : msg.type === 'received' ? 'Received' : 'Error'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8, ml: 1 }}>
                          {msg.timestamp}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        component="pre"
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          m: 0,
                          wordBreak: 'break-word'
                        }}
                      >
                        {msg.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default WebSocketTest;
