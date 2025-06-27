import React, { useState, useEffect } from 'react';
import './UserPresence.css';

interface User {
  id: string;
  username: string;
  color: string;
  isTyping?: boolean;
  cursor?: {
    line: number;
    column: number;
  };
}

interface UserPresenceProps {
  awareness: any; // Yjs awareness object
  currentUser: {
    id: string;
    username: string;
  };
}

const UserPresence: React.FC<UserPresenceProps> = ({ awareness, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states = awareness.getStates();
      const userList: User[] = [];

      states.forEach((state: any, clientId: string) => {
        if (state.user && clientId !== awareness.clientID) {
          userList.push({
            id: clientId,
            username: state.user.username,
            color: state.user.color,
            isTyping: state.isTyping,
            cursor: state.cursor
          });
        }
      });

      setUsers(userList);
    };

    // Initial update
    updateUsers();

    // Listen for changes
    awareness.on('change', updateUsers);

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  const getInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

  if (users.length === 0) {
    return (
      <div className="user-presence">
        <div className="presence-header">
          <span>Collaborators</span>
          <span className="user-count">Just you</span>
        </div>
        <div className="presence-list">
          <div className="user-item current-user">
            <div 
              className="user-avatar" 
              style={{ backgroundColor: getRandomColor(currentUser.username) }}
            >
              {getInitials(currentUser.username)}
            </div>
            <div className="user-info">
              <span className="username">{currentUser.username}</span>
              <span className="status">You</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-presence">
      <div className="presence-header">
        <span>Collaborators</span>
        <span className="user-count">{users.length + 1} online</span>
      </div>
      
      <div className="presence-list">
        {/* Current user */}
        <div className="user-item current-user">
          <div 
            className="user-avatar" 
            style={{ backgroundColor: getRandomColor(currentUser.username) }}
          >
            {getInitials(currentUser.username)}
          </div>
          <div className="user-info">
            <span className="username">{currentUser.username}</span>
            <span className="status">You</span>
          </div>
        </div>

        {/* Other users */}
        {users.map((user) => (
          <div key={user.id} className="user-item">
            <div 
              className="user-avatar" 
              style={{ backgroundColor: user.color || getRandomColor(user.username) }}
            >
              {getInitials(user.username)}
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              <span className="status">
                {user.isTyping ? (
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                    typing...
                  </span>
                ) : (
                  'online'
                )}
              </span>
            </div>
            {user.cursor && (
              <div className="cursor-info">
                Line {user.cursor.line}, Col {user.cursor.column}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPresence; 