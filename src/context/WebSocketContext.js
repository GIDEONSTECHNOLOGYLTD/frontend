import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';
import { AUTH_TOKEN } from '../../config';

// Safe auth hook with proper error handling
const useSafeAuth = () => {
  try {
    const auth = useAuth();
    return {
      user: auth?.user || null,
      loading: auth?.loading ?? false,
      isAuthenticated: auth?.isAuthenticated || false
    };
  } catch (error) {
    console.warn('AuthContext not available, using fallback');
    return { user: null, loading: false, isAuthenticated: false };
  }
};

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user, loading, isAuthenticated } = useSafeAuth();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  const socketRef = useRef(null);
  const reconnectInterval = useRef(null);
  const lastPongTime = useRef(null);
  const pingInterval = useRef(null);
  const connectionStartTime = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (!isMounted.current || loading) return null;
    
    // Clear any existing reconnect interval
    if (reconnectInterval.current) {
      clearInterval(reconnectInterval.current);
      reconnectInterval.current = null;
    }

    try {
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = localStorage.getItem(AUTH_TOKEN);
      
      // Only connect if we have a token
      if (!token) {
        console.log('No auth token available, skipping WebSocket connection');
        return null;
      }

      const ws = new WebSocket(
        `${protocol}//${window.location.host}/ws`,
        [token] // Pass token as subprotocol
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
            token
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
          console.error('Failed to send auth message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!isMounted.current) return;
        
        console.log(`WebSocket Disconnected: ${event.code} ${event.reason || 'No reason provided'}`);
        
        // Clean up
        if (socketRef.current === ws) {
          socketRef.current = null;
          setSocket(null);
        }
        
        // Only attempt to reconnect if we're still mounted and haven't exceeded max attempts
        if (isMounted.current && reconnectAttempts.current < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`Attempting to reconnect in ${timeout}ms (attempt ${reconnectAttempts.current}/5)`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              connectWebSocket();
            }
          }, timeout);
        } else if (reconnectAttempts.current >= 5) {
          console.log('Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          switch (message.type) {
            case 'AUTH_SUCCESS':
              console.log('WebSocket authentication successful', message);
              setConnectionStatus('authenticated');
              break;
              
            case 'AUTH_ERROR':
              console.error('WebSocket authentication failed:', message.message);
              setConnectionStatus('auth_failed');
              ws.close(4001, 'Authentication failed');
              break;
              
            case 'PONG':
              lastPongTime.current = Date.now();
              console.debug('PONG received', { 
                latency: lastPongTime.current - (new Date(message.timestamp)).getTime(),
                serverTime: message.timestamp 
              });
              break;
              
            case 'ERROR':
              console.error('WebSocket server error:', message.message, message);
              break;
              
            default:
              console.log('Unhandled message type:', message.type, message);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err, event.data);
        }
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
      
      // Set up a keep-alive ping
      const keepAlive = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'PING' }));
          } catch (err) {
            console.error('Error sending keep-alive ping:', err);
          }
        }
      }, 30000); // Send ping every 30 seconds
      
      return () => {
        clearInterval(keepAlive);
        
        // Only close the WebSocket if it's the current one
        if (ws && ws === socketRef.current) {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close(1000, 'Dependencies changed');
            }
          } catch (err) {
            console.error('Error closing WebSocket in effect cleanup:', err);
          } finally {
            if (ws === socketRef.current) {
              socketRef.current = null;
              setSocket(null);
            }
          }
        }
        
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
    }
  }, [connectWebSocket, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Clear all intervals and timeouts
      const clearAllIntervals = () => {
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }
        
        // Clear reconnect interval
        if (reconnectInterval.current) {
          clearInterval(reconnectInterval.current);
          reconnectInterval.current = null;
        }
        
        // Clear any pending reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      clearAllIntervals();
      
      // Close WebSocket connection if it exists
      const closeWebSocket = () => {
        if (socketRef.current) {
          try {
            const ws = socketRef.current;
            
            // Remove all event listeners to prevent memory leaks
            if (ws.onopen) ws.onopen = null;
            if (ws.onclose) ws.onclose = null;
            if (ws.onerror) ws.onerror = null;
            if (ws.onmessage) ws.onmessage = null;
            
            // Close the connection if it's open or connecting
            if (ws.readyState === WebSocket.OPEN || 
                ws.readyState === WebSocket.CONNECTING) {
              ws.close(1000, 'Component unmounted');
            }
          } catch (err) {
            console.error('Error cleaning up WebSocket:', err);
          } finally {
            socketRef.current = null;
          }
        }
      };
      
      closeWebSocket();
      
      // Reset state
      setSocket(null);
      setConnectionStatus('disconnected');
    };
  }, []);

  // Add connection status to the context value
  const contextValue = {
    socket,
    status: connectionStatus,
    isConnected: connectionStatus === 'authenticated',
    connectionStartTime: connectionStartTime.current,
    lastPongTime: lastPongTime.current,
    reconnectAttempts: reconnectAttempts.current
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
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
  const { status, isConnected } = useWebSocket();
  return { status, isConnected };
};

export default WebSocketContext;
