import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from './auth/AuthContext';
import { AUTH_TOKEN } from '../../config';

// Safe auth hook with proper error handling
const useSafeAuth = () => {
  try {
    const auth = useAuth?.();
    // Return default values if auth is not available yet
    if (!auth) {
      return { 
        user: null, 
        loading: true, 
        isAuthenticated: false,
        token: null
      };
    }
    return {
      user: auth.user || null,
      loading: auth.loading ?? false,
      isAuthenticated: !!auth.user,
      token: localStorage.getItem(AUTH_TOKEN)
    };
  } catch (error) {
    console.warn('AuthContext not available, using fallback', error);
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
  const { user, loading, isAuthenticated } = useSafeAuth();
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
  }, [isAuthenticated]); // Only update when auth state changes
  
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
  }, []);
  
  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Don't attempt to connect if we're still loading, unmounted, or not authenticated
    if (loading || !isMounted.current || !isAuthenticated) {
      console.log('WebSocket: Skipping connection -', 
        loading ? 'still loading' : !isMounted.current ? 'unmounted' : 'not authenticated');
      return () => cleanupWebSocket(1000, 'Connection attempt aborted');
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
          console.error('Error during WebSocket setup:', err);
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
          
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
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
        
        console.log('WebSocket Disconnected', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        // Don't try to reconnect if we're no longer mounted or if this was a normal closure
        if (!isMounted.current || event.code === 1000) {
          return;
        }
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        console.log(`Attempting to reconnect in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            setConnectionStatus('reconnecting');
            connectWebSocket();
          }
        }, delay);
      };
      
      // Return cleanup function
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Connection replaced');
        }
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionStatus('error');
      return () => cleanupWebSocket(1000, 'Connection error');
    }

      ws.onopen = () => {
        if (!isMounted.current) {
          ws.close();
          return;
        }
        
        console.log('WebSocket Connected');
        reconnectAttempts.current = 0;
        connectionStartTime.current = new Date();
        setConnectionStatus('connected');
        
        // Send initial auth message
        try {
          ws.send(JSON.stringify({
            type: 'AUTH',
            token: authToken
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
          console.error('Error during WebSocket setup:', err);
        }
      };

      ws.onclose = (event) => {
        if (!isMounted.current) return;
        
        console.log('WebSocket Disconnected', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        // Don't try to reconnect if we're no longer mounted or if this was a normal closure
        if (!isMounted.current || event.code === 1000) {
          return;
        }
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        console.log(`Attempting to reconnect in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            setConnectionStatus('reconnecting');
            connectWebSocket();
          }
        }, delay);
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        if (isMounted.current) {
          setConnectionStatus('error');
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          // Handle PONG messages
          if (data.type === 'PONG') {
            lastPongTime.current = Date.now();
            return;
          }
          
          // Handle other message types here
          console.log('WebSocket Message:', data);
          
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(ws);
      return ws;
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
      return null;
    }
  }, [isAuthenticated, loading, token]);
  
  // Effect to handle authentication state changes
  useEffect(() => {
    // Only proceed if we're not in a loading state
    if (loading) {
      console.log('WebSocket: Waiting for auth to load...');
      return;
    }
    
    // If authenticated and not already connected, connect
    if (isAuthenticated) {
      console.log('WebSocket: User authenticated, attempting to connect...');
      connectWebSocket();
    } else {
      // Close WebSocket if user logs out or is not authenticated
      console.log('WebSocket: User not authenticated, cleaning up...');
      if (socketRef.current) {
        socketRef.current.close(1000, 'User logged out');
        socketRef.current = null;
        setSocket(null);
        setConnectionStatus('disconnected');
      }
    }
    
    // Cleanup function to close WebSocket on unmount
    return () => {
      isMounted.current = false;
      
      // Close WebSocket connection if it exists
      if (socketRef.current) {
        console.log('WebSocket: Cleaning up WebSocket connection');
        socketRef.current.close(1000, 'Component unmounted');
        socketRef.current = null;
      }
      
      // Clear any pending timeouts or intervals
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
    };
  }, [isAuthenticated, loading, connectWebSocket]);

  // Provide the WebSocket context
  const value = {
    socket,
    connectionStatus,
    connect: connectWebSocket,
    disconnect: useCallback(() => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'User disconnected');
      }
    }, [])
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Helper hook for components that need to know about connection status
export const useWebSocketStatus = () => {
  const context = useContext(WebSocketContext);
  return context?.connectionStatus || 'disconnected';
};

export default WebSocketContext;
