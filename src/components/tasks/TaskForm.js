import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  Today as TodayIcon,
  Description as DescriptionIcon,
  LowPriority as PriorityIcon,
  AssignmentInd as AssigneeIcon,
  Category as ProjectIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const TaskForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    status: 'pending',
    priority: 'medium',
    dueDate: null,
    assignedTo: '',
    estimatedHours: '',
    isBillable: false,
    tags: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
    
    if (isEditMode) {
      fetchTask();
    }
  }, [id]);

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('gts_token');
      const [projectsRes, teamRes] = await Promise.all([
        axios.get(`${API_URL}/projects`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users/team`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setProjects(projectsRes.data.data || []);
      setTeamMembers(teamRes.data.data || []);

      // Set project from URL state if available
      if (location.state?.projectId) {
        setFormData(prev => ({
          ...prev,
          projectId: location.state.projectId
        }));
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('gts_token');
      const response = await axios.get(`${API_URL}/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const task = response.data.data;
      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.project?._id || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignedTo: task.assignedTo?._id || '',
        estimatedHours: task.estimatedHours || '',
        isBillable: task.isBillable || false,
        tags: task.tags || []
      });
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('gts_token');
      const payload = {
        ...formData,
        projectId: formData.projectId || undefined,
        assignedTo: formData.assignedTo || undefined,
        estimatedHours: formData.estimatedHours || undefined,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined
      };

      if (isEditMode) {
        await axios.patch(
          `${API_URL}/tasks/${id}`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        await axios.post(
          `${API_URL}/tasks`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      navigate('/tasks');
    } catch (error) {
      console.error('Error saving task:', error);
      if (error.response?.data?.errors) {
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          apiErrors[err.param] = err.msg;
        });
        setErrors(apiErrors);
      } else {
        setErrors({ submit: error.response?.data?.message || 'Failed to save task' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
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
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={submitting}
            >
              {isEditMode ? 'Update' : 'Create'} Task
            </Button>
          </Box>
        </Box>

        {errors.submit && (
          <Box mb={3}>
            <Typography color="error">{errors.submit}</Typography>
          </Box>
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
                  <TextField
                    fullWidth
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    error={Boolean(errors.title)}
                    helperText={errors.title}
                    required
                    variant="outlined"
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    error={Boolean(errors.description)}
                    helperText={errors.description || 'Markdown is supported'}
                    multiline
                    rows={4}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(errors.projectId)}>
                    <InputLabel>Project</InputLabel>
                    <Select
                      name="projectId"
                      value={formData.projectId}
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
                    {errors.projectId && (
                      <FormHelperText>{errors.projectId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(errors.assignedTo)}>
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
                    {errors.assignedTo && (
                      <FormHelperText>{errors.assignedTo}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(errors.status)}>
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
                    {errors.status && (
                      <FormHelperText>{errors.status}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(errors.priority)}>
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
                    {errors.priority && (
                      <FormHelperText>{errors.priority}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal" error={Boolean(errors.dueDate)}>
                    <DatePicker
                      label="Due Date"
                      value={formData.dueDate}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth
                          error={Boolean(errors.dueDate)}
                          helperText={errors.dueDate}
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
                    error={Boolean(errors.estimatedHours)}
                    helperText={errors.estimatedHours}
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
