import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth/AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = () => {
    if (socket) {
      socket.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      reconnectAttempts.current = 0;
      
      // Authenticate with the server
      const token = localStorage.getItem('gts_token');
      if (token) {
        ws.send(JSON.stringify({
          type: 'AUTH',
          token
        }));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      // Attempt to reconnect with exponential backoff
      const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current <= 5) { // Max 5 retries
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, timeout);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.close();
    };

    setSocket(ws);
    return ws;
  };

  useEffect(() => {
    if (user) {
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
