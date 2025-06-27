//this is the register form component

//importing react and useState
import React, { useState } from 'react';
//importing the api service and the register data type
import { apiService, RegisterData } from '../services/api';

//this is the interface for the register form props
interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

//this is the register form component
const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  //state for form fields
  const [form, setForm] = useState<RegisterData>({ username: '', email: '', password: '' });
  //state for loading and error/success messages
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  //handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    //prevent the default form submission behavior
    e.preventDefault();
    //set loading to true
    setLoading(true);
    //set error to empty string
    setError('');
    //set success to empty string
    setSuccess('');
    try {
      //send the form data to the backend
      await apiService.registerUser(form);
      //set success message
      setSuccess('Registration successful! You can now log in.');
      setForm({ username: '', email: '', password: '' });
      //if onSuccess is defined, call it
      if (onSuccess) onSuccess();
    } catch (err: any) {
      //set error message
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      //set loading to false
      setLoading(false);
    }
  };

  //this is the return statement for the register form component
  return (
    //this is the container for the register form
    <div>
      {/*this is the form for the register component*/}
      <form onSubmit={handleSubmit} className="auth-form">
        {/*this is the username input*/}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
            placeholder="Choose a username"
          />
        </div>
        
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
            autoComplete="new-password"
            placeholder="Create a password"
          />
        </div>
        
        {/*this is the submit button*/}
        <button type="submit" disabled={loading} className="auth-button">
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Registering...
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>
      
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      
      <div className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="auth-link">
          Log in
        </button>
      </div>
    </div>
  );
};

export default RegisterForm; 