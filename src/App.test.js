import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock components to avoid actual API calls during tests
jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  }
}));

test('renders without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Just check that the app renders without crashing
  expect(document.body).toBeInTheDocument();
});

