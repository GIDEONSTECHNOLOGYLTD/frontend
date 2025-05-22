import React from 'react';
import { 
  Box, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  IconButton,
  LinearProgress,
  Typography
} from '@mui/material';
import { 
  AttachFile as AttachFileIcon, 
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

const FileUpload = ({ 
  files = [], 
  onChange, 
  maxFiles = 5, 
  maxSizeMB = 10,
  acceptedTypes = [
    'image/*', 
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}) => {
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }
    
    // Validate file types and sizes
    const validFiles = newFiles.filter(file => {
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.split('/*')[0]);
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        alert(`File type not supported: ${file.name}`);
        return false;
      }
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max size is ${maxSizeMB}MB`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Box>
      <input
        accept={acceptedTypes.join(',')}
        style={{ display: 'none' }}
        id="file-upload"
        multiple
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={files.length >= maxFiles}
          sx={{ mb: 2 }}
        >
          Upload Files
        </Button>
      </label>
      
      {files.length > 0 && (
        <List dense>
          {files.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton 
                  edge="end" 
                  onClick={() => removeFile(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              }
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'background.paper'
              }}
            >
              <ListItemIcon>
                <AttachFileIcon color="primary" />
              </ListItemIcon>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Typography noWrap variant="body2">
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
                {file.uploadProgress !== undefined && (
                  <LinearProgress 
                    variant={file.uploadProgress === 100 ? 'determinate' : 'determinate'}
                    value={file.uploadProgress || 0}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;
