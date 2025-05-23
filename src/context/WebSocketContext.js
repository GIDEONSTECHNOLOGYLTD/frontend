import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth/AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth() || {}; // Add fallback for undefined auth
  const [socket, setSocket] = useState(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  const connectWebSocket = () => {
    if (!isMounted.current) return;
    
    try {
      // Close existing socket if any
      if (socket) {
        socket.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        if (!isMounted.current) {
          ws.close();
          return;
        }
        
        console.log('WebSocket Connected');
        reconnectAttempts.current = 0;
        
        // Only try to authenticate if we have a token
        const token = localStorage.getItem('gts_token');
        if (token) {
          try {
            ws.send(JSON.stringify({
              type: 'AUTH',
              token
            }));
          } catch (err) {
            console.error('Failed to send auth message:', err);
          }
        }
      };

      ws.onclose = () => {
        console.log('WebSocket Disconnected');
        // Attempt to reconnect with exponential backoff
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current <= 5) { // Max 5 retries
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              connectWebSocket();
            }
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        ws.close();
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [socket]);

  // Connect on mount and when user changes
  useEffect(() => {
    if (user) {
      connectWebSocket();
    }
    // Cleanup is handled by the other effect
  }, [user]);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};

export default WebSocketContext;
