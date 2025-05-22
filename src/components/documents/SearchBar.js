import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../context/SearchContext';
import {
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
  Typography,
  Divider,
  Popover,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Tag as TagIcon,
  Folder as FolderIcon,
  Work as WorkIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';

const SearchBar = () => {
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    clearFilters,
    suggestions,
    isSearching,
    search
  } = useSearch();

  const [anchorEl, setAnchorEl] = useState(null);
  const [localFilters, setLocalFilters] = useState(filters);
  const inputRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync local filters with context filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      search();
      inputRef.current.blur();
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    search(suggestion);
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterApply = () => {
    setFilters(localFilters);
    setAnchorEl(null);
    search(searchQuery, 1);
  };

  const handleFilterReset = () => {
    const resetFilters = {
      tags: [],
      folder: '',
      project: '',
      fileType: ''
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    setAnchorEl(null);
    search(searchQuery, 1);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'search-filters-popover' : undefined;

  const hasActiveFilters = Object.values(filters).some(
    value => (Array.isArray(value) ? value.length > 0 : Boolean(value))
  );

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 800, mx: 'auto' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search documents..."
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        inputRef={inputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isSearching ? (
                <Box sx={{ display: 'flex', p: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                </Box>
              ) : searchQuery ? (
                <IconButton
                  edge="end"
                  onClick={handleClear}
                  size="small"
                  aria-label="clear search"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : null}
              <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
              <IconButton
                edge="end"
                onClick={handleFilterClick}
                color={hasActiveFilters ? 'primary' : 'default'}
                aria-label="filters"
                disabled={isSearching}
              >
                <FilterIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Search suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            mt: 1,
            maxHeight: 300,
            overflow: 'auto'
          }}
        >
          <List dense>
            {suggestions.map((suggestion, index) => (
              <React.Fragment key={index}>
                <ListItem
                  button
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <ListItemIcon>
                    <SearchIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
                {index < suggestions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Active filters */}
      {hasActiveFilters && (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filters.tags?.map((tag, index) => (
            <Chip
              key={index}
              icon={<TagIcon />}
              label={tag.name || tag}
              onDelete={() => {
                const newTags = filters.tags.filter((_, i) => i !== index);
                setFilters({ ...filters, tags: newTags });
                search(searchQuery, 1);
              }}
              size="small"
            />
          ))}
          {filters.folder && (
            <Chip
              icon={<FolderIcon />}
              label={`Folder: ${filters.folder}`}
              onDelete={() => {
                setFilters({ ...filters, folder: '' });
                search(searchQuery, 1);
              }}
              size="small"
            />
          )}
          {filters.project && (
            <Chip
              icon={<WorkIcon />}
              label={`Project: ${filters.project}`}
              onDelete={() => {
                setFilters({ ...filters, project: '' });
                search(searchQuery, 1);
              }}
              size="small"
            />
          )}
          {filters.fileType && (
            <Chip
              icon={<FileIcon />}
              label={`Type: ${filters.fileType}`}
              onDelete={() => {
                setFilters({ ...filters, fileType: '' });
                search(searchQuery, 1);
              }}
              size="small"
            />
          )}
          <Button
            size="small"
            onClick={() => {
              clearFilters();
              search(searchQuery, 1);
            }}
          >
            Clear all
          </Button>
        </Box>
      )}

      {/* Filter popover */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle1" gutterBottom>
            Filter Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>File Type</InputLabel>
                <Select
                  name="fileType"
                  value={localFilters.fileType || ''}
                  onChange={handleFilterChange}
                  label="File Type"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="docx">Word</MenuItem>
                  <MenuItem value="xlsx">Excel</MenuItem>
                  <MenuItem value="pptx">PowerPoint</MenuItem>
                  <MenuItem value="txt">Text</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Add more filter fields here */}
            
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleFilterReset} color="error" size="small">
                Reset
              </Button>
              <Button
                onClick={handleFilterApply}
                variant="contained"
                color="primary"
                size="small"
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </Box>
  );
};

export default SearchBar;
