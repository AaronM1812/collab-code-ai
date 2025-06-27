//this is the main file for the app, like the homepage

//importing react, used for UI in js, use effect for running code when component loads/updates, use ref to keep a value, doesnt change when component re-renders, use ref to store socket connection
import React, { useState, useEffect, useRef } from 'react';
//importing the monocoeditor which is used in the app
import MonacoEditor from '@monaco-editor/react';
//importing socket.io-client to connect to the backend socket.io server
import { io, Socket } from 'socket.io-client';
//importing our new components
import DocumentList from './components/DocumentList';
//importing the new document modal
import NewDocumentModal from './components/NewDocumentModal';
//importing the AI assistant component
import AIAssistant from './components/AIAssistant';
//importing the UserPresence component
import UserPresence from './components/UserPresence';
//importing the CursorOverlay component
import CursorOverlay from './components/CursorOverlay';
//importing the api service to handle the api requests
import { Document, apiService } from './services/api';
//importing the css file for the app
import './App.css';
//importing AuthPage
import AuthPage from './components/AuthPage';
//importing TokenRefresh for automatic token management
import TokenRefresh from './components/TokenRefresh';
//importing ShareDocumentModal for document sharing
import ShareDocumentModal from './components/ShareDocumentModal';

//importing yjs and the websocket provider for real-time collaboration instead of socket.io
import * as Y from 'yjs';
//websocket connects app to the Yjs websocket server
import { WebsocketProvider } from 'y-websocket';
//monaco binding to sunc the editor with yjs for real time code collab
import { MonacoBinding } from 'y-monaco';

//main app components which will return the UI that will be shown in the browser
function App() {
  // All hooks at the top
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [code, setCode] = useState('// Start coding here!');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<Document | null>(null);
  const editorRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const yjsProviderRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<any>(null);
  const eventDisposablesRef = useRef<any[]>([]);

  //handle login success from AuthPage
  const handleLoginSuccess = (user: any, accessToken: string) => {
    setUser(user);
  };

  //handle logout
  const handleLogout = async () => {
    try {
      await apiService.logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  };

  //handle token expiration
  const handleTokenExpired = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  //handle share document
  const handleShareDocument = (document: Document) => {
    setDocumentToShare(document);
    setIsShareModalOpen(true);
  };

  //use effect to connect to the backend socket.io server
  useEffect(() => {
    socketRef.current = io('http://localhost:3001');
    socketRef.current.on('connect', () => {
      console.log('Connected to backend with socket id:', socketRef.current?.id);
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  //function to handle document selection
  const handleDocumentSelect = async (document: Document) => {
    try {
      //load the full document from the API
      const fullDocument = await apiService.getDocument(document._id);
      setCurrentDocument(fullDocument);
      setCode(fullDocument.content);
      
      //join the document room for real-time collaboration
      if (socketRef.current) {
        socketRef.current.emit('join-document', document._id);
        console.log('Joined document room:', document._id);
      }
    } catch (error) {
      console.error('Error loading document:', error);
    }
  };

  //function to handle new document creation
  const handleNewDocument = () => {
    setIsModalOpen(true);
  };

  //function to handle document creation from modal
  const handleDocumentCreated = (newDocument: Document) => {
    setCurrentDocument(newDocument);
    setCode(newDocument.content);
    
    //join the new document room
    if (socketRef.current) {
      socketRef.current.emit('join-document', newDocument._id);
      console.log('Joined new document room:', newDocument._id);
    }
  };

  //function to save document changes
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

  //auto-save functionality
  useEffect(() => {
    if (!currentDocument) return;

    const autoSaveTimer = setTimeout(() => {
      saveDocument();
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [code, currentDocument]);

  //this is the function to handle the insertion of the AI suggestion into the editor
  const handleInsertAISuggestion = (suggestion: string) => {
    //if the editor reference is not null
    if (editorRef.current) {
      //get the editor reference
      const editor = editorRef.current;
      //get the selection
      const selection = editor.getSelection();
      
      //if the selection is not null
      if (selection) {
        //replace selected text with AI suggestion
        editor.executeEdits('ai-suggestion', [{
          //range is the range of the selection
          range: selection,
          //text is the AI suggestion
          text: suggestion
        }]);
      } else {
        //insert at cursor position
        const position = editor.getPosition();
        //execute the edits
        editor.executeEdits('ai-suggestion', [{
          //range is the range of the selection
          range: {
            //start line number is the line number of the selection
            startLineNumber: position.lineNumber,
            //start column is the column number of the selection
            startColumn: position.column,
            //end line number is the line number of the selection
            endLineNumber: position.lineNumber,
            //end column is the column number of the selection
            endColumn: position.column
          },
          //text is the AI suggestion
          text: suggestion
        }]);
      }
    }
  };

  //this is the function to handle the real-time collaboration using yjs and monaco
  useEffect(() => {
    //only run if both the document is loaded and the ediotr is ready
    if (!currentDocument || !editorRef.current || !user) return;

    // Wait for the editor model to be available
    const editor = editorRef.current;
    const model = editor.getModel();
    
    if (!model) {
      console.log('Editor model not ready yet, waiting...');
      // Try again after a short delay
      const timer = setTimeout(() => {
        // This will trigger the effect again
      }, 100);
      return () => clearTimeout(timer);
    }

    let provider: WebsocketProvider;
    let ydoc: Y.Doc;
    let monacoBinding: any;

    try {
      //creating a new yjs document, datastructre for collaboration
      ydoc = new Y.Doc();

      //connecting to the yjs websocket server, using the document id as the room name
      provider = new WebsocketProvider('ws://localhost:1234', currentDocument._id, ydoc);
      yjsProviderRef.current = provider;
      awarenessRef.current = provider.awareness;

      //getting a shared text type for the code
      const yText = ydoc.getText('monaco');

      //binding the monaco editor to yjs
      monacoBinding = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        provider.awareness
      );

      // Set up user awareness
      const getRandomColor = (username: string) => {
        const colors = [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
          '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
          '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
        ];
        
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
          hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
      };

      // Set user information in awareness
      provider.awareness.setLocalStateField('user', {
        username: user.username,
        color: getRandomColor(user.username)
      });

      // Track cursor position and selection
      const updateAwareness = () => {
        if (!editorRef.current) return;
        
        const position = editorRef.current.getPosition();
        const selection = editorRef.current.getSelection();
        
        provider.awareness.setLocalStateField('cursor', {
          lineNumber: position.lineNumber,
          column: position.column
        });

        if (selection && !selection.isEmpty()) {
          provider.awareness.setLocalStateField('selection', {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn
          });
        } else {
          provider.awareness.setLocalStateField('selection', null);
        }
      };

      // Listen for cursor and selection changes using disposables
      const disposables = [];
      disposables.push(editor.onDidChangeCursorPosition(updateAwareness));
      disposables.push(editor.onDidChangeCursorSelection(updateAwareness));
      eventDisposablesRef.current = disposables;

      //syncing the react state with yjs
      const updateCodeFromYjs = () => {
        setCode(yText.toString());
      };
      yText.observe(updateCodeFromYjs);
      //setting the initial code
      setCode(yText.toString());

    } catch (error) {
      console.error('Error setting up Yjs collaboration:', error);
      return;
    }

    //cleaning up when the component unmounts or document/editor changes
    return () => {
      try {
        // Dispose of all event listeners
        eventDisposablesRef.current.forEach(disposable => {
          if (disposable && typeof disposable.dispose === 'function') {
            disposable.dispose();
          }
        });
        eventDisposablesRef.current = [];
        
        if (provider) {
          provider.destroy();
        }
        if (ydoc) {
          ydoc.destroy();
        }
        if (monacoBinding && typeof monacoBinding.destroy === 'function') {
          monacoBinding.destroy();
        }
        yjsProviderRef.current = null;
        awarenessRef.current = null;
      } catch (error) {
        console.error('Error cleaning up Yjs collaboration:', error);
      }
    };
  }, [currentDocument, editorRef.current, user]);

  //now do conditional rendering
  if (!user) {
    return (
      <>
        <TokenRefresh onTokenExpired={handleTokenExpired} />
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    //this is the main container for the app, it takes up the full height and width of the screen
    <div className="app-container">
      {/* Token Refresh Component */}
      <TokenRefresh onTokenExpired={handleTokenExpired} />

      {/* User Header */}
      <div className="user-header">
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      {/* Document List Sidebar */}
      <DocumentList
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
        onShareDocument={handleShareDocument}
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
          {/* Editor Actions */}
          <div className="editor-actions">
            {/*if the current document is not null, show the editor actions*/}
            {currentDocument && (
              <>
                {/*Share button for document sharing*/}
                <button 
                  className="share-btn" 
                  onClick={() => handleShareDocument(currentDocument)}
                  title="Share document"
                >
                  📤 Share
                </button>
                {/*Save button is the button to save the document*/}
                <button className="save-btn" onClick={saveDocument}>
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Monaco Editor with Cursor Overlay */}
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
            //now only updates the local react state
            onChange={(value) => {
              if (value !== undefined) {
                setCode(value);
              }
            }}
            //saves a reference to the monoco editor so yjs can bind to it
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
          
          {/* Cursor Overlay for remote cursors */}
          {editorRef.current && awarenessRef.current && (
            <CursorOverlay
              editor={editorRef.current}
              awareness={awarenessRef.current}
              currentUserId={user.id}
            />
          )}
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <AIAssistant
        currentCode={code}
        language={currentDocument?.language || 'javascript'}
        onInsertCode={handleInsertAISuggestion}
      />

      {/* User Presence Sidebar */}
      {awarenessRef.current && (
        <div className="presence-sidebar">
          <UserPresence
            awareness={awarenessRef.current}
            currentUser={{
              id: user.id,
              username: user.username
            }}
          />
        </div>
      )}

      {/*New Document Modal is the modal to create a new document*/}
      <NewDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* Share Document Modal */}
      <ShareDocumentModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setDocumentToShare(null);
        }}
        documentId={documentToShare?._id || ''}
        documentName={documentToShare?.name || ''}
      />
    </div>
  );
}

//makes component available to use in index.tsx(the entry point)
export default App;
