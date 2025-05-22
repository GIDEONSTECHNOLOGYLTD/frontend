import React from 'react';

const DocumentCard = ({ document }) => (
  <div data-testid="document-card">
    <h3>{document.name}</h3>
    <p>{document.description}</p>
    {document.tags && document.tags.map((tag, index) => (
      <span key={index} className="tag">{tag}</span>
    ))}
  </div>
);

export default DocumentCard;
