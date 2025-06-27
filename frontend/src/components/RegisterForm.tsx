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
    <div className="auth-form-container">
      <h2>Register</h2>
      {/*this is the form for the register component*/}
      <form onSubmit={handleSubmit} className="auth-form">
        {/*this is the username input*/}
        <label>
          {/*this is the username input*/}
          Username
          {/*this is the input for the username*/}
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />
        </label>
        {/*this is the email input*/}
        <label>
          {/*this is the email input*/}
          Email
          {/*this is the input for the email*/}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </label>
        {/*this is the password input*/}
        <label>
          {/*this is the password input*/}
          Password
          {/*this is the input for the password*/}
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </label>
        {/*this is the submit button*/}
        <button type="submit" disabled={loading}>
          {/*this is the text for the submit button*/}
          {loading ? 'Registering...' : 'Register'}
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