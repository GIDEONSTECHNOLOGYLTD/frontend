import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';

// Create a more robust safe auth hook
const useSafeAuth = () => {
  try {
    const auth = useAuth();
    return auth || { user: null, loading: true };
  } catch (error) {
    console.warn('AuthContext not available, using fallback');
    return { user: null, loading: false };
  }
};

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user, loading } = useSafeAuth();
  const [socket, setSocket] = useState(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  const socketRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (!isMounted.current || loading) return null;
    
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
        
        // Only try to authenticate if we have a user
        if (user) {
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
        }
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        console.log('WebSocket Disconnected');
        
        // Only attempt to reconnect if we're still mounted
        if (isMounted.current && reconnectAttempts.current < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
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
  }, [user, loading]);

  // Connect on mount and when user/auth state changes
  useEffect(() => {
    if (!loading) {
      const ws = connectWebSocket();
      return () => {
        if (ws) {
          ws.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [connectWebSocket, loading]);

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

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
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
