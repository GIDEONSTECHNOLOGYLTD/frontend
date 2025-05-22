import React from 'react';

const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null,
};

export const WebSocketContext = React.createContext({
  socket: mockWebSocket,
  sendMessage: jest.fn(),
  isConnected: true,
});

export const WebSocketProvider = ({ children }) => {
  return (
    <WebSocketContext.Provider value={{
      socket: mockWebSocket,
      sendMessage: jest.fn(),
      isConnected: true,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return {
    socket: mockWebSocket,
    sendMessage: jest.fn(),
    isConnected: true,
  };
};

export default WebSocketContext;
