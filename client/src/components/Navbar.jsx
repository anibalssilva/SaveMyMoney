import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo-section" onClick={closeMobileMenu}>
          <span className="navbar-logo-icon">💰</span>
          <span className="navbar-logo-text">SaveMyMoney</span>
        </Link>

        {/* Desktop Navigation */}
        {token ? (
          <>
            <ul className="navbar-nav">
              <li className="navbar-nav-item">
                <Link to="/dashboard" className={`navbar-nav-link ${isActive('/dashboard')}`}>
                  📊 Dashboard
                </Link>
              </li>
              <li className="navbar-nav-item">
                <Link to="/financial-dashboard" className={`navbar-nav-link ${isActive('/financial-dashboard')}`}>
                  📈 Gráficos
                </Link>
              </li>
              <li className="navbar-nav-item">
                <Link to="/transactions" className={`navbar-nav-link ${isActive('/transactions')}`}>
                  💸 Transações
                </Link>
              </li>
              <li className="navbar-nav-item">
                <Link to="/ocr" className={`navbar-nav-link ${isActive('/ocr')}`}>
                  📸 Scanner
                </Link>
              </li>
              <li className="navbar-nav-item">
                <Link to="/portfolio" className={`navbar-nav-link ${isActive('/portfolio')}`}>
                  💼 Portfólio
                </Link>
              </li>
              <li className="navbar-nav-item">
                <Link to="/predictions" className={`navbar-nav-link ${isActive('/predictions')}`}>
                  🔮 Previsões
                </Link>
              </li>
              <li className="navbar-nav-item">
                <Link to="/investments" className={`navbar-nav-link ${isActive('/investments')}`}>
                  💎 Investimentos
                </Link>
              </li>
              <li className="navbar-nav-item">
                <a
                  href={import.meta.env.VITE_STREAMLIT_URL || 'http://localhost:8501'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="navbar-nav-link"
                  title="Abre em nova aba"
                >
                  📊 Gráficos Dinâmicos
                </a>
              </li>
            </ul>

            <div className="navbar-actions">
              <ThemeToggle />
              <button onClick={handleLogout} className="navbar-btn navbar-btn-logout">
                🚪 Sair
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="navbar-nav">
              {/* Empty for unauthenticated users */}
            </ul>

            <div className="navbar-actions">
              <ThemeToggle />
              <Link to="/login" className="navbar-btn">
                🔐 Entrar
              </Link>
              <Link to="/register" className="navbar-btn navbar-btn-primary">
                ✨ Cadastrar
              </Link>
            </div>
          </>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="navbar-mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu open">
          {token ? (
            <>
              <ul className="navbar-mobile-nav">
                <li>
                  <Link to="/dashboard" className="navbar-nav-link" onClick={closeMobileMenu}>
                    📊 Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/financial-dashboard" className="navbar-nav-link" onClick={closeMobileMenu}>
                    📈 Gráficos
                  </Link>
                </li>
                <li>
                  <Link to="/transactions" className="navbar-nav-link" onClick={closeMobileMenu}>
                    💸 Transações
                  </Link>
                </li>
                <li>
                  <Link to="/ocr" className="navbar-nav-link" onClick={closeMobileMenu}>
                    📸 Scanner
                  </Link>
                </li>
                <li>
                  <Link to="/portfolio" className="navbar-nav-link" onClick={closeMobileMenu}>
                    💼 Portfólio
                  </Link>
                </li>
                <li>
                  <Link to="/predictions" className="navbar-nav-link" onClick={closeMobileMenu}>
                    🔮 Previsões
                  </Link>
                </li>
                <li>
                  <Link to="/investments" className="navbar-nav-link" onClick={closeMobileMenu}>
                    💎 Investimentos
                  </Link>
                </li>
                <li>
                  <a
                    href={import.meta.env.VITE_STREAMLIT_URL || 'http://localhost:8501'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="navbar-nav-link"
                    onClick={closeMobileMenu}
                  >
                    📊 Gráficos Dinâmicos
                  </a>
                </li>
              </ul>

              <div className="navbar-mobile-actions">
                <button onClick={handleLogout} className="navbar-btn navbar-btn-logout">
                  🚪 Sair
                </button>
              </div>
            </>
          ) : (
            <div className="navbar-mobile-actions">
              <Link to="/login" className="navbar-btn" onClick={closeMobileMenu}>
                🔐 Entrar
              </Link>
              <Link to="/register" className="navbar-btn navbar-btn-primary" onClick={closeMobileMenu}>
                ✨ Cadastrar
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
