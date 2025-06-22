//this is the main file for the app, like the homepage

//importing react, used for UI in js, use effect for running code when component loads/updates, use ref to keep a value, doesnt change when component re-renders, use ref to store socket connection
import React, { useState, useEffect, useRef } from 'react';
//importing the monocoeditor which is used in the app
import MonacoEditor from '@monaco-editor/react';
//importing socket.io-client to connect to the backend socket.io server
import { io, Socket } from 'socket.io-client';
//importing our new components
import DocumentList from './components/DocumentList';
import NewDocumentModal from './components/NewDocumentModal';
import { Document, apiService } from './services/api';
import './App.css';

//main app components which will return the UI that will be shown in the browser
function App() {
  //state to store the current document
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  //state to store the current code
  const [code, setCode] = useState('// Start coding here!');
  //state to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  //ref to control the editor
  const editorRef = useRef<any>(null);
  //socket reference (so it persists across renders, through use ref)
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend socket.io server
    socketRef.current = io('http://localhost:3001');

    // When connected, log a message
    socketRef.current.on('connect', () => {
      console.log('Connected to backend with socket id:', socketRef.current?.id);
    });

    // Listen for code updates from other users
    socketRef.current.on('code-update', (data) => {
      console.log('Received code update from user:', data.userId);
      console.log('Received code:', data.code);
      setCode(data.code);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Function to handle document selection
  const handleDocumentSelect = async (document: Document) => {
    try {
      // Load the full document from the API
      const fullDocument = await apiService.getDocument(document._id);
      setCurrentDocument(fullDocument);
      setCode(fullDocument.content);
      
      // Join the document room for real-time collaboration
      if (socketRef.current) {
        socketRef.current.emit('join-document', document._id);
        console.log('Joined document room:', document._id);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  // Function to handle new document creation
  const handleNewDocument = () => {
    setIsModalOpen(true);
  };

  // Function to handle document creation from modal
  const handleDocumentCreated = (newDocument: Document) => {
    setCurrentDocument(newDocument);
    setCode(newDocument.content);
    
    // Join the new document room
    if (socketRef.current) {
      socketRef.current.emit('join-document', newDocument._id);
      console.log('Joined new document room:', newDocument._id);
    }
  };

  // Function to save document changes
  const saveDocument = async () => {
    if (!currentDocument) return;

    try {
      const updatedDocument = await apiService.updateDocument(currentDocument._id, {
        content: code
      });
      setCurrentDocument(updatedDocument);
      console.log('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!currentDocument) return;

    const autoSaveTimer = setTimeout(() => {
      saveDocument();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [code, currentDocument]);

  return (
    //this is the main container for the app, it takes up the full height and width of the screen
    <div className="app-container">
      {/* Document List Sidebar */}
      <DocumentList
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
      />

      {/* Main Editor Area */}
      <div className="editor-container">
        {/* Editor Header */}
        <div className="editor-header">
          <div className="document-info">
            {currentDocument ? (
              <>
                <h2>{currentDocument.name}</h2>
                <span className="language-badge">{currentDocument.language}</span>
                <span className="last-saved">Last saved: {new Date(currentDocument.updatedAt).toLocaleTimeString()}</span>
              </>
            ) : (
              <h2>Select a document to start coding</h2>
            )}
          </div>
          {currentDocument && (
            <button className="save-btn" onClick={saveDocument}>
              Save
            </button>
          )}
        </div>

        {/* Monaco Editor */}
        <div className="editor-wrapper">
          <MonacoEditor
            height="100%"
            defaultLanguage="javascript"
            language={currentDocument?.language || 'javascript'}
            value={code}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
            }}
            onChange={(value) => {
              if (value !== undefined) {
                setCode(value);
                // Send code changes to backend for real-time sync
                if (socketRef.current && currentDocument) {
                  socketRef.current.emit('code-change', {
                    documentId: currentDocument._id,
                    code: value
                  });
                }
              }
            }}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>
      </div>

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />
    </div>
  );
}

//makes component available to use in index.tsx(the entry point)
export default App;
