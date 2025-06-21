//this is the main file for the app, like the homepage

//importing react, used for UI in js, use effect for running code when component loads/updates, use ref to keep a value, doesnt change when component re-renders, use ref to store socket connection
import React, { useState, useEffect, useRef } from 'react';
//importing the monocoeditor which is used in the app
import MonacoEditor from '@monaco-editor/react';
//importing axios to make http requests to backend from the react app
import axios from 'axios';
//importing socket.io-client to connect to the backend socket.io server
import { io, Socket } from 'socket.io-client';

//main app components which will return the UI that will be shown in the browser
function App() {
  //state to store backend response, keeps track of backendMessage, intial value is an empty string, so basically backend is a special variable, when setBackendMessage is called, it updates the value of backendMessage which shows in the UI, so in the basic example only p will change
  const [backendMessage, setBackendMessage] = useState('');
  //state to store document name
  const [docName, setDocName] = useState('');
  //state to store the current code
  const [code, setCode] = useState('// Start coding here!');
  //ref to control the editor
  const editorRef = useRef<any>(null);

  //socket reference (so it persists across renders, throough use ref)
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend socket.io server
    socketRef.current = io('http://localhost:3001');

    // When connected, log a message
    socketRef.current.on('connect', () => {
      console.log('Connected to backend with socket id:', socketRef.current?.id);
      
      //join the test document room automatically
      if (socketRef.current) {
        socketRef.current.emit('join-document', 'test-document');
        console.log('Sent join-document request for: test-document');
      }
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

  //this function will send GET request to the backend when called
  const callBackend = async () => {
    try {
      //send GET request to backend
      const response = await axios.get('http://localhost:3001/');
      //update state with backend message
      setBackendMessage(response.data);
    } catch (error) {
      //if an error occurs, update state with error message
      setBackendMessage('Error connecting to backend');
    }
  };

  //function to handle document creation
  const handleCreateDocument = async () => {
    //if no document name, then an error message is displayed
    if (!docName.trim()) {
      setBackendMessage('Please enter a document name');
      return;
    }
    //try to send POST request to backend to create document
    try {
      const response = await axios.post('http://localhost:3001/documents', {
        name: docName
      });
      //update state with success message from backend
      setBackendMessage(response.data.message);
      //checkign if a connection exists
      if (socketRef.current) {
        //if so sned a request to join document room to the backend, where doc name is the room name
        socketRef.current.emit('join-document', docName);
        //log this message into the browsers console
        console.log('Joined document room:', docName);
      }
      setDocName('');
    } catch (error) {
      setBackendMessage('Error creating document');
    }
  };

  return (
    //this is the main container for the app, it takes up the full height and width of the screen
    <div style={{ height: '100vh', width: '100vw' }}>
      {/*title for the app*/}
      <h1>Collab Code AI</h1>
      {/*input field to get document name*/}
      <input
        type="text"
        placeholder="Document name"
        value={docName}
        onChange={e => setDocName(e.target.value)}
      />
      {/*button to create document*/}
      <button onClick={handleCreateDocument}>Create Document</button>
      {/*button to call the backend function*/}
      <button onClick={callBackend}>Call Backend</button>
      {/*where the backend message will be displayed*/}
      <p>{backendMessage}</p>
      {/*the editor component which takes up 80vh of the screen vertically and set js to the default lan for syntax highlighting, and text is the code, and theme set to dark*/}
      <MonacoEditor
        height="70vh"
        defaultLanguage="javascript"
        value={code}
        theme="vs-dark"
        onChange={(value) => {
          if (value !== undefined) {
            setCode(value);
            // Send code changes to backend for real-time sync
            if (socketRef.current) {
              socketRef.current.emit('code-change', {
                documentId: 'test-document',
                code: value
              });
            }
          }
        }}
      />
    </div>
  );
}

//makes component available to use in index.tsx(the entry point)
export default App;
