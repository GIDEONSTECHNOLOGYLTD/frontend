import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

export const renderWithProviders = (ui, { route = '/', ...options } = {}) => {
  const theme = createTheme();
  
  const AllTheProviders = ({ children }) => (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    </ThemeProvider>
  );

  return render(ui, { wrapper: AllTheProviders, ...options });
};

export * from '@testing-library/react';
export { renderWithProviders as render };
