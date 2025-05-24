import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Assignment as TaskIcon, 
  Description as DocumentIcon, 
  People as PeopleIcon,
  BarChart as StatsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
  <Card elevation={3}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography color="textSecondary" variant="subtitle2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </div>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.contrastText`,
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon fontSize="large" />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tasks: 0,
    documents: 0,
    users: 0,
    projects: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Here's what's happening with your projects today.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="My Tasks" 
            value={stats.tasks} 
            icon={TaskIcon} 
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Documents" 
            value={stats.documents} 
            icon={DocumentIcon} 
            color="secondary"
          />
        </Grid>
        {isAdmin() && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Users" 
                value={stats.users} 
                icon={PeopleIcon} 
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Projects" 
                value={stats.projects} 
                icon={StatsIcon} 
                color="warning"
              />
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardHeader 
              title="Recent Activities" 
              action={
                <Button 
                  size="small" 
                  onClick={() => navigate('/activities')}
                >
                  View All
                </Button>
              } 
            />
            <Divider />
            <CardContent>
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                Recent activities will appear here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader title="Quick Actions" />
            <Divider />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => navigate('/tasks/new')}
                  startIcon={<TaskIcon />}
                >
                  New Task
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth
                  onClick={() => navigate('/documents/upload')}
                  startIcon={<DocumentIcon />}
                >
                  Upload Document
                </Button>
                {isAdmin() && (
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    fullWidth
                    onClick={() => navigate('/admin/users')}
                    startIcon={<PeopleIcon />}
                  >
                    Manage Users
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
