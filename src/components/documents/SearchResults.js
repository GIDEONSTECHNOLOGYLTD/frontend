import React from 'react';
import PropTypes from 'prop-types';
import { useSearch } from '../../context/SearchContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Chip,
  LinearProgress,
  Pagination,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  SearchOff as NoResultsIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const SearchResults = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { results, isSearching, error, goToPage } = useSearch();
  const { documents, pagination } = results;

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      </Box>
    );
  }

  if (isSearching) {
    return <LinearProgress />;
  }

  if (!documents || documents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <NoResultsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No documents found
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Try adjusting your search or filters to find what you're looking for.
        </Typography>
      </Box>
    );
  }

  const handlePageChange = (event, page) => {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        {pagination.total} {pagination.total === 1 ? 'result' : 'results'} found
      </Typography>

      <Stack spacing={2} sx={{ mb: 4 }}>
        {documents.map((doc) => (
          <DocumentCard key={doc._id} document={doc} />
        ))}
      </Stack>

      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={isMobile ? 1 : 2}
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      )}
    </Box>
  );
};

const DocumentCard = ({ document }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getFileIcon = (fileType) => {
    if (!fileType) return <FileIcon />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileIcon sx={{ color: '#F40F02' }} />;
    if (type.includes('word') || type.includes('doc')) return <FileIcon sx={{ color: '#2B579A' }} />;
    if (type.includes('excel') || type.includes('xls')) return <FileIcon sx={{ color: '#217346' }} />;
    if (type.includes('powerpoint') || type.includes('ppt')) return <FileIcon sx={{ color: '#D24726' }} />;
    if (type.includes('image')) return <FileIcon sx={{ color: '#4CAF50' }} />;
    return <FileIcon />;
  };

  return (
    <Card variant="outlined">
      <CardActionArea component="a" href={`/documents/${document._id}`}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Box sx={{ mr: 2, mt: 0.5 }}>
              {getFileIcon(document.fileType)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" noWrap>
                {document.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                {document.description || 'No description'}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5, maxHeight: isMobile ? 'none' : '60px', overflow: 'hidden' }}>
                {document.tags?.slice(0, isMobile ? 3 : 5).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag.name || tag}
                    size="small"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      mb: 0.5,
                      maxWidth: isMobile ? '100px' : 'none',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  />
                ))}
                {document.tags?.length > (isMobile ? 3 : 5) && (
                  <Chip
                    label={`+${document.tags.length - (isMobile ? 3 : 5)}`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: isMobile ? 1 : 2, 
                mt: 1.5, 
                fontSize: isMobile ? '0.7rem' : '0.75rem' 
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: 'text.secondary',
                  flex: isMobile ? '1 1 100%' : '0 0 auto'
                }}>
                  <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Box component="span" sx={{ 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: isMobile ? '120px' : 'none'
                  }}>
                    {document.createdBy?.name || 'Unknown'}
                  </Box>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: 'text.secondary',
                  flex: isMobile ? '1 1 100%' : '0 0 auto'
                }}>
                  <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <span>
                    {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
                  </span>
                </Box>
                {document.fileSize && (
                  <Box sx={{ 
                    color: 'text.secondary',
                    flex: isMobile ? '1 1 100%' : '0 0 auto'
                  }}>
                    {(document.fileSize / 1024).toFixed(1)} KB
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1, bgcolor: 'action.hover' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FolderIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {document.folder?.name || 'No folder'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FileIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {document.fileType?.toUpperCase() || 'FILE'}
          </Typography>
        </Box>
      </CardActions>
    </Card>
  );
};

DocumentCard.propTypes = {
  document: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    fileType: PropTypes.string,
    fileSize: PropTypes.number,
    updatedAt: PropTypes.string.isRequired,
    createdBy: PropTypes.shape({
      name: PropTypes.string
    }),
    folder: PropTypes.shape({
      name: PropTypes.string
    }),
    tags: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          name: PropTypes.string
        })
      ])
    )
  }).isRequired
};

export default SearchResults;
