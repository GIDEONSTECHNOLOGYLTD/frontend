import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from './auth/AuthContext';
import { AUTH_TOKEN, API_URL } from '../config';

// Safe auth hook with proper error handling
const useSafeAuth = () => {
  try {
    const auth = useAuth?.() || {};
    const safeUser = auth?.user || null;
    const token = localStorage.getItem(AUTH_TOKEN);
    
    return {
      user: safeUser,
      loading: !!auth?.loading,
      isAuthenticated: !!(safeUser && token),
      token: token
    };
  } catch (error) {
    console.warn('Error in useSafeAuth:', error);
    return { 
      user: null, 
      loading: false, 
      isAuthenticated: false,
      token: null
    };
  }
};

// Define initial context value as a separate constant
const initialContextValue = {
  socket: null,
  connectionStatus: 'disconnected',
  sendMessage: () => {
    console.warn('WebSocket sendMessage called before initialization');
  },
  isConnected: false
};

const WebSocketContext = createContext(initialContextValue);

export const WebSocketProvider = ({ children }) => {
  // State and refs
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const messageQueueRef = useRef([]);
  
  // Get auth state with safe defaults
  const authState = useSafeAuth();
  const { user, loading, isAuthenticated, token } = authState || {};
  
  // Handle WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!isMountedRef.current) return null;
    
    // Only connect if we have a token and user is authenticated
    if (!token || !isAuthenticated) {
      console.log('WebSocket: Not authenticated, skipping connection');
      return null;
    }

    // Close existing connection if any
    if (socket) {
      socket.close();
      setSocket(null);
    }

    try {
      // Use wss:// for production, ws:// for development
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const wsUrl = `${protocol}${new URL(API_URL).host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      const newSocket = new WebSocket(wsUrl);
      setConnectionStatus('connecting');

      newSocket.onopen = () => {
        if (!isMountedRef.current) return;
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Process any queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          newSocket.send(JSON.stringify(message));
        }
        
        // Send authentication token
        newSocket.send(JSON.stringify({
          type: 'AUTH',
          token: token
        }));
      };

      newSocket.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.log('WebSocket disconnected:', event);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          reconnectAttemptsRef.current += 1;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connectWebSocket();
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      newSocket.onerror = (error) => {
        if (!isMountedRef.current) return;
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      newSocket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          // Handle incoming messages here if needed
          console.log('WebSocket message received:', message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      setSocket(newSocket);
      return newSocket;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setConnectionStatus('error');
      return null;
    }
  }, [token, isAuthenticated, socket]);

  // Connect on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && token && isMountedRef.current) {
      const ws = connectWebSocket();
      return () => {
        if (ws && ws.close) {
          try {
            ws.close();
          } catch (error) {
            console.error('Error closing WebSocket:', error);
          }
        }
      };
    }
    return () => {}; // No-op cleanup if not authenticated
  }, [isAuthenticated, token, connectWebSocket]);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      // Queue the message if not connected
      messageQueueRef.current.push(message);
      
      // Try to reconnect if not already connecting
      if (connectionStatus !== 'connecting') {
        connectWebSocket();
      }
    }
  }, [socket, connectionStatus, connectWebSocket]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('WebSocketProvider - Auth state:', { 
        hasUser: !!user, 
        loading, 
        isAuthenticated,
        hasToken: !!token
      });
    }
  }, [user, loading, isAuthenticated, token]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket connection if it exists
      if (socket) {
        try {
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close(1000, 'Component unmounting');
          }
        } catch (error) {
          console.error('Error closing WebSocket on unmount:', error);
        }
        setSocket(null);
      }
      
      // Clear message queue
      messageQueueRef.current = [];
    };
  }, [socket]);

  // Context value with memoization
  const contextValue = useMemo(() => ({
    socket,
    connectionStatus,
    sendMessage,
    isConnected: connectionStatus === 'connected'
  }), [socket, connectionStatus, sendMessage]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Helper hook for components that need to know about connection status
export const useWebSocketStatus = () => {
  const { connectionStatus, isConnected } = useWebSocket();
  return { connectionStatus, isConnected };
};

export default WebSocketContext;
