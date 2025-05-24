import React, { useState, useEffect, useCallback } from 'react';
import { 
  Avatar,
  Box, 
  Button, 
  Card, 
  CardContent, 
  Chip,
  CircularProgress, 
  Container,
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'; 
import { formatDistanceToNow } from 'date-fns';
import { 
  People as PeopleIcon, 
  Storage as StorageIcon,
  AccessTime as TimeIcon, 
  // ProjectIcon not currently used
  Announcement as AnnouncementIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Folder as FolderIcon,
  Description as DocumentIcon,
  ListAlt as AuditLogsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Helper Components
const StatCard = ({ title, value, icon: Icon, color = 'primary', loading = false }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Box 
          sx={{
            backgroundColor: `${color}.light`,
            color: `${color}.dark`,
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2
          }}
        >
          <Icon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h4" component="div">
            {loading ? '...' : value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SystemHealth = ({ status = 'operational', uptime = 0, memoryUsage = { heapUsed: 0, heapTotal: 1024 * 1024 * 1024 } }) => {
  const getHealthIcon = () => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'outage':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            System Health
          </Typography>
          <Chip 
            icon={getHealthIcon()}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={
              status === 'operational' ? 'success' : 
              status === 'degraded' ? 'warning' : 'error'
            }
          />
        </Box>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Uptime
            </Typography>
            <Typography variant="body1">
              {formatUptime(uptime)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Memory Usage
            </Typography>
            <Typography variant="body1">
              {formatMemory(memoryUsage.heapUsed)} / {formatMemory(memoryUsage.heapTotal)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const RecentUsersTable = ({ users = [], loading = false }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (users.length === 0) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="body2" color="text.secondary">
          No users found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Joined</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip 
                  label={user.role} 
                  size="small" 
                  color={user.role === 'admin' ? 'primary' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const AnnouncementDialog = ({ open, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    target: 'all'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSend(formData);
      onClose();
    } catch (error) {
      console.error('Error sending announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Announcement</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="subject"
            label="Subject"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.subject}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="message"
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={formData.message}
            onChange={handleChange}
            required
          />
          <TextField
            select
            margin="dense"
            name="target"
            label="Target Audience"
            fullWidth
            variant="outlined"
            value={formData.target}
            onChange={handleChange}
            SelectProps={{
              native: true,
            }}
          >
            <option value="all">All Users</option>
            <option value="admins">Admins Only</option>
            <option value="users">Regular Users Only</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Format bytes helper function
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // activeTab and setActiveTab reserved for future tab functionality
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    documents: { total: 0, byType: {} },
    projects: { total: 0, byStatus: {} },
    storage: { used: 0, total: 10 * 1024 * 1024 * 1024 }, // 10GB in bytes
    recentActivity: []
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  const [error, setError] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats and users in parallel
      const [statsRes, usersRes] = await Promise.all([
        (async () => {
          try {
            setStatsLoading(true);
            const res = await api.get('/admin/system/stats');
            return res.data;
          } finally {
            setStatsLoading(false);
          }
        })(),
        (async () => {
          try {
            setUsersLoading(true);
            const res = await api.get('/admin/users?limit=5&sort=-createdAt');
            return res.data?.data || [];
          } finally {
            setUsersLoading(false);
          }
        })()
      ]);
      
      setStats(prev => ({
        ...prev,
        ...statsRes,
        recentActivity: statsRes.recentActivity || [],
        storage: {
          ...prev.storage,
          ...(statsRes.storage || {})
        }
      }));
      setRecentUsers(usersRes);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleSendAnnouncement = async (data) => {
    try {
      await api.post('/admin/announcements', data);
      toast.success('Announcement sent successfully');
      // Refresh dashboard data after sending announcement
      await fetchDashboardData();
      return true;
    } catch (err) {
      console.error('Error sending announcement:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send announcement';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user?.role]);

  const storagePercentage = Math.min(
    Math.round((stats.storage.used / stats.storage.total) * 100),
    100
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, pb: 6 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Admin Dashboard
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AnnouncementIcon />}
            onClick={() => setAnnouncementOpen(true)}
            sx={{ mr: 2 }}
          >
            New Announcement
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Message */}
      {error && (
        <Box mb={3}>
          <Paper elevation={2} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography>{error}</Typography>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="small" 
              onClick={fetchDashboardData}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Paper>
        </Box>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <StatCard 
            title="Total Users" 
            value={stats.users.total} 
            icon={PeopleIcon} 
            color="primary"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard 
            title="Active Users" 
            value={stats.users.active} 
            icon={PeopleIcon} 
            color="success"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard 
            title="Total Documents" 
            value={stats.documents.total} 
            icon={DocumentIcon} 
            color="info"
            loading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard 
            title="Total Projects" 
            value={stats.projects.total} 
            icon={FolderIcon} 
            color="warning"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* System Health */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <SystemHealth 
                status="operational"
                uptime={3600 * 24 * 2 + 3600 * 5 + 60 * 30} // 2 days, 5 hours, 30 minutes
                memoryUsage={{
                  heapUsed: 256 * 1024 * 1024, // 256MB
                  heapTotal: 1024 * 1024 * 1024 // 1GB
                }}
              />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h2">
                  Recent Activity
                </Typography>
                <Button size="small" color="primary">
                  View All
                </Button>
              </Box>
              <List>
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            {activity.type === 'login' ? (
                              <CheckCircleIcon color="success" />
                            ) : activity.type === 'warning' ? (
                              <WarningIcon color="warning" />
                            ) : (
                              <InfoIcon color="info" />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.message}
                          secondary={formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        />
                      </ListItem>
                      {index < stats.recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No recent activity" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Storage Usage */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <StorageIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Storage Usage
                </Typography>
              </Box>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(stats.storage.used)} of {formatBytes(stats.storage.total)} used
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {storagePercentage}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={storagePercentage} 
                  color={storagePercentage > 90 ? 'error' : storagePercentage > 70 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 2 }}
                />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Storage by Type
                </Typography>
                {Object.entries(stats.documents.byType).map(([type, count]) => (
                  <Box key={type} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {count} files
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PeopleIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="h6" component="h2">
                  Recent Users
                </Typography>
              </Box>
              <RecentUsersTable users={recentUsers} loading={usersLoading} />
              <Box mt={2} textAlign="right">
                <Button size="small" color="primary">
                  View All Users
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <List>
                <ListItem button>
                  <ListItemAvatar>
                    <Avatar>
                      <PeopleIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Manage Users" secondary="Add, edit, or remove users" />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem button>
                  <ListItemAvatar>
                    <Avatar>
                      <StorageIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary="Storage Settings" secondary="Configure storage options" />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem 
                  button 
                  onClick={() => navigate('/admin/audit-logs')}
                  sx={{ bgcolor: 'action.hover', borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <AuditLogsIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Audit Logs" 
                    secondary="View system activity and access logs"
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem button>
                  <ListItemAvatar>
                    <Avatar>
                      <TimeIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary="Activity Logs" 
                    secondary={`Last updated ${formatDistanceToNow(new Date(), { addSuffix: true })}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Announcement Dialog */}
      <AnnouncementDialog 
        open={announcementOpen} 
        onClose={() => setAnnouncementOpen(false)}
        onSend={handleSendAnnouncement}
      />
    </Container>
  );
};

export default AdminDashboard;
