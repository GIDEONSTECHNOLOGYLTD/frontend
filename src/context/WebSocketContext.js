import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';

// Create a safe useAuth hook that won't throw if AuthContext is not available
const useSafeAuth = () => {
  try {
    return useAuth() || {};
  } catch (error) {
    console.warn('AuthContext not available, using empty auth object');
    return {};
  }
};

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  // Use the safe auth hook
  const { user } = useSafeAuth();
  const [socket, setSocket] = useState(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  const socketRef = useRef(null);
  
  // Memoize the connect function to prevent unnecessary recreations
  const connectWebSocket = useCallback(() => {
    if (!isMounted.current) return null;
    
    try {
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      socketRef.current = ws;

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
        if (!isMounted.current) return;
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
      };

      setSocket(ws);
      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return null;
    }
  }, []); // No dependencies, we use refs for everything that changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Connect on mount and when user changes
  useEffect(() => {
    // Always try to connect, but only authenticate if user is available
    const ws = connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [connectWebSocket]);

  // Only render children once we have a socket or have attempted to connect
  return (
    <WebSocketContext.Provider value={socket}>
      {socket !== undefined ? children : null}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const socket = useContext(WebSocketContext);
  if (socket === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return socket;
};

export default WebSocketContext;
