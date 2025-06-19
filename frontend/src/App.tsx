//this is the main file for the app, like the homepage

//importing react so we can use JSX(HTML like code in javascript)
import React, { useState } from 'react';
//importing the monocoeditor which is used in the app
import MonacoEditor from '@monaco-editor/react';
//importing axios to make http requests to backend from the react app
import axios from 'axios';

//main app components which will return the UI that will be shown in the browser
function App() {
  //state to store backend response, keeps track of backendMessage, intial value is an empty string, so basically backend is a special variable, when setBackendMessage is called, it updates the value of backendMessage which shows in the UI, so in the basic example only p will change
  const [backendMessage, setBackendMessage] = useState('');
  //state to store document name
  const [docName, setDocName] = useState('');

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
      //clear the input field
      setDocName('');
      //if an error occurs update state with error message
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
      {/*the editor component which takes up 80vh of the screen vertically and set js to the default lan for syntax highlighting, and default text, and theme set to dark*/}
      <MonacoEditor
        height="80vh"
        defaultLanguage="javascript"
        defaultValue="// Start coding here!"
        theme="vs-dark"
      />
    </div>
  );
}

//makes component available to use in index.tsx(the entry point)
export default App;
