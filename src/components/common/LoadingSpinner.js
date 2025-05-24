import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingSpinner = ({ size = 40, fullPage = false, message = 'Loading...' }) => {
  const containerStyle = fullPage 
    ? {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: 2,
        padding: 3
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        padding: 2
      };

  return (
    <Box sx={containerStyle}>
      <CircularProgress size={size} />
      {message && (
        <Typography 
          variant={fullPage ? 'h6' : 'body1'} 
          color="textSecondary"
          align="center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
