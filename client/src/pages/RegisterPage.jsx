import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { name, email, password, password2 } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register({ name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.errors[0]?.msg || 'Failed to register. User may already exist.');
      console.error(err);
    }
  };

  return (
    <div className="form-container">
      <h1>Sign Up</h1>
      <p>Create your account to start saving.</p>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="Name"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="Email Address"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            placeholder="Password (min. 6 characters)"
            minLength="6"
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            name="password2"
            value={password2}
            onChange={onChange}
            placeholder="Confirm Password"
            minLength="6"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
      <p className="form-link">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
