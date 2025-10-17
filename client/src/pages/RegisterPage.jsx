import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', password2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, password2 } = formData;

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 'none', text: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { level: 'weak', text: 'Fraca' };
    if (strength <= 3) return { level: 'medium', text: 'Média' };
    return { level: 'strong', text: 'Forte' };
  }, [password]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password });
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.message
        || 'Falha no cadastro. O usuário pode já existir.';
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="register-logo">🚀</div>
          <h1 className="register-title">Criar Conta</h1>
          <p className="register-subtitle">Comece a economizar hoje mesmo</p>
        </div>

        {error && (
          <div className="register-error">
            🚫 {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="register-form">
          <div className="register-input-group">
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Digite seu nome completo"
              className="register-input"
              required
              autoComplete="name"
            />
            <span className="register-input-icon">👤</span>
          </div>

          <div className="register-input-group">
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Digite seu melhor email"
              className="register-input"
              required
              autoComplete="email"
            />
            <span className="register-input-icon">📧</span>
          </div>

          <div className="register-input-group">
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Crie uma senha forte (mín. 6 caracteres)"
              className="register-input"
              minLength="6"
              required
              autoComplete="new-password"
            />
            <span className="register-input-icon">🔒</span>
            {password && (
              <div className={`password-strength strength-${passwordStrength.level}`}>
                <div className="strength-bar">
                  <div className="strength-fill"></div>
                </div>
                <span className="strength-text">{passwordStrength.text}</span>
              </div>
            )}
          </div>

          <div className="register-input-group">
            <input
              type="password"
              name="password2"
              value={password2}
              onChange={onChange}
              placeholder="Confirme sua senha"
              className="register-input"
              minLength="6"
              required
              autoComplete="new-password"
            />
            <span className="register-input-icon">✅</span>
          </div>

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="register-loading">
                <span className="register-spinner"></span>
                Criando conta...
              </span>
            ) : (
              <>
                Cadastrar
                <span style={{ marginLeft: '8px' }}>✨</span>
              </>
            )}
          </button>
        </form>

        <div className="register-footer">
          <p className="register-link">
            Já tem uma conta? <Link to="/login">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
