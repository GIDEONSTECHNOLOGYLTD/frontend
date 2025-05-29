// API configuration
// Default to local development if no environment variable is set
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// WebSocket configuration
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000/ws';

// Authentication token key for localStorage
export const AUTH_TOKEN = 'gts_token';
