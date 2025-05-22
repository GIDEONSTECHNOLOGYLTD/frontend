// Mock for Material-UI core components
const mockComponent = (name) => (props) => {
  return <div data-testid={`mock-${name}`} {...props} />;
};

// Mock commonly used Material-UI components
export const Box = mockComponent('Box');
export const Button = mockComponent('Button');
export const Card = mockComponent('Card');
export const CardContent = mockComponent('CardContent');
export const CardHeader = mockComponent('CardHeader');
export const Checkbox = mockComponent('Checkbox');
export const Chip = mockComponent('Chip');
export const CircularProgress = mockComponent('CircularProgress');
export const Container = mockComponent('Container');
export const Dialog = mockComponent('Dialog');
export const DialogActions = mockComponent('DialogActions');
export const DialogContent = mockComponent('DialogContent');
export const DialogTitle = mockComponent('DialogTitle');
export const Divider = mockComponent('Divider');
export const FormControl = mockComponent('FormControl');
export const FormControlLabel = mockComponent('FormControlLabel');
export const Grid = mockComponent('Grid');
export const IconButton = mockComponent('IconButton');
export const InputAdornment = mockComponent('InputAdornment');
export const InputLabel = mockComponent('InputLabel');
export const Link = mockComponent('Link');
export const List = mockComponent('List');
export const ListItem = mockComponent('ListItem');
export const ListItemIcon = mockComponent('ListItemIcon');
export const ListItemText = mockComponent('ListItemText');
export const Menu = mockComponent('Menu');
export const MenuItem = mockComponent('MenuItem');
export const Paper = mockComponent('Paper');
export const Select = mockComponent('Select');
export const Snackbar = mockComponent('Snackbar');
export const TextField = mockComponent('TextField');
export const Toolbar = mockComponent('Toolbar');
export const Tooltip = mockComponent('Tooltip');
export const Typography = mockComponent('Typography');

// Mock theme-related functions
export const createTheme = jest.fn(() => ({}));
export const ThemeProvider = mockComponent('ThemeProvider');

// Mock responsive utilities
export const useMediaQuery = jest.fn(() => true);

export default {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  createTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery
};
