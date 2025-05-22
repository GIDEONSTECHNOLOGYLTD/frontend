import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentCard } from '../DocumentCard';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockDocument = {
  id: '1',
  name: 'Test Document',
  description: 'This is a test document',
  tags: ['test', 'document'],
  fileType: 'pdf',
  fileSize: 1024,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  createdBy: { name: 'Test User' }
};

describe('DocumentCard', () => {
  it('renders document details correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <DocumentCard document={mockDocument} />
      </ThemeProvider>
    );

    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('This is a test document')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('document')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    expect(screen.getByText(/ago/)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalDoc = {
      id: '2',
      name: 'Minimal Doc',
      fileType: 'pdf',
      updatedAt: new Date().toISOString(),
      createdBy: { name: 'User' }
    };

    render(
      <ThemeProvider theme={theme}>
        <DocumentCard document={minimalDoc} />
      </ThemeProvider>
    );

    expect(screen.getByText('Minimal Doc')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.queryByText(/KB/)).not.toBeInTheDocument();
  });
});
