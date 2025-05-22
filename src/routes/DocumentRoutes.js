import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DocumentsPage from '../pages/DocumentsPage';

const DocumentRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DocumentsPage />} />
      <Route path="/project/:projectId" element={<DocumentsPage />} />
      <Route path="/folder/:folderId" element={<DocumentsPage />} />
    </Routes>
  );
};

export default DocumentRoutes;
