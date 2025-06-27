//this is the auth page component, it manages which form to show and the logged-in user state, it also handles login and logout, it also handles the user state and the form switching

//importing react and useState
import React, { useState } from 'react';
//importing the login form and the register form
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

//this is the interface for the auth page props
interface AuthPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

//this is the auth page component
const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  //state to switch between login and register
  const [showLogin, setShowLogin] = useState(true);

  //otherwise, show login or register form
  return (
    <div className="auth-page">
      {showLogin ? (
        <LoginForm
          onLoginSuccess={onLoginSuccess}
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