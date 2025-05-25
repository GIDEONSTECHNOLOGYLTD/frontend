import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AUTH_TOKEN, API_URL } from '../config';

// Default WebSocket context value
const defaultContextValue = {
  socket: null,
  isConnected: false,
  sendMessage: () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('WebSocket sendMessage called before initialization');
    }
  },
};

// Create WebSocket context with default value
const WebSocketContext = createContext(defaultContextValue);

// Custom hook to safely access the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  // Track connection state
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef(null);
  const isMounted = useRef(true);
  const messageQueue = useRef([]);
  const ws = useRef(null);

  // Get the authentication token
  const getToken = useCallback(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN) || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }, []);

  // Process any queued messages
  const processQueue = useCallback(() => {
    while (messageQueue.current.length > 0 && ws.current?.readyState === WebSocket.OPEN) {
      const message = messageQueue.current.shift();
      try {
        ws.current.send(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending queued message:', err);
      }
    }
  }, []);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!isMounted.current) return;

    const token = getToken();
    if (!token) {
      console.log('No auth token available, not connecting WebSocket');
      return;
    }

    try {
      // Close existing connection if any
      if (ws.current) {
        try {
          ws.current.close();
        } catch (err) {
          console.error('Error closing existing WebSocket:', err);
        }
      }

      // Explicitly construct WebSocket URL for production
      let wsUrl;
      if (process.env.NODE_ENV === 'production') {
        // In production, use the backend URL directly
        wsUrl = 'wss://gideons-tech-suite.onrender.com/ws';
      } else {
        // In development, construct from API_URL
        const apiUrl = new URL(API_URL);
        const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsPath = apiUrl.pathname.replace(/\/api\/v1$/, '');
        wsUrl = `${protocol}//${apiUrl.host}${wsPath}/ws`;
      }
      
      const newSocket = new WebSocket(wsUrl);
      ws.current = newSocket;

      newSocket.onopen = () => {
        if (!isMounted.current) {
          newSocket.close();
          return;
        }
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        processQueue();
      };

      newSocket.onclose = () => {
        if (!isMounted.current) return;
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          
          console.log(`Reconnecting in ${timeout}ms...`);
          reconnectTimeout.current = setTimeout(connect, timeout);
        }
      };

      newSocket.onerror = (error) => {
        if (!isMounted.current) return;
        console.error('WebSocket error:', error);
      };

      // Socket is managed by the ref, no need to set state
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      setIsConnected(false);
    }
  }, [getToken, processQueue]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message) => {
    if (!isMounted.current) return;

    try {
      const messageStr = JSON.stringify(message);
      
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(messageStr);
      } else {
        console.log('WebSocket not connected, queuing message');
        messageQueue.current.push(message);
        // Try to reconnect if not already connected
        if (reconnectAttempts.current === 0) {
          connect();
        }
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }, [connect]);

  // Set up and clean up WebSocket connection
  useEffect(() => {
    isMounted.current = true;
    
    // Initial connection
    connect();

    // Cleanup function
    return () => {
      isMounted.current = false;
      
      // Clear any pending reconnection attempts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // Close WebSocket connection if it exists
      if (ws.current) {
        try {
          ws.current.close();
        } catch (err) {
          console.error('Error closing WebSocket on unmount:', err);
        }
        ws.current = null;
      }
      
      // Clear message queue
      messageQueue.current = [];
    };
  }, [connect]);

  // Get the current token
  const currentToken = getToken();
  
  // Reconnect when token changes
  useEffect(() => {
    if (isMounted.current) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      socket: ws.current,
      isConnected,
      sendMessage: sendMessage || (() => {}), // Ensure sendMessage is always a function
      connectionStatus: isConnected ? 'connected' : 'disconnected'
    }),
    [isConnected, sendMessage]
  );

  // Ensure we have a valid context value
  if (!contextValue.sendMessage) {
    contextValue.sendMessage = () => {
      console.warn('WebSocket not ready');
    };
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
