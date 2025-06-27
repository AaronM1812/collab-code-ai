//this is the auth page component, it manages which form to show and the logged-in user state, it also handles login and logout, it also handles the user state and the form switching

//importing react and useState
import React, { useState } from 'react';
//importing the login form and the register form
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

//this is the auth page component
const AuthPage: React.FC = () => {
  //state to switch between login and register
  const [showLogin, setShowLogin] = useState(true);
  //state for the logged-in user
  const [user, setUser] = useState(() => {
    //try to load user from localStorage (so user stays logged in on refresh)
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  //handle successful login
  const handleLoginSuccess = (user: any, token: string) => {
    setUser(user);
  };

  //handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  //if user is logged in, show welcome message and logout button
  if (user) {
    return (
      <div className="auth-logged-in">
        <h2>Welcome, {user.username}!</h2>
        <p>Email: {user.email}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  //otherwise, show login or register form
  return (
    <div className="auth-page">
      {showLogin ? (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      ) : (
        <RegisterForm
          onSuccess={() => setShowLogin(true)}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
};

export default AuthPage; 