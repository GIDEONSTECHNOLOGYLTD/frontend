import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Chip, 
  Divider, 
  Avatar, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  Label as LabelIcon,
  AttachFile as AttachFileIcon,
  Add as AddIcon,
  // Close as CloseIcon - Removed unused import
} from '@mui/icons-material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../../context/auth/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config.js';
import Markdown from 'react-markdown';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // eslint-disable-line no-unused-vars
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const open = Boolean(anchorEl);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('gts_token');
      const response = await axios.get(`${API_URL}/tasks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTask(response.data.data);
    } catch (error) {
      console.error('Error fetching task:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const token = localStorage.getItem('gts_token');
      const response = await axios.get(`${API_URL}/tasks/${id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [fetchTask, fetchComments]);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('gts_token');
      await axios.patch(
        `${API_URL}/tasks/${id}/status`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setTask(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('gts_token');
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setSubmitting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('gts_token');
      const response = await axios.post(
        `${API_URL}/tasks/${id}/comments`,
        { content: newComment },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setComments(prev => [response.data.data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box textAlign="center" py={5}>
        <Typography variant="h6" color="textSecondary">
          Task not found
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/tasks')}
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="h4" component="h1" sx={{ mr: 2 }}>
              {task.title}
            </Typography>
            <Chip 
              label={task.status.replace('_', ' ')}
              color={getStatusColor(task.status)}
              size="small"
              sx={{ textTransform: 'capitalize', mr: 1 }}
            />
            <Chip 
              label={`${task.priority} priority`}
              color={getPriorityColor(task.priority)}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
          
          {task.project && (
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                Project:
              </Typography>
              <Chip 
                label={task.project.name}
                size="small"
                component={Link}
                to={`/projects/${task.project._id}`}
                clickable
              />
            </Box>
          )}
        </Box>
        
        <Box>
          <IconButton
            aria-label="more"
            aria-controls="task-actions-menu"
            aria-haspopup="true"
            onClick={handleMenuClick}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="task-actions-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: { width: 200 }
            }}
          >
            <MenuItem 
              onClick={() => {
                handleMenuClose();
                navigate(`/tasks/${id}/edit`, { state: { from: 'detail' } });
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Task</ListItemText>
            </MenuItem>
            <MenuItem 
              onClick={() => {
                handleMenuClose();
                setDeleteDialogOpen(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Task</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Status Actions */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        {task.status !== 'completed' && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => handleStatusChange('completed')}
            sx={{ textTransform: 'none' }}
          >
            Mark as Complete
          </Button>
        )}
        {task.status !== 'in_progress' && task.status !== 'completed' && (
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<TimeIcon />}
            onClick={() => handleStatusChange('in_progress')}
            sx={{ textTransform: 'none' }}
          >
            Start Working
          </Button>
        )}
      </Box>
      
      {/* Tabs */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="task details tabs"
          >
            <Tab label="Details" />
            <Tab 
              label={
                <Box display="flex" alignItems="center">
                  <CommentIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  <span>Comments ({comments.length})</span>
                </Box>
              } 
            />
            <Tab label="Activity" />
          </Tabs>
        </Box>
        
        {/* Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                {task.description ? (
                  <Box sx={{ '& p': { mb: 2 } }}>
                    <Markdown>{task.description}</Markdown>
                  </Box>
                ) : (
                  <Typography color="textSecondary" fontStyle="italic">
                    No description provided.
                  </Typography>
                )}
              </Paper>
              
              {/* Attachments Section */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Attachments</Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={() => {}}
                  >
                    Add File
                  </Button>
                </Box>
                <Typography color="textSecondary">
                  No attachments yet.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Task Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Assigned To
                    </Typography>
                    {task.assignedTo ? (
                      <Box display="flex" alignItems="center" mt={1}>
                        <Avatar 
                          src={task.assignedTo.avatar} 
                          alt={task.assignedTo.name}
                          sx={{ width: 32, height: 32, mr: 1 }}
                        />
                        <Typography>{task.assignedTo.name}</Typography>
                      </Box>
                    ) : (
                      <Typography color="textSecondary">Unassigned</Typography>
                    )}
                  </Box>
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Due Date
                    </Typography>
                    <Typography>
                      {task.dueDate 
                        ? format(new Date(task.dueDate), 'MMM d, yyyy')
                        : 'No due date'}
                    </Typography>
                  </Box>
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created
                    </Typography>
                    <Typography>
                      {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                  
                  {task.estimatedHours > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Estimated Hours
                      </Typography>
                      <Typography>{task.estimatedHours} hours</Typography>
                    </Box>
                  )}
                  
                  {task.tags && task.tags.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Tags
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {task.tags.map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag} 
                            size="small"
                            icon={<LabelIcon fontSize="small" />}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              {/* Task Actions */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Task Actions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<AttachFileIcon />}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                  >
                    Add Attachment
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    startIcon={<LabelIcon />}
                    sx={{ mb: 1, justifyContent: 'flex-start' }}
                  >
                    Add Tag
                  </Button>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Delete Task
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Comments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box component="form" onSubmit={handleAddComment} mb={3}>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                      <Button 
                        type="submit" 
                        variant="contained" 
                        size="small"
                        disabled={!newComment.trim()}
                      >
                        Comment
                      </Button>
                    </Box>
                  ),
                }}
              />
            </Box>
            
            {comments.length > 0 ? (
              <Box>
                {comments.map((comment) => (
                  <Box key={comment._id} mb={3}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar 
                        src={comment.user.avatar} 
                        alt={comment.user.name}
                        sx={{ width: 32, height: 32, mr: 1 }}
                      />
                      <Box>
                        <Typography variant="subtitle2">
                          {comment.user.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Box>
                    <Box pl={5}>
                      <Typography>{comment.content}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box textAlign="center" py={3}>
                <CommentIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body1" color="textSecondary">
                  No comments yet. Be the first to comment!
                </Typography>
              </Box>
            )}
          </Paper>
        </TabPanel>
        
        {/* Activity Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity Log
            </Typography>
            <Typography color="textSecondary">
              Activity log will appear here.
            </Typography>
          </Paper>
        </TabPanel>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTask} 
            color="error"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail;
