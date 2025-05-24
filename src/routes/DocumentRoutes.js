import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentsPage from '../pages/DocumentsPage';
import PrivateRoute from '../components/routing/PrivateRoute';

const DocumentRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <DocumentsPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/project/:projectId" 
        element={
          <PrivateRoute>
            <DocumentsPage />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/folder/:folderId" 
        element={
          <PrivateRoute>
            <DocumentsPage />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

export default DocumentRoutes;
