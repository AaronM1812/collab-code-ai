import React, { useState, useEffect } from 'react';
import { apiService, Document } from '../services/api';
import './DocumentList.css';

interface DocumentListProps {
  onDocumentSelect: (document: Document) => void;
  onNewDocument: () => void;
  onShareDocument: (document: Document) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onDocumentSelect, onNewDocument, onShareDocument }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'owned' | 'shared'>('all');

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [viewMode]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      let docs: Document[];
      
      switch (viewMode) {
        case 'owned':
          docs = await apiService.getOwnedDocuments();
          break;
        case 'shared':
          docs = await apiService.getSharedDocuments();
          break;
        default:
          docs = await apiService.getDocuments();
      }
      
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      setLoading(true);
      const docs = await apiService.searchDocuments(searchQuery);
      setDocuments(docs);
      setError(null);
    } catch (err) {
      setError('Failed to search documents');
      console.error('Error searching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const isDocumentOwner = (document: Document) => {
    const user = getCurrentUser();
    return user && document.userId === user.id;
  };

  const getDocumentType = (document: Document) => {
    if (isDocumentOwner(document)) {
      return 'owned';
    }
    return 'shared';
  };

  if (loading) {
    return <div className="document-list-loading">Loading documents...</div>;
  }

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h2>Documents</h2>
        <button className="new-document-btn" onClick={onNewDocument}>
          + New Document
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          className={`tab ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All Documents
        </button>
        <button
          className={`tab ${viewMode === 'owned' ? 'active' : ''}`}
          onClick={() => setViewMode('owned')}
        >
          My Documents
        </button>
        <button
          className={`tab ${viewMode === 'shared' ? 'active' : ''}`}
          onClick={() => setViewMode('shared')}
        >
          Shared With Me
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-btn">
          Search
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="documents-container">
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>No documents found</p>
            <p>Create your first document to get started!</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="document-item"
              onClick={() => onDocumentSelect(doc)}
            >
              <div className="document-info">
                <div className="document-header">
                  <h3 className="document-name">{doc.name}</h3>
                  <div className="document-badges">
                    <span className={`document-type ${getDocumentType(doc)}`}>
                      {getDocumentType(doc) === 'owned' ? '📁' : '👥'}
                    </span>
                    <span className="document-language">{doc.language}</span>
                  </div>
                </div>
                <div className="document-meta">
                  <p className="document-owner">
                    {isDocumentOwner(doc) ? 'You' : `Owner: ${doc.owner || 'Unknown'}`}
                  </p>
                  {doc.collaborators && doc.collaborators.length > 0 && (
                    <p className="document-collaborators">
                      {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  <p className="document-date">
                    Last updated: {formatDate(doc.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="document-actions">
                {isDocumentOwner(doc) && (
                  <button
                    className="share-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareDocument(doc);
                    }}
                    title="Share document"
                  >
                    📤
                  </button>
                )}
                {isDocumentOwner(doc) && (
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteDocument(doc._id, e)}
                    title="Delete document"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentList; 