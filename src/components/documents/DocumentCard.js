import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { InsertDriveFile as FileIcon } from '@mui/icons-material';

const DocumentCard = ({ document }) => {
  const { name, description, tags = [], fileType, fileSize, updatedAt, createdBy } = document;

  return (
    <Card data-testid="document-card" sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <FileIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            {name}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>
        
        <Box mb={2}>
          {tags.map((tag, index) => (
            <Chip 
              key={index} 
              label={tag} 
              size="small" 
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {fileType?.toUpperCase()} • {Math.round(fileSize / 1024)} KB
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Updated: {new Date(updatedAt).toLocaleDateString()}
          </Typography>
        </Box>
        
        {createdBy && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Created by: {createdBy.name}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

DocumentCard.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    fileType: PropTypes.string,
    fileSize: PropTypes.number,
    updatedAt: PropTypes.string,
    createdBy: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string
    })
  }).isRequired
};

export default DocumentCard;
