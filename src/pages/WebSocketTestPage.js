import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button, TextField, List, ListItem, Divider, CircularProgress, Alert } from '@mui/material';
import { WS_URL } from '../config';

/**
 * Component for testing WebSocket connectivity
 */
const WebSocketTestPage = () => {
  const [status, setStatus] = useState({
    connected: false,
    connecting: false,
    error: null
  });
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  // Connect to WebSocket
  const connectWebSocket = () => {
    setStatus({ connected: false, connecting: true, error: null });
    
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        setStatus({ connected: true, connecting: false, error: null });
        setMessages(prev => [...prev, { type: 'system', text: 'Connected to WebSocket server' }]);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, { type: 'received', text: JSON.stringify(data, null, 2), raw: data }]);
        } catch (e) {
          setMessages(prev => [...prev, { type: 'received', text: event.data }]);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus({ connected: false, connecting: false, error: 'WebSocket connection error' });
        setMessages(prev => [...prev, { type: 'error', text: 'WebSocket error occurred' }]);
      };
      
      ws.onclose = () => {
        setStatus({ connected: false, connecting: false, error: null });
        setMessages(prev => [...prev, { type: 'system', text: 'Disconnected from WebSocket server' }]);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setStatus({ connected: false, connecting: false, error: error.message });
    }
  };

  // Disconnect from WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Send message through WebSocket
  const sendMessage = () => {
    if (wsRef.current && message.trim() !== '') {
      try {
        // Try to parse as JSON first
        let messageToSend;
        try {
          messageToSend = JSON.parse(message);
        } catch (e) {
          // If not valid JSON, send as string
          messageToSend = message;
        }
        
        wsRef.current.send(typeof messageToSend === 'object' ? JSON.stringify(messageToSend) : messageToSend);
        setMessages(prev => [...prev, { type: 'sent', text: message }]);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => [...prev, { type: 'error', text: `Error sending message: ${error.message}` }]);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>WebSocket Test</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          This page allows you to test the WebSocket connection. Connect to the WebSocket server and send/receive messages.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {!status.connected ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={connectWebSocket}
              disabled={status.connecting}
            >
              {status.connecting ? <CircularProgress size={24} /> : 'Connect to WebSocket'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={disconnectWebSocket}
            >
              Disconnect
            </Button>
          )}
        </Box>
        
        {status.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {status.error}
          </Alert>
        )}
        
        {status.connected && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Connected to WebSocket server at {WS_URL}
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>Messages</Typography>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            height: '300px', 
            overflowY: 'auto', 
            p: 2, 
            mb: 2, 
            bgcolor: '#f5f5f5'
          }}
        >
          <List>
            {messages.length === 0 && (
              <ListItem>
                <Typography variant="body2" color="textSecondary">
                  No messages yet. Connect to the WebSocket server to start.
                </Typography>
              </ListItem>
            )}
            
            {messages.map((msg, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                  <Typography 
                    variant="caption" 
                    color={
                      msg.type === 'system' ? 'text.secondary' : 
                      msg.type === 'sent' ? 'primary.main' : 
                      msg.type === 'received' ? 'success.main' : 
                      'error.main'
                    }
                    sx={{ fontWeight: 'bold', mb: 0.5 }}
                  >
                    {msg.type === 'system' ? 'SYSTEM' : 
                     msg.type === 'sent' ? 'SENT' : 
                     msg.type === 'received' ? 'RECEIVED' : 
                     'ERROR'}
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      m: 0, 
                      p: 1, 
                      bgcolor: 'background.paper', 
                      borderRadius: 1,
                      width: '100%',
                      overflow: 'auto',
                      fontSize: '0.875rem'
                    }}
                  >
                    {msg.text}
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
        
        {status.connected && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Message"
              variant="outlined"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message or JSON object"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button 
              variant="contained" 
              onClick={sendMessage}
              disabled={!message.trim()}
            >
              Send
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default WebSocketTestPage;
