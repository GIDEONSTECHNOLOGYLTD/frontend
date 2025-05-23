import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
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
  const { user, loading, isAuthenticated, token } = useSafeAuth();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  const socketRef = useRef(null);
  const pingInterval = useRef(null);
  const lastPongTime = useRef(null);
  const connectionStartTime = useRef(null);
  
  // Memoize the connectWebSocket function
  const connectWebSocket = useCallback(() => {
    // Don't attempt to connect if we're still loading or unmounted
    if (loading || !isMounted.current) {
      console.log('WebSocket: Skipping connection -', loading ? 'still loading' : 'unmounted');
      return null;
    }
    
    // Don't connect if user is not authenticated
    if (!isAuthenticated) {
      console.log('WebSocket: Not authenticated, skipping connection');
      return null;
    }
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const authToken = token || localStorage.getItem(AUTH_TOKEN);
      
      // Only connect if we have a token and user is authenticated
      if (!authToken || !isAuthenticated) {
        console.log('No auth token or user not authenticated, skipping WebSocket connection');
        setConnectionStatus('disconnected');
        return null;
      }

      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws`,
        [authToken] // Pass token as subprotocol
      );
      
      socketRef.current = ws;

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
    
    return () => {
      // Cleanup on unmount
      isMounted.current = false;
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
