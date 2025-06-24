//this is the AI assistant component, it is used to get suggestions from the AI

//importing react and useState, useState is used to manage the state of the component
import React, { useState } from 'react';
//importing the api service and the AISuggestionRequest interface
import { apiService, AISuggestionRequest } from '../services/api';
//importing the css file for the AI assistant
import './AIAssistant.css';

//this is the interface for the AI assistant props
interface AIAssistantProps {
  //controls if the modal is visible
  isOpen: boolean;
  //closes the modal
  onClose: () => void;
  //current code in the editor
  code: string;
  //optional function to insert the suggestion into the editor
  onInsertSuggestion?: (suggestion: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  isOpen, 
  onClose, 
  code, 
  onInsertSuggestion 
}) => {
  //state variables for user prompt, ai suggestion, loading state, and error message
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState('');
  //loading state is used to show a loading spinner
  const [loading, setLoading] = useState(false);
  //error state is used to show an error message
  const [error, setError] = useState('');

  //this is the function to handle the submission of the user prompt
  const handleSubmit = async (e: React.FormEvent) => {
    //prevent the default form submission behavior
    e.preventDefault();
    //if the prompt is empty, return
    if (!prompt.trim()) return;
    //set the loading state to true
    setLoading(true);
    //set the error state to empty
    setError('');
    //set the suggestion state to empty
    setSuggestion('');

    try {
      //create a new request object with the code and prompt
      const request: AISuggestionRequest = {
        //code is the current code in the editor
        code,
        //prompt is the user prompt
        prompt: prompt.trim()
      };

      //call the api service to get the AI suggestion
      const response = await apiService.getAISuggestion(request);
      //set the suggestion state to the AI's response
      setSuggestion(response.suggestion);
      //if the response is not successful, set the error state to a message
    } catch (err) {
      //if the response is not successful, set the error state to a message
      setError('Failed to get AI suggestion. Please try again.');
      //log the error
      console.error('AI suggestion error:', err);
    } finally {
      //set the loading state to fals
      setLoading(false);
    }
  };

  //this is the function to handle the insertion of the AI suggestion into the editor
  const handleInsertSuggestion = () => {
    //if the suggestion is not empty and the onInsertSuggestion function is defined
    if (suggestion && onInsertSuggestion) {
      //call the onInsertSuggestion function with the suggestion
      onInsertSuggestion(suggestion);
      //close the modal
      onClose();
    }
  };

  //this is the function to handle the closing of the modal
  const handleClose = () => {
    //set the prompt state to empty
    setPrompt('');
    //set the suggestion state to empty
    setSuggestion('');
    //set the error state to empty
    setError('');
    //close the modal
    onClose();
  };

  //if the modal is not open, return null
  if (!isOpen) return null;

  //return the modal
  return (
    //overlay is the background of the modal
    <div className="ai-assistant-overlay" onClick={handleClose}>
      {/*modal is the main container of the modal*/}
      <div className="ai-assistant-modal" onClick={(e) => e.stopPropagation()}>
        {/*header is the top of the modal*/}
        <div className="ai-assistant-header">
          {/*title of the modal*/}
          <h3>AI Code Assistant</h3>
          {/*close button is the button to close the modal*/}
          <button className="ai-assistant-close" onClick={handleClose}>
            {/*x is the close button*/}
            ×
          </button>
        </div>

        {/*form is the form to submit the user prompt*/}
        <form onSubmit={handleSubmit} className="ai-assistant-form">
          {/*input group is the group of input fields*/}
          <div className="ai-assistant-input-group">
            {/*label is the label for the input field*/}
            <label htmlFor="prompt">Ask AI about your code:</label>
            {/*textarea is the input field for the user prompt*/}
            <textarea
              //id is the id of the input field
              id="prompt"
              //value is the value of the input field
              value={prompt}
              //onChange is the function to handle the change of the input field
              onChange={(e) => setPrompt(e.target.value)}
              //placeholder is the placeholder text for the input field
              placeholder="e.g., 'Suggest improvements', 'Explain this code', 'Fix this bug'"
              //rows is the number of rows in the textarea
              rows={3}
              //disabled is the state of the input field
              disabled={loading}
            />
          </div>

          {/*submit button is the button to submit the user prompt*/}
          <button 
            //type is the type of the button
            type="submit" 
            //className is the class of the button
            className="ai-assistant-submit"
            //disabled is the state of the button
            disabled={loading || !prompt.trim()}
          >
            {/*if the loading state is true, show 'Getting suggestion...'*/}
            {loading ? 'Getting suggestion...' : 'Ask AI'}
          </button>
        </form>

        {/*if the error state is not empty, show the error message*/}
        {error && (
          //error message is the error message to show
          <div className="ai-assistant-error">
            {/*error message is the error message to show*/}
            {error}
          </div>
        )}

        {/*if the suggestion state is not empty, show the suggestion*/}
        {suggestion && (
          //suggestion is the suggestion to show
          <div className="ai-assistant-response">
            {/*AI Suggestion is the title of the suggestion*/}
            <h4>AI Suggestion:</h4>
            {/*ai-assistant-suggestion is the container for the suggestion*/}
            <div className="ai-assistant-suggestion">
              <pre>{suggestion}</pre>
            </div>
            {/*if the onInsertSuggestion function is defined, show the insert button*/}
            {onInsertSuggestion && (
              //insert button is the button to insert the suggestion into the editor
              <button 
                //onClick is the function to handle the click of the button
                onClick={handleInsertSuggestion}
                //className is the class of the button
                className="ai-assistant-insert"
              >
                {/*insert into editor is the text of the button*/}
                Insert into Editor
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant; 