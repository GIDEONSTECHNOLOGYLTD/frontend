/**
 * WebSocket Service
 * Provides real-time communication capabilities with the backend
 * Supports document sharing, collaboration, and notifications
 */

// Configuration
const WS_RECONNECT_INTERVAL = 3000; // 3 seconds
const WS_MAX_RECONNECT_ATTEMPTS = 5;

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.connectionHandlers = [];
    
    // Bind methods to this
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.send = this.send.bind(this);
  }

  /**
   * Connect to the WebSocket server
   * @returns {Promise} Resolves when connected, rejects on failure
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        resolve(this.socket);
        return;
      }
      
      try {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';
        
        console.log(`[WebSocket] Connecting to ${wsUrl}`);
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = (event) => {
          this.handleOpen(event);
          resolve(this.socket);
        };
        
        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = (error) => {
          this.handleError(error);
          reject(error);
        };
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    console.log('[WebSocket] Disconnected');
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  reconnect() {
    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
        .then(() => {
          console.log('[WebSocket] Reconnected successfully');
          this.reconnectAttempts = 0;
          
          // Resubscribe to previous channels
          this.subscriptions.forEach((callback, channel) => {
            this.sendSubscription(channel);
          });
        })
        .catch((error) => {
          console.error('[WebSocket] Reconnect failed:', error);
          this.reconnect();
        });
    }, WS_RECONNECT_INTERVAL);
  }

  /**
   * Handle WebSocket open event
   * @param {Event} event - WebSocket open event
   */
  handleOpen(event) {
    console.log('[WebSocket] Connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => {
      if (typeof handler.onConnect === 'function') {
        handler.onConnect(event);
      }
    });
  }

  /**
   * Handle WebSocket message event
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Message received:', data);
      
      // Handle subscription messages
      if (data.channel && this.subscriptions.has(data.channel)) {
        const callback = this.subscriptions.get(data.channel);
        callback(data);
      }
      
      // Handle message type handlers
      if (data.type && this.messageHandlers.has(data.type)) {
        const handler = this.messageHandlers.get(data.type);
        handler(data);
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error, event.data);
    }
  }

  /**
   * Handle WebSocket close event
   * @param {CloseEvent} event - WebSocket close event
   */
  handleClose(event) {
    this.isConnected = false;
    console.log(`[WebSocket] Connection closed: ${event.code} ${event.reason}`);
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => {
      if (typeof handler.onDisconnect === 'function') {
        handler.onDisconnect(event);
      }
    });
    
    // Attempt to reconnect if not a normal closure
    if (event.code !== 1000) {
      this.reconnect();
    }
  }

  /**
   * Handle WebSocket error event
   * @param {Event} error - WebSocket error event
   */
  handleError(error) {
    console.error('[WebSocket] Error:', error);
    
    // Notify connection handlers
    this.connectionHandlers.forEach(handler => {
      if (typeof handler.onError === 'function') {
        handler.onError(error);
      }
    });
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {function} callback - Callback function for messages
   */
  subscribe(channel, callback) {
    if (!channel) {
      console.error('[WebSocket] Cannot subscribe to empty channel');
      return;
    }
    
    this.subscriptions.set(channel, callback);
    
    if (this.isConnected) {
      this.sendSubscription(channel);
    }
  }

  /**
   * Send subscription message to server
   * @param {string} channel - Channel name
   */
  sendSubscription(channel) {
    this.send({
      type: 'subscribe',
      channel
    });
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   */
  unsubscribe(channel) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.delete(channel);
      
      if (this.isConnected) {
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  /**
   * Register a connection handler
   * @param {Object} handler - Handler with onConnect, onDisconnect, onError methods
   */
  registerConnectionHandler(handler) {
    this.connectionHandlers.push(handler);
  }

  /**
   * Register a message type handler
   * @param {string} type - Message type
   * @param {function} handler - Handler function
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Send a message to the server
   * @param {Object} data - Message data
   * @returns {boolean} Success status
   */
  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message, socket not open');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      return false;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
