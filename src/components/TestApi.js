import React, { useState, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon, 
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  LockReset as LockResetIcon,
  Api as ApiIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import testApiConnection from '../utils/testApiConnection';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(3),
  '& .MuiCardHeader-root': {
    backgroundColor: theme.palette.grey[100],
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  '& .MuiCardContent-root': {
    padding: 0
  }
}));

const TestResultItem = styled(ListItem)(({ theme, status }) => ({
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  },
  '& .MuiListItemText-primary': {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1)
  },
  '& .MuiListItemText-secondary': {
    marginTop: theme.spacing(1)
  },
  ...(status === 'error' && {
    borderLeft: `4px solid ${theme.palette.error.main}`
  }),
  ...(status === 'warning' && {
    borderLeft: `4px solid ${theme.palette.warning.main}`
  }),
  ...(status === 'success' && {
    borderLeft: `4px solid ${theme.palette.success.main}`
  })
}));

const TestApi = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expandedTests, setExpandedTests] = useState({});
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleCloseSnackbar = useCallback(() => {
    setOpenSnackbar(false);
  }, []);

  const toggleTestDetails = useCallback((testIndex) => {
    setExpandedTests(prev => ({
      ...prev,
      [testIndex]: !prev[testIndex]
    }));
  }, []);

  const runTests = useCallback(async () => {
    setLoading(true);
    setTestResults(null);
    setError(null);
    setExpandedTests({});

    try {
      console.log('Starting API connection tests...');
      const results = await testApiConnection();
      setTestResults(results);
      
      // Auto-expand any failed tests
      const expanded = {};
      results.forEach((result, index) => {
        if (result.status === 'error' || result.status === 'warning') {
          expanded[index] = true;
        }
      });
      setExpandedTests(expanded);
      
      console.log('API connection tests completed:', results);
    } catch (err) {
      console.error('API test error:', err);
      setError(err.message || 'An unexpected error occurred while running tests');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAuthToken = useCallback(() => {
    localStorage.removeItem('token');
    setTestResults(null);
    setExpandedTests({});
  }, []);

  const getStatusIcon = useCallback((status) => {
    const iconProps = { fontSize: 'small', sx: { mr: 0.5 } };
    
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" {...iconProps} />;
      case 'error':
        return <ErrorIcon color="error" {...iconProps} />;
      case 'warning':
        return <ErrorIcon color="warning" {...iconProps} />;
      default:
        return <InfoIcon color="info" {...iconProps} />;
    }
  }, []);

  const getStatusChip = useCallback((status) => (
    <Chip 
      label={status.toUpperCase()} 
      size="small"
      color={
        status === 'success' ? 'success' : 
        status === 'error' ? 'error' : 
        status === 'warning' ? 'warning' : 'default'
      }
      variant="outlined"
      sx={{ 
        ml: 1, 
        fontWeight: 'medium',
        fontSize: '0.7rem',
        height: 20
      }}
    />
  ), []);

  const getTestDetails = useCallback((test) => {
    if (!test.details) return null;
    
    return (
      <Box sx={{ 
        mt: 1, 
        p: 1.5, 
        bgcolor: 'background.default', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        overflowX: 'auto'
      }}>
        <Typography variant="caption" component="pre" sx={{ 
          whiteSpace: 'pre-wrap', 
          fontSize: '0.75rem', 
          m: 0,
          fontFamily: 'monospace'
        }}>
          {JSON.stringify(test.details, null, 2)}
        </Typography>
      </Box>
    );
  }, []);

  const getTestTimestamp = useCallback((timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <StyledCard>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ApiIcon />
              <Typography variant="h6" component="h1">
                API Connection Tester
              </Typography>
            </Box>
          }
          subheader="Verify API connectivity and authentication"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Clear authentication token">
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearAuthToken}
                    disabled={loading || !localStorage.getItem('token')}
                    startIcon={<LockResetIcon />}
                  >
                    Clear Token
                  </Button>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                onClick={runTests}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              >
                {loading ? 'Testing...' : 'Run Tests'}
              </Button>
            </Box>
          }
        />
        
        <CardContent>
          {loading && <LinearProgress />}
          
          {testResults ? (
            <List disablePadding>
              {testResults.map((test, index) => (
                <React.Fragment key={index}>
                  <TestResultItem 
                    status={test.status}
                    secondaryAction={
                      test.details && (
                        <IconButton 
                          edge="end" 
                          aria-label="Toggle details"
                          onClick={() => toggleTestDetails(index)}
                          size="small"
                        >
                          {expandedTests[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <>
                          {getStatusIcon(test.status)}
                          <Typography variant="subtitle2" component="span">
                            {test.name}
                          </Typography>
                          {test.status && getStatusChip(test.status)}
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ ml: 'auto' }}
                          >
                            {getTestTimestamp(test.timestamp)}
                          </Typography>
                        </>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block' }}
                          >
                            {test.message}
                          </Typography>
                          <Collapse in={expandedTests[index]} timeout="auto" unmountOnExit>
                            {getTestDetails(test)}
                          </Collapse>
                        </>
                      }
                      primaryTypographyProps={{
                        variant: 'body2',
                        sx: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' }
                      }}
                      secondaryTypographyProps={{
                        component: 'div'
                      }}
                    />
                  </TestResultItem>
                  {index < testResults.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center',
              color: 'text.secondary'
            }}>
              <SecurityIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography variant="body1">
                Click "Run Tests" to verify API connectivity and authentication
              </Typography>
            </Box>
          )}
        </CardContent>
      </StyledCard>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestApi;
