// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock Intl for tests
if (!global.Intl) {
  global.Intl = require('intl');
}

// Mock the router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'test-key',
  }),
  useParams: () => ({}),
  useRouteMatch: () => ({}),
}));

// Mock axios
jest.mock('axios');

// Mock Material-UI components that cause issues in tests
jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material');
  return {
    ...original,
    // Add any Material-UI components that need special handling
    useMediaQuery: jest.fn().mockReturnValue(false),
    useTheme: jest.fn().mockReturnValue({
      breakpoints: { up: jest.fn().mockReturnValue(true) },
      spacing: (value) => value * 8,
    }),
  };
});

// Mock document services using manual mock in __mocks__ directory
jest.mock('@/services/documentService');

// Mock window.URL.createObjectURL
window.URL.createObjectURL = jest.fn();
