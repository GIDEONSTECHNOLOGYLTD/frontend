import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from './auth/AuthContext';
import { AUTH_TOKEN } from '../../config';

// Safe auth hook with proper error handling
const useSafeAuth = () => {
  try {
    // Use optional chaining and provide a default empty object
    const auth = useAuth?.() || {};
    
    // Ensure user object exists and has required properties
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

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  // Get auth state with safe defaults
  const authState = useSafeAuth();
  const { user, loading, isAuthenticated } = authState || {};
  
  // Debug logging
  useEffect(() => {
    console.log('WebSocketProvider - Auth state:', { 
      hasUser: !!user, 
      loading, 
      isAuthenticated,
      hasToken: !!localStorage.getItem(AUTH_TOKEN)
    });
  }, [user, loading, isAuthenticated]);
  
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Refs for values that don't trigger re-renders
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);
  const reconnectTimeoutRef = useRef(null);
  const pingInterval = useRef(null);
  const lastPongTime = useRef(null);
  const connectionStartTime = useRef(null);
  
  // Get the current auth token
  const token = useMemo(() => {
    return localStorage.getItem(AUTH_TOKEN);
  }, [isAuthenticated]);
  
  // Cleanup function for WebSocket connections
  const cleanupWebSocket = useCallback((code = 1000, reason = 'Normal closure') => {
    if (socketRef.current) {
      console.log(`WebSocket: Cleaning up connection (${code} - ${reason})`);
      try {
        socketRef.current.close(code, reason);
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      socketRef.current = null;
      setSocket(null);
    }
    
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  }, []);
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Don't attempt to connect if we don't have a token
    const token = localStorage.getItem(AUTH_TOKEN);
    if (!token) {
      console.log('No auth token available, skipping WebSocket connection');
      cleanupWebSocket(1000, 'No auth token');
      return;
    }
    
    // Don't attempt to connect if we're still loading or unmounted
    if (loading || !isMounted.current) {
      console.log('WebSocket: Skipping connection -', 
        loading ? 'still loading' : 'unmounted');
      cleanupWebSocket(1000, 'Loading or unmounted');
      return;
    }
    
    // If not authenticated, clean up any existing connection
    if (!isAuthenticated) {
      console.log('WebSocket: Not authenticated, cleaning up any existing connection');
      cleanupWebSocket(1000, 'User not authenticated');
      return;
    }
    
    // Clean up any existing connection first
    cleanupWebSocket(1000, 'Reconnecting');
    
    // Get the current token
    const currentToken = localStorage.getItem(AUTH_TOKEN);
    if (!currentToken) {
      console.log('WebSocket: No auth token available');
      setConnectionStatus('disconnected');
      return () => cleanupWebSocket(1000, 'No auth token');
    }
    
    // Set up connection state
    setConnectionStatus('connecting');
    connectionStartTime.current = Date.now();
    
    // Create new WebSocket connection using environment variable
    const wsUrl = process.env.REACT_APP_WS_URL || 
                 `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    
    try {
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close(1000, 'Replacing connection');
      }
      
      const ws = new WebSocket(wsUrl, [currentToken]);
      socketRef.current = ws;
      setSocket(ws);
      
      // Connection opened handler
      ws.onopen = () => {
        if (!isMounted.current) {
          ws.close(1000, 'Component unmounted');
          return;
        }
        
        console.log('WebSocket Connected');
        reconnectAttempts.current = 0;
        setConnectionStatus('connected');
        
        // Send initial auth message
        try {
          ws.send(JSON.stringify({
            type: 'AUTH',
            token: currentToken
          }));
          
          // Start ping interval
          if (pingInterval.current) {
            clearInterval(pingInterval.current);
          }
          
          pingInterval.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'PING' }));
                
                // Check if we haven't received a pong in a while
                if (lastPongTime.current && (Date.now() - lastPongTime.current > 45000)) {
                  console.warn('No PONG received in the last 45 seconds, reconnecting...');
                  ws.close(4000, 'No PONG received');
                }
              } catch (err) {
                console.error('Error sending PING:', err);
              }
            }
          }, 30000); // Send PING every 30 seconds
          
        } catch (err) {
          console.error('Error during WebSocket onopen:', err);
        }
      };
      
      // Message handler
      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        
        try {
          const message = JSON.parse(event.data);
          
          // Handle PONG messages
          if (message.type === 'PONG') {
            lastPongTime.current = Date.now();
            return;
          }
          
          // Handle other message types here
          console.log('WebSocket message received:', message);
          
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      // Error handler
      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        if (isMounted.current) {
          setConnectionStatus('error');
        }
      };
      
      // Close handler
      ws.onclose = (event) => {
        if (!isMounted.current) return;
        
        console.log(`WebSocket Disconnected - Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
        
        // Don't try to reconnect if we explicitly closed the connection
        if (event.code === 1000) {
          setConnectionStatus('disconnected');
          return;
        }
        
        // Try to reconnect with exponential backoff
        const maxReconnectAttempts = 5;
        const baseDelay = 1000; // Start with 1 second
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), 30000); // Max 30 seconds
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              connectWebSocket();
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionStatus('disconnected');
        }
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
    }
    
    // Return cleanup function
    return () => {
      if (socketRef.current) {
        cleanupWebSocket(1000, 'Component unmounted');
      }
    };
  }, [isAuthenticated, loading, cleanupWebSocket]);
  
  // Memoize the cleanup function to prevent unnecessary re-renders
  const stableCleanupWebSocket = useCallback(cleanupWebSocket, []);
  
  // Create a ref to track if we've already connected
  const hasConnectedRef = useRef(false);
  
  // Effect to handle authentication state changes
  useEffect(() => {
    // Set mounted state
    isMounted.current = true;
    
    // Only proceed if we're not in a loading state
    if (loading) {
      console.log('WebSocket: Waiting for auth to load...');
      return () => {
        isMounted.current = false;
      };
    }
    
    // If authenticated and not already connected, connect
    if (isAuthenticated && !hasConnectedRef.current) {
      console.log('WebSocket: User authenticated, attempting to connect...');
      hasConnectedRef.current = true;
      connectWebSocket();
    } else if (!isAuthenticated) {
      // Close WebSocket if user logs out or is not authenticated
      console.log('WebSocket: User not authenticated, cleaning up...');
      hasConnectedRef.current = false;
      stableCleanupWebSocket(1000, 'User not authenticated');
    }
    
    // Cleanup function
    return () => {
      isMounted.current = false;
      
      // Clear any pending timeouts or intervals
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      
      // Clean up WebSocket when auth state changes
      if (hasConnectedRef.current) {
        stableCleanupWebSocket(1000, 'Component unmounted or auth state changed');
      }
    };
  }, [isAuthenticated, loading, connectWebSocket, stableCleanupWebSocket]);

  // Provide the WebSocket context
  const value = useMemo(() => ({
    socket,
    connectionStatus,
    connect: connectWebSocket,
    disconnect: () => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'User disconnected');
      }
    }
  }), [socket, connectionStatus, connectWebSocket]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket
const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Helper hook for components that need to know about connection status
const useWebSocketStatus = () => {
  const { connectionStatus } = useWebSocket();
  return connectionStatus;
};

export { useWebSocket, useWebSocketStatus };
export default WebSocketContext;
