import { useCallback, useEffect } from 'react';
import { useWebSocket, CONNECTION_STATUS } from '../context/WebSocketContext';

/**
 * Custom hook for WebSocket functionality
 * @param {Object} options - Configuration options
 * @param {Function} [options.onMessage] - Callback for incoming messages
 * @param {string|string[]} [options.messageTypes] - Message types to listen for
 * @param {boolean} [options.autoConnect=true] - Whether to automatically connect
 * @returns {Object} WebSocket utilities and state
 */
const useWebSocketHook = (options = {}) => {
  const {
    onMessage: onMessageProp,
    messageTypes,
    autoConnect = true,
  } = options;

  const {
    isConnected,
    isAuthenticated,
    connectionStatus,
    connectionId,
    userId,
    sendMessage,
    onMessage: onMessageContext,
    connect: connectContext,
    disconnect: disconnectContext,
  } = useWebSocket();

  // Handle incoming messages
  useEffect(() => {
    if (!onMessageProp || !messageTypes) return undefined;

    const types = Array.isArray(messageTypes) ? messageTypes : [messageTypes];
    const unsubscribers = [];

    types.forEach(type => {
      const unsubscribe = onMessageContext(type, (message) => {
        onMessageProp(message, type);
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [onMessageProp, messageTypes, onMessageContext]);

  // Auto-connect if needed
  useEffect(() => {
    if (autoConnect && connectionStatus === CONNECTION_STATUS.DISCONNECTED) {
      connectContext();
    }
  }, [autoConnect, connectionStatus, connectContext]);

  // Wrap sendMessage to handle connection state
  const safeSendMessage = useCallback(
    async (type, payload = {}, options = {}) => {
      if (!isConnected) {
        throw new Error('WebSocket is not connected');
      }

      try {
        const message = {
          type,
          ...payload,
          timestamp: new Date().toISOString(),
          ...options,
        };

        return await sendMessage(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        throw error;
      }
    },
    [isConnected, sendMessage]
  );

  // Helper to subscribe to specific message types
  const subscribe = useCallback(
    (type, handler) => {
      return onMessageContext(type, handler);
    },
    [onMessageContext]
  );

  // Connection management functions
  const connect = useCallback(async () => {
    try {
      await connectContext();
      return true;
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  }, [connectContext]);

  const disconnect = useCallback(() => {
    try {
      disconnectContext();
      return true;
    } catch (error) {
      console.error('Failed to disconnect:', error);
      return false;
    }
  }, [disconnectContext]);

  const reconnect = useCallback(async () => {
    if (connectionStatus === CONNECTION_STATUS.CONNECTED) {
      await disconnect();
    }
    return connect();
  }, [connect, disconnect, connectionStatus]);

  return {
    // State
    isConnected,
    isAuthenticated,
    connectionStatus,
    connectionId,
    userId,
    
    // Connection management
    connect,
    disconnect,
    reconnect,
    
    // Message handling
    sendMessage: safeSendMessage,
    subscribe,
    onMessage: onMessageContext,
    
    // Status helpers
    isConnecting: connectionStatus === CONNECTION_STATUS.CONNECTING,
    isReconnecting: connectionStatus === CONNECTION_STATUS.RECONNECTING,
    isDisconnected: connectionStatus === CONNECTION_STATUS.DISCONNECTED,
    hasError: connectionStatus === CONNECTION_STATUS.ERROR,
  };
};

export default useWebSocketHook;
