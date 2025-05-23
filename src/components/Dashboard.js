import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Work as ProjectIcon,
  Group as TeamIcon,
  EventAvailable as EventIcon,
  CheckCircle as CompleteIcon,
  AccessTime as InProgressIcon,
  ErrorOutline as BlockedIcon,
  Add as AddIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../config.js';

// Dashboard statistics card component
const StatCard = ({ icon: Icon, title, value, color = 'primary', to }) => {
  return (
    <Card 
      component={to ? Link : 'div'} 
      to={to}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        transition: 'transform 0.2s',
        '&:hover': to ? { transform: 'translateY(-4px)', boxShadow: 3 } : {},
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Icon color={color} sx={{ mr: 1, fontSize: 40 }} />
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
      {to && (
        <CardActions>
          <Button size="small" color={color} sx={{ ml: 'auto' }}>
            View All
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

// Recent tasks list component
const RecentTasks = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
        No recent tasks
      </Typography>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CompleteIcon color="success" />;
      case 'in_progress':
        return <InProgressIcon color="info" />;
      case 'blocked':
        return <BlockedIcon color="error" />;
      default:
        return <TaskIcon color="action" />;
    }
  };

  return (
    <List>
      {tasks.map((task) => (
        <ListItem 
          key={task._id} 
          button 
          component={Link} 
          to={`/tasks/${task._id}`}
          sx={{
            '&:hover': { backgroundColor: 'action.hover' },
            borderRadius: 1,
            mb: 0.5
          }}
        >
          <ListItemIcon>{getStatusIcon(task.status)}</ListItemIcon>
          <ListItemText 
            primary={task.title}
            secondary={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}`}
            sx={{
              '& .MuiListItemText-primary': {
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
              },
            }}
          />
          {task.priority === 'high' && (
            <Chip 
              label="High" 
              size="small" 
              color="error"
              variant="outlined"
            />
          )}
        </ListItem>
      ))}
    </List>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tasks: 0,
    projects: 0,
    teamMembers: 0,
    upcomingEvents: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('gts_token');
        
        // Fetch dashboard statistics
        const statsResponse = await axios.get(`${API_URL}/api/v1/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Fetch recent tasks
        const tasksResponse = await axios.get(`${API_URL}/tasks?limit=5&sort=-createdAt`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setStats(statsResponse.data);
        setRecentTasks(tasksResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom={false}>
              Welcome back, {user?.name}!
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Here's what's happening with your projects today.
            </Typography>
          </Box>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/tasks/new')}
              sx={{ mr: 1 }}
            >
              New Task
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={TaskIcon} 
            title="Total Tasks" 
            value={stats.tasks} 
            to="/tasks"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={ProjectIcon} 
            title="Active Projects" 
            value={stats.projects} 
            color="secondary"
            to="/projects"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={TeamIcon} 
            title="Team Members" 
            value={stats.teamMembers} 
            color="success"
            to="/team"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={EventIcon} 
            title="Upcoming Events" 
            value={stats.upcomingEvents} 
            color="warning"
            to="/calendar"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Tasks */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Recent Tasks</Typography>
              <Button 
                size="small" 
                color="primary"
                component={Link}
                to="/tasks"
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <RecentTasks tasks={recentTasks} />
            )}
          </Paper>
        </Grid>

        {/* Quick Links */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/tasks/new"
                  sx={{ justifyContent: 'flex-start', mb: 1 }}
                >
                  New Task
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<ProjectIcon />}
                  component={Link}
                  to="/projects/new"
                  sx={{ justifyContent: 'flex-start', mb: 1 }}
                >
                  New Project
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<TeamIcon />}
                  component={Link}
                  to="/team"
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Team Members
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<EventIcon />}
                  component={Link}
                  to="/calendar"
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Calendar
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Activity */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box textAlign="center" py={2}>
              <Typography color="text.secondary" variant="body2">
                Activity feed will appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
