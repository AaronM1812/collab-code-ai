//this is the AI assistant component, it is used to get suggestions from the AI

//importing react and useState, useState is used to manage the state of the component
import React, { useState, useRef, useEffect } from 'react';
//importing the api service and the AISuggestionRequest interface
import { apiService, AISuggestionRequest } from '../services/api';
//importing the css file for the AI assistant
import './AIAssistant.css';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  codeContext?: string;
}

interface AIAssistantProps {
  currentCode: string;
  language: string;
  onInsertCode: (code: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentCode, language, onInsertCode }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI pair programmer. I can help you with code suggestions, explanations, debugging, and more. What would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      codeContext: currentCode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          prompt: inputValue,
          code: currentCode,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.suggestion,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertCode = (code: string) => {
    onInsertCode(code);
  };

  const quickPrompts = [
    'Explain this code',
    'Find bugs in this code',
    'Optimize this code',
    'Add comments',
    'Refactor this code',
    'Suggest improvements'
  ];

  return (
    <div className={`ai-assistant ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="ai-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="ai-header-content">
          <div className="ai-icon">🤖</div>
          <span className="ai-title">AI Assistant</span>
        </div>
        <button className="collapse-btn">
          {isCollapsed ? '◀' : '▶'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="ai-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.content}
                  {message.type === 'ai' && message.content.includes('```') && (
                    <div className="message-actions">
                      <button 
                        className="insert-btn"
                        onClick={() => {
                          const codeMatch = message.content.match(/```[\s\S]*?```/);
                          if (codeMatch) {
                            const code = codeMatch[0].replace(/```/g, '');
                            handleInsertCode(code);
                          }
                        }}
                      >
                        Insert Code
                      </button>
                    </div>
                  )}
                </div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-prompts">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                className="quick-prompt-btn"
                onClick={() => setInputValue(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="ai-input">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your code..."
              disabled={isLoading}
              rows={2}
            />
            <button 
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant; 