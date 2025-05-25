import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/auth/AuthContext';
import { WebSocketProvider } from './context/WebSocketContextNew';
import { SearchProvider } from './context/SearchContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorBoundary from './components/common/ErrorBoundary';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', process.env.REACT_APP_API_URL);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ErrorBoundary fallback={<div>Error loading application. Please refresh the page.</div>}>
          <WebSocketProvider>
            <SearchProvider>
              <App />
            </SearchProvider>
          </WebSocketProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
