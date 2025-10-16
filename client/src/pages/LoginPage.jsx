import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Response:', err.response);

      // Get error message from server or use default
      const errorMessage = err.response?.data?.error
        || err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Email ou senha incorretos. Verifique suas credenciais.';

      setError(errorMessage);
    }
  };

  return (
    <div className="form-container">
      <h1>Login</h1>
      <p>Get back to managing your money.</p>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={onSubmit}>
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
            placeholder="Password"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
      <p className="form-link">
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginPage;
