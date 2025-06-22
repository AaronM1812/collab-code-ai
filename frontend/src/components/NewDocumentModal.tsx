import React, { useState } from 'react';
import { apiService, CreateDocumentData } from '../services/api';
import './NewDocumentModal.css';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (document: any) => void;
}

const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated
}) => {
  const [formData, setFormData] = useState<CreateDocumentData>({
    name: '',
    content: '// Start coding here!',
    language: 'javascript'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Document name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newDocument = await apiService.createDocument(formData);
      onDocumentCreated(newDocument);
      onClose();
      // Reset form
      setFormData({
        name: '',
        content: '// Start coding here!',
        language: 'javascript'
      });
    } catch (err) {
      setError('Failed to create document');
      console.error('Error creating document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateDocumentData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Document</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="document-name">Document Name *</label>
            <input
              id="document-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter document name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="document-language">Language</label>
            <select
              id="document-language"
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="document-content">Initial Content</label>
            <textarea
              id="document-content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter initial code content"
              rows={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDocumentModal; 