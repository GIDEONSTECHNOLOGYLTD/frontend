import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config.js';
// Material-UI components
import {
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Grid,
  Paper,
  Box,
  Chip,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  FormHelperText,
  CircularProgress,
  Switch,
  Avatar
} from '@mui/material';

// Icons
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LowPriorityIcon from '@mui/icons-material/LowPriority';

// Date picker components
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Component aliases for consistency
const ProjectIcon = CategoryIcon;
const AssigneeIcon = AssignmentIndIcon;
const PriorityIcon = LowPriorityIcon;

const TaskForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: null,
    assignedTo: '',
    project: '',
    estimatedHours: 0,
    tags: [],
    isBillable: false,
    attachments: []
  });
  const [submitError, setSubmitError] = useState('');
  const socket = useWebSocket();

  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const fetchTask = useCallback(async (taskId) => {
    try {
      const token = localStorage.getItem('gts_token');
      const response = await axios.get(`${API_URL}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const taskData = response.data.data;
      setFormData({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        assignedTo: taskData.assignedTo || '',
        project: taskData.project || '',
        estimatedHours: taskData.estimatedHours || 0,
        tags: taskData.tags || [],
        isBillable: taskData.isBillable || false,
        attachments: taskData.attachments || []
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      setSubmitError('Failed to load task details');
    }
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('gts_token');
      const response = await axios.get(`${API_URL}/users/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const token = localStorage.getItem('gts_token');
        
        // Fetch projects and team members in parallel
        const [projectsRes, teamMembers] = await Promise.all([
          axios.get(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetchTeamMembers()
        ]);
        
        setProjects(projectsRes.data.data || []);
        setTeamMembers(teamMembers);

        if (isEditMode && id) {
          await fetchTask(id);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setSubmitError('Failed to load form data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormData();
  }, [id, isEditMode, fetchTask, fetchTeamMembers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
      newErrors.estimatedHours = 'Estimated hours must be a positive number';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setFormErrors({});
    setSubmitError('');
    
    try {
      const token = localStorage.getItem('gts_token');
      const url = isEditMode ? `${API_URL}/tasks/${id}` : `${API_URL}/tasks`;
      const method = isEditMode ? 'put' : 'post';
      
      // Prepare task data
      const taskData = {
        ...formData,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : null
      };
      
      // Send request
      const response = await axios[method](
        url,
        taskData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Send WebSocket notification if task is assigned to someone
      if (formData.assignedTo && formData.assignedTo.length > 0 && socket) {
        const notification = {
          type: 'TASK_ASSIGNED',
          taskId: response.data.data._id,
          taskTitle: formData.title,
          assignedTo: formData.assignedTo,
          assignedBy: user._id,
          timestamp: new Date().toISOString()
        };
        
        socket.send(JSON.stringify(notification));
      }
      
      navigate('/tasks');
    } catch (err) {
      console.error('Error saving task:', err);
      setSubmitError(err.response?.data?.message || 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h2">
              {isEditMode ? 'Edit Task' : 'Create New Task'}
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              onClick={() => navigate('/tasks')}
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading ? 'Saving...' : 'Save Task'}
            </Button>
          </Box>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Task Details
                </Typography>
                <Divider />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal" error={Boolean(formErrors.title)}>
                    <TextField
                      name="title"
                      label="Title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      error={Boolean(formErrors.title)}
                      helperText={formErrors.title}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DescriptionIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(formErrors.project)}>
                    <InputLabel>Project</InputLabel>
                    <Select
                      name="project"
                      value={formData.project}
                      onChange={handleChange}
                      label="Project"
                      startAdornment={
                        <InputAdornment position="start">
                          <ProjectIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">
                        <em>No Project</em>
                      </MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project._id} value={project._id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.project && (
                      <FormHelperText>{formErrors.project}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(formErrors.assignedTo)}>
                    <InputLabel>Assigned To</InputLabel>
                    <Select
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      label="Assigned To"
                      startAdornment={
                        <InputAdornment position="start">
                          <AssigneeIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      {teamMembers.map((member) => (
                        <MenuItem key={member._id} value={member._id}>
                          {member.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.assignedTo && (
                      <FormHelperText>{formErrors.assignedTo}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(formErrors.status)}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                    </Select>
                    {formErrors.status && (
                      <FormHelperText>{formErrors.status}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(formErrors.priority)}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      label="Priority"
                      startAdornment={
                        <InputAdornment position="start">
                          <PriorityIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                    {formErrors.priority && (
                      <FormHelperText>{formErrors.priority}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(formErrors.dueDate)}>
                    <DatePicker
                      label="Due Date"
                      value={formData.dueDate}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth
                          error={Boolean(formErrors.dueDate)}
                          helperText={formErrors.dueDate}
                        />
                      )}
                    />
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Estimated Hours"
                    name="estimatedHours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={handleChange}
                    error={Boolean(formErrors.estimatedHours)}
                    helperText={formErrors.estimatedHours}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0, step: 0.5 },
                      endAdornment: <InputAdornment position="end">hours</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.isBillable} 
                        onChange={handleChange} 
                        name="isBillable"
                        color="primary"
                      />
                    }
                    label="Billable Task"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Divider />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Created By
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar 
                    alt={user?.name} 
                    src={user?.avatar} 
                    sx={{ width: 40, height: 40, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="body1">{user?.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date().toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                    {formData.tags.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        onDelete={() => {
                          setFormData(prev => ({
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== index)
                          }));
                        }}
                      />
                    ))}
                  </Box>
                  <Box display="flex">
                    <TextField
                      size="small"
                      placeholder="Add a tag"
                      value={formData.newTag || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          newTag: e.target.value
                        }));
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && formData.newTag) {
                          e.preventDefault();
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, prev.newTag],
                            newTag: ''
                          }));
                        }
                      }}
                    />
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        if (formData.newTag) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, prev.newTag],
                            newTag: ''
                          }));
                        }
                      }}
                      sx={{ ml: 1 }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default TaskForm;
