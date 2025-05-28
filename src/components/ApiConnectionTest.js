import React, { useState, useEffect } from 'react';
import api from '../services/api';
import websocketService from '../services/websocket';

/**
 * Component to test API and WebSocket connections
 */
const ApiConnectionTest = () => {
  const [apiStatus, setApiStatus] = useState({ loading: true, error: null, data: null });
  const [wsStatus, setWsStatus] = useState({ connected: false, error: null, messages: [] });
  const [testMessage, setTestMessage] = useState('');

  // Test API connection on component mount
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        setApiStatus({ loading: true, error: null, data: null });
        
        // Test the health endpoint
        const healthData = await fetch(`${process.env.REACT_APP_API_URL}/health`)
          .then(res => res.json());
        
        // Test the status endpoint
        const statusData = await fetch(`${process.env.REACT_APP_API_URL}/status`)
          .then(res => res.json());
        
        // Test the root API endpoint
        const apiData = await fetch(process.env.REACT_APP_API_URL)
          .then(res => res.json());
        
        setApiStatus({
          loading: false,
          error: null,
          data: {
            health: healthData,
            status: statusData,
            api: apiData
          }
        });
      } catch (error) {
        console.error('API connection test failed:', error);
        setApiStatus({
          loading: false,
          error: error.message || 'Failed to connect to API',
          data: null
        });
      }
    };

    testApiConnection();
  }, []);

  // Test WebSocket connection on component mount
  useEffect(() => {
    // Register connection handler
    websocketService.registerConnectionHandler({
      onConnect: () => {
        setWsStatus(prev => ({
          ...prev,
          connected: true,
          error: null,
          messages: [...prev.messages, { type: 'system', text: 'Connected to WebSocket server', timestamp: new Date() }]
        }));
      },
      onDisconnect: (event) => {
        setWsStatus(prev => ({
          ...prev,
          connected: false,
          error: null,
          messages: [...prev.messages, { type: 'system', text: `Disconnected: ${event.code} ${event.reason}`, timestamp: new Date() }]
        }));
      },
      onError: (error) => {
        setWsStatus(prev => ({
          ...prev,
          error: error.message || 'WebSocket error',
          messages: [...prev.messages, { type: 'error', text: `Error: ${error.message || 'Unknown error'}`, timestamp: new Date() }]
        }));
      }
    });

    // Subscribe to test channel
    websocketService.subscribe('test', (data) => {
      setWsStatus(prev => ({
        ...prev,
        messages: [...prev.messages, { type: 'received', text: JSON.stringify(data), timestamp: new Date() }]
      }));
    });

    // Connect to WebSocket server
    websocketService.connect()
      .catch(error => {
        setWsStatus(prev => ({
          ...prev,
          error: error.message || 'Failed to connect to WebSocket server',
          messages: [...prev.messages, { type: 'error', text: `Connection failed: ${error.message || 'Unknown error'}`, timestamp: new Date() }]
        }));
      });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Send test message through WebSocket
  const sendTestMessage = () => {
    if (!testMessage.trim()) return;
    
    const message = {
      type: 'message',
      channel: 'test',
      content: testMessage,
      timestamp: new Date().toISOString()
    };
    
    const success = websocketService.send(message);
    
    if (success) {
      setWsStatus(prev => ({
        ...prev,
        messages: [...prev.messages, { type: 'sent', text: JSON.stringify(message), timestamp: new Date() }]
      }));
      setTestMessage('');
    } else {
      setWsStatus(prev => ({
        ...prev,
        error: 'Failed to send message',
        messages: [...prev.messages, { type: 'error', text: 'Failed to send message', timestamp: new Date() }]
      }));
    }
  };

  return (
    <div className="api-connection-test">
      <h2>API Connection Test</h2>
      
      {/* API Status */}
      <div className="api-status">
        <h3>API Status</h3>
        {apiStatus.loading ? (
          <p>Testing API connection...</p>
        ) : apiStatus.error ? (
          <div className="error-message">
            <p>Error: {apiStatus.error}</p>
          </div>
        ) : (
          <div className="success-message">
            <p>API Connection Successful!</p>
            <div className="api-responses">
              <div className="response-card">
                <h4>Health Endpoint</h4>
                <pre>{JSON.stringify(apiStatus.data?.health, null, 2)}</pre>
              </div>
              <div className="response-card">
                <h4>Status Endpoint</h4>
                <pre>{JSON.stringify(apiStatus.data?.status, null, 2)}</pre>
              </div>
              <div className="response-card">
                <h4>API Root</h4>
                <pre>{JSON.stringify(apiStatus.data?.api, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* WebSocket Status */}
      <div className="websocket-status">
        <h3>WebSocket Status</h3>
        <div className="status-indicator">
          <span className={`status-dot ${wsStatus.connected ? 'connected' : 'disconnected'}`}></span>
          <span>{wsStatus.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {wsStatus.error && (
          <div className="error-message">
            <p>Error: {wsStatus.error}</p>
          </div>
        )}
        
        {/* WebSocket Test Message Form */}
        <div className="websocket-test-form">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter test message"
            disabled={!wsStatus.connected}
          />
          <button 
            onClick={sendTestMessage}
            disabled={!wsStatus.connected || !testMessage.trim()}
          >
            Send
          </button>
        </div>
        
        {/* WebSocket Messages */}
        <div className="websocket-messages">
          <h4>Messages</h4>
          <div className="message-list">
            {wsStatus.messages.length === 0 ? (
              <p>No messages yet</p>
            ) : (
              wsStatus.messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <span className="timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="message-text">{message.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Connection Info */}
      <div className="connection-info">
        <h3>Connection Information</h3>
        <ul>
          <li><strong>API URL:</strong> {process.env.REACT_APP_API_URL}</li>
          <li><strong>WebSocket URL:</strong> {process.env.REACT_APP_WS_URL}</li>
          <li><strong>Environment:</strong> {process.env.NODE_ENV}</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiConnectionTest;
