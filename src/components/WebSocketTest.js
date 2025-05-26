import React, { useState, useCallback } from 'react';
import useWebSocketHook from '../hooks/useWebSocketHook';

const WebSocketTest = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const handleMessage = useCallback((message, type) => {
    console.log('Received message:', { type, message });
    setMessages(prev => [
      ...prev.slice(-9), // Keep only last 10 messages
      { 
        id: Date.now(),
        type: 'received',
        text: `[${type}] ${JSON.stringify(message)}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, []);

  const {
    isConnected,
    isAuthenticated,
    connectionStatus,
    sendMessage,
    connect,
    disconnect,
    reconnect,
    isConnecting,
    isReconnecting,
    hasError
  } = useWebSocketHook({
    onMessage: handleMessage,
    messageTypes: ['chat', 'notification', 'system'],
    autoConnect: true
  });

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim()) return;
    
    try {
      await sendMessage('chat', { 
        content: inputMessage,
        userId: 'test-user'
      });
      
      setMessages(prev => [
        ...prev.slice(-9),
        { 
          id: Date.now(),
          type: 'sent',
          text: inputMessage,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [inputMessage, sendMessage]);

  const statusColor = {
    disconnected: 'bg-gray-200',
    connecting: 'bg-yellow-200',
    connected: 'bg-green-200',
    authenticating: 'bg-blue-200',
    authenticated: 'bg-green-300',
    error: 'bg-red-200',
    reconnecting: 'bg-yellow-200'
  }[connectionStatus] || 'bg-gray-200';

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-2">WebSocket Connection</h2>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
          <span className="font-medium">Status: {connectionStatus}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            onClick={connect}
            disabled={isConnecting || isReconnecting}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
          <button
            onClick={disconnect}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Disconnect
          </button>
          <button
            onClick={reconnect}
            disabled={isConnecting || isReconnecting}
            className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
          >
            {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
          </button>
          <div className="col-span-2">
            <div className="text-sm text-gray-600">
              <p>Connected: {isConnected ? '✅' : '❌'}</p>
              <p>Authenticated: {isAuthenticated ? '✅' : '❌'}</p>
              {hasError && <p className="text-red-500">Connection error occurred</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 mb-4">
        <h3 className="font-bold mb-2">Messages</h3>
        <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 mb-4">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center my-8">No messages yet</p>
          ) : (
            messages.map(msg => (
              <div 
                key={msg.id} 
                className={`mb-2 p-2 rounded ${msg.type === 'sent' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}
              >
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{msg.type === 'sent' ? 'You' : 'Server'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="break-words">{msg.text}</p>
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            disabled={!isConnected}
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !inputMessage.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        <p>Note: This is a test component to verify WebSocket functionality.</p>
        <p>Check browser console for detailed WebSocket events.</p>
      </div>
    </div>
  );
};

export default WebSocketTest;
