//this is the login form component

//importing react and useState
import React, { useState } from 'react';
//importing the api service and the login data type
import { apiService, LoginData, AuthResponse } from '../services/api';

//this is the interface for the login form props
interface LoginFormProps {
  onLoginSuccess?: (user: AuthResponse['user'], accessToken: string) => void;
  onSwitchToRegister?: () => void;
}

//this is the login form component
const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  //state for form fields
  const [form, setForm] = useState<LoginData>({ email: '', password: '' });
  //state for loading and error/success messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  //handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    //prevent the default form submission behavior
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      //send the form data to the backend
      const response = await apiService.loginUser(form);
      //store the jwt and user info in localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      if (onLoginSuccess) onLoginSuccess(response.user, response.accessToken);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  //this is the return statement for the login form component
  return (
    //this is the container for the login form
    <div>
      <form onSubmit={handleSubmit} className="auth-form">
        {/*this is the email input*/}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
        </div>
        
        {/*this is the password input*/}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>
        
        {/*this is the submit button*/}
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>
      
      {error && <div className="auth-error">{error}</div>}
      
      <div className="auth-switch">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="auth-link">
          Register
        </button>
      </div>
    </div>
  );
};

export default LoginForm; 