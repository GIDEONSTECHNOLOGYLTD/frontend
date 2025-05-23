import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config.js';
import { setAlert } from '../../actions/alert';
import { 
  Box, 
  Chip, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton,
  Typography,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';

const TagManager = ({ documentId, documentTags = [], onTagsUpdate }) => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#808080');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  
  // User authentication is handled by the auth header in axios requests
  const dispatch = useDispatch();

  // Fetch user's tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/tags`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTags(res.data.data);
      } catch (err) {
        console.error('Error fetching tags:', err);
        dispatch(setAlert('Failed to load tags', 'error'));
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [dispatch]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const res = await axios.post(
        `${API_URL}/api/v1/tags`,
        { name: newTagName, color: selectedColor },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setTags([...tags, res.data.data]);
      setNewTagName('');
      setSelectedColor('#808080');
      dispatch(setAlert('Tag created successfully', 'success'));
    } catch (err) {
      console.error('Error creating tag:', err);
      dispatch(setAlert(err.response?.data?.error || 'Failed to create tag', 'error'));
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !selectedTag) return;
    
    try {
      const res = await axios.put(
        `${API_URL}/api/v1/tags/${editingTag._id}`,
        { name: editingTag.name, color: editingTag.color },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setTags(tags.map(tag => 
        tag._id === editingTag._id ? res.data.data : tag
      ));
      
      setEditingTag(null);
      setSelectedTag(null);
      setAnchorEl(null);
      dispatch(setAlert('Tag updated successfully', 'success'));
    } catch (err) {
      console.error('Error updating tag:', err);
      dispatch(setAlert(err.response?.data?.error || 'Failed to update tag', 'error'));
    }
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    
    try {
      await axios.delete(
        `${API_URL}/api/v1/tags/${selectedTag._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setTags(tags.filter(tag => tag._id !== selectedTag._id));
      setSelectedTag(null);
      setAnchorEl(null);
      
      // If this tag was attached to the current document, update the document
      if (documentTags.some(tag => tag._id === selectedTag._id)) {
        await updateDocumentTags(documentTags.filter(tag => tag._id !== selectedTag._id));
      }
      
      dispatch(setAlert('Tag deleted successfully', 'success'));
    } catch (err) {
      console.error('Error deleting tag:', err);
      dispatch(setAlert(err.response?.data?.error || 'Failed to delete tag', 'error'));
    }
  };

  const updateDocumentTags = async (updatedTags) => {
    try {
      const tagIds = updatedTags.map(tag => tag._id || tag);
      const res = await axios.put(
        `${API_URL}/api/v1/documents/${documentId}`,
        { tagIds },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (onTagsUpdate) {
        onTagsUpdate(res.data.data);
      }
      
      return true;
    } catch (err) {
      console.error('Error updating document tags:', err);
      dispatch(setAlert(err.response?.data?.error || 'Failed to update document tags', 'error'));
      return false;
    }
  };

  const handleTagClick = (tag, event) => {
    setSelectedTag(tag);
    setAnchorEl(event.currentTarget);
  };

  const handleTagSelect = async (tag) => {
    if (!documentId) return;
    
    const isSelected = documentTags.some(t => t._id === tag._id || t === tag._id);
    let updatedTags;
    
    if (isSelected) {
      updatedTags = documentTags.filter(t => t._id !== tag._id && t !== tag._id);
    } else {
      updatedTags = [...documentTags, tag._id];
    }
    
    await updateDocumentTags(updatedTags);
  };

  const handleEditClick = () => {
    if (!selectedTag) return;
    setEditingTag({ ...selectedTag });
    setSelectedColor(selectedTag.color);
    setAnchorEl(null);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
    setEditingTag(prev => ({
      ...prev,
      color: color.hex
    }));
  };

  if (loading) {
    return <div>Loading tags...</div>;
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Tags
      </Typography>
      
      <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
        {documentTags.map((tag) => (
          <Chip
            key={tag._id || tag}
            label={typeof tag === 'object' ? tag.name : tags.find(t => t._id === tag)?.name || 'Unknown Tag'}
            onDelete={() => handleTagSelect(tag)}
            onClick={(e) => handleTagClick(tag, e)}
            style={{
              backgroundColor: typeof tag === 'object' ? tag.color : tags.find(t => t._id === tag)?.color || '#808080',
              color: '#fff',
              cursor: 'pointer'
            }}
            deleteIcon={<DeleteIcon style={{ color: '#fff' }} />}
          />
        ))}
      </Box>
      
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TextField
          size="small"
          placeholder="New tag name"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
          disabled={!newTagName.trim()}
        />
        <Tooltip title="Select color">
          <IconButton 
            onClick={() => setColorPickerOpen(true)}
            style={{ backgroundColor: selectedColor, color: '#fff' }}
          >
            <ColorLensIcon />
          </IconButton>
        </Tooltip>
        <Button 
          variant="contained" 
          onClick={handleCreateTag}
          disabled={!newTagName.trim()}
          startIcon={<AddIcon />}
        >
          Add
        </Button>
      </Box>
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Available Tags
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {tags.map((tag) => {
            const isSelected = documentTags.some(t => t._id === tag._id || t === tag._id);
            return (
              <Chip
                key={tag._id}
                label={tag.name}
                onClick={() => handleTagSelect(tag)}
                onDelete={(e) => {
                  e.stopPropagation();
                  setSelectedTag(tag);
                  handleDeleteTag();
                }}
                style={{
                  backgroundColor: isSelected ? tag.color : '#f0f0f0',
                  color: isSelected ? '#fff' : '#000',
                  cursor: 'pointer',
                  border: isSelected ? 'none' : '1px solid #ddd'
                }}
                deleteIcon={<DeleteIcon style={{ color: isSelected ? '#fff' : '#666' }} />}
              />
            );
          })}
        </Box>
      </Box>
      
      {/* Color Picker Dialog */}
      <Dialog 
        open={colorPickerOpen} 
        onClose={() => setColorPickerOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Select Tag Color</DialogTitle>
        <DialogContent>
          <ChromePicker
            color={selectedColor}
            onChangeComplete={handleColorChange}
            disableAlpha
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColorPickerOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              setColorPickerOpen(false);
              if (editingTag) {
                handleUpdateTag();
              }
            }}
            color="primary"
            variant="contained"
          >
            {editingTag ? 'Update' : 'Select'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Tag Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Tag</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteTag}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>Delete Tag</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TagManager;
