import React, { useState, useEffect } from 'react';
import { apiService, User, Collaborator, ShareDocumentData } from '../services/api';
import './ShareDocumentModal.css';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
}

const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'read' | 'write'>('read');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);

  // Load collaborators when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      loadCollaborators();
    }
  }, [isOpen, documentId]);

  const loadCollaborators = async () => {
    try {
      setLoadingCollaborators(true);
      const collabs = await apiService.getDocumentCollaborators(documentId);
      setCollaborators(collabs);
    } catch (err: any) {
      setError('Failed to load collaborators');
      console.error('Error loading collaborators:', err);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const shareData: ShareDocumentData = {
        email: email.trim(),
        permission
      };

      await apiService.shareDocument(documentId, shareData);
      setSuccess('Document shared successfully!');
      setEmail('');
      setPermission('read');
      
      // Reload collaborators list
      await loadCollaborators();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from this document?`)) {
      return;
    }

    try {
      await apiService.removeCollaborator(documentId, userId);
      setSuccess(`${username} removed from document`);
      await loadCollaborators();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove collaborator');
    }
  };

  const handleUpdatePermission = async (userId: string, newPermission: 'read' | 'write') => {
    try {
      await apiService.updateCollaboratorPermission(documentId, userId, newPermission);
      setSuccess('Permission updated successfully');
      await loadCollaborators();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update permission');
    }
  };

  const handleClose = () => {
    setEmail('');
    setPermission('read');
    setError('');
    setSuccess('');
    setCollaborators([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={handleClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share Document</h3>
          <button className="share-modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="share-modal-content">
          <div className="document-info">
            <h4>{documentName}</h4>
          </div>

          {/* Share Form */}
          <form onSubmit={handleShare} className="share-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="permission">Permission</label>
              <select
                id="permission"
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'read' | 'write')}
                disabled={loading}
              >
                <option value="read">Read only</option>
                <option value="write">Can edit</option>
              </select>
            </div>

            <button type="submit" className="share-btn" disabled={loading || !email.trim()}>
              {loading ? 'Sharing...' : 'Share Document'}
            </button>
          </form>

          {/* Messages */}
          {error && <div className="share-error">{error}</div>}
          {success && <div className="share-success">{success}</div>}

          {/* Collaborators List */}
          <div className="collaborators-section">
            <h4>Current Collaborators</h4>
            {loadingCollaborators ? (
              <div className="loading">Loading collaborators...</div>
            ) : collaborators.length === 0 ? (
              <div className="no-collaborators">No collaborators yet</div>
            ) : (
              <div className="collaborators-list">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.userId} className="collaborator-item">
                    <div className="collaborator-info">
                      <span className="collaborator-name">{collaborator.username}</span>
                      <span className="collaborator-email">{collaborator.email}</span>
                    </div>
                    <div className="collaborator-actions">
                      <select
                        value={collaborator.permission}
                        onChange={(e) => handleUpdatePermission(collaborator.userId, e.target.value as 'read' | 'write')}
                        className="permission-select"
                      >
                        <option value="read">Read only</option>
                        <option value="write">Can edit</option>
                      </select>
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.userId, collaborator.username)}
                        className="remove-btn"
                        title="Remove collaborator"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDocumentModal; 