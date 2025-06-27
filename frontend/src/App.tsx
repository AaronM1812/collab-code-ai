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
//importing the api service to handle the api requests
import { Document, apiService } from './services/api';
//importing the css file for the app
import './App.css';

//importing yjs and the websocket provider for real-time collaboration instead of socket.io
import * as Y from 'yjs';
//websocket connects app to the Yjs websocket server
import { WebsocketProvider } from 'y-websocket';
//monaco binding to sunc the editor with yjs for real time code collab
import { MonacoBinding } from 'y-monaco';

//main app components which will return the UI that will be shown in the browser
function App() {
  //state to store the current document
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  //state to store the current code
  const [code, setCode] = useState('// Start coding here!');
  //state to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  //state to control AI assistant modal visibility
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  //ref to control the editor
  const editorRef = useRef<any>(null);
  //socket reference (so it persists across renders, through use ref)
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend socket.io server (keep for presence/chat if needed)
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      console.log('Connected to backend with socket id:', socketRef.current?.id);
    });

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
    if (!currentDocument || !editorRef.current) return;

    //creating a new yjs document, datastructre for collaboration
    const ydoc = new Y.Doc();

    //connecting to the yjs websocket server, using the document id as the room name
    const provider = new WebsocketProvider('ws://localhost:1234', currentDocument._id, ydoc);

    //getting a shared text type for the code
    const yText = ydoc.getText('monaco');

    //binding the monaco editor to yjs
    const monacoBinding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    //syncing the react state with yjs
    const updateCodeFromYjs = () => {
      setCode(yText.toString());
    };
    yText.observe(updateCodeFromYjs);
    //setting the initial code
    setCode(yText.toString());

    //cleaning up when the component unmounts or document/editor changes
    return () => {
      yText.unobserve(updateCodeFromYjs);
      provider.destroy();
      ydoc.destroy();
    };
  }, [currentDocument, editorRef.current]);

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
          {/* Editor Actions */}
          <div className="editor-actions">
            {/*if the current document is not null, show the editor actions*/}
            {currentDocument && (
              <>
                {/*AI button is the button to open the AI assistant*/}
                <button 
                  //className is the class of the button
                  className="ai-btn" 
                  //onClick is the function to handle the click of the button
                  onClick={() => setIsAIAssistantOpen(true)}
                  //title is the title of the button
                  title="Ask AI for help with your code"
                >
                  🤖 Ask AI
                </button>
                {/*Save button is the button to save the document*/}
                <button className="save-btn" onClick={saveDocument}>
                  Save
                </button>
              </>
            )}
          </div>
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
        </div>
      </div>


      {/*New Document Modal is the modal to create a new document*/}
      <NewDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDocumentCreated={handleDocumentCreated}
      />

      {/* AI Assistant Modal is the modal to open the AI assistant*/}
      {/*this part handles the ai modal using the seperate ai assitant.tsx, it is used throughout the app.tsx*/}
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        code={code}
        onInsertSuggestion={handleInsertAISuggestion}
      />
    </div>
  );
}

//makes component available to use in index.tsx(the entry point)
export default App;
