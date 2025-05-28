// API configuration
// Use the frontend API endpoints for health checks and DB status
export const FRONTEND_API_URL = process.env.REACT_APP_FRONTEND_API_URL || '/api';

// Backend API for actual data operations (protected by Vercel auth)
export const API_URL = process.env.REACT_APP_API_URL || 'https://backend-80jnpluh6-gideonstechnologyltds-projects.vercel.app/api';

// WebSocket configuration
export const WS_URL = process.env.REACT_APP_WS_URL || 'wss://backend-80jnpluh6-gideonstechnologyltds-projects.vercel.app/ws';

export const AUTH_TOKEN = 'gts_token'; // Key for storing auth token in localStorage
