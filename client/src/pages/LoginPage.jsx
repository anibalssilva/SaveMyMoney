import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">💰</div>
          <h1 className="login-title">SaveMyMoney</h1>
          <p className="login-subtitle">Entre para gerenciar suas finanças</p>
        </div>

        {error && (
          <div className="login-error">
            🚫 {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="login-form">
          <div className="login-input-group">
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Digite seu email"
              className="login-input"
              required
              autoComplete="email"
            />
            <span className="login-input-icon">📧</span>
          </div>

          <div className="login-input-group">
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Digite sua senha"
              className="login-input"
              required
              autoComplete="current-password"
            />
            <span className="login-input-icon">🔒</span>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-loading">
                <span className="login-spinner"></span>
                Entrando...
              </span>
            ) : (
              <>
                Entrar
                <span style={{ marginLeft: '8px' }}>→</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-link">
            Não tem uma conta? <Link to="/register">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
