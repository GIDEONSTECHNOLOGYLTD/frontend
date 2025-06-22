// API configuration
// Default to local development if no environment variable is set
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';

// Frontend API URL (without /v1) for specific endpoints that don't use the v1 prefix
export const FRONTEND_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// WebSocket configuration
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001/ws';

// Authentication token key for localStorage
export const AUTH_TOKEN = 'gts_token';
