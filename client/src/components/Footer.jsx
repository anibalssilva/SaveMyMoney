import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-logo">SaveMyMoney</h3>
          <p className="footer-tagline">
            Gestão financeira inteligente com tecnologia de ponta
          </p>
          <div className="footer-stats">
            <div className="stat-item">
              <span className="stat-icon">🔒</span>
              <span className="stat-text">100% Seguro</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🤖</span>
              <span className="stat-text">IA Integrada</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">📊</span>
              <span className="stat-text">Análises Detalhadas</span>
            </div>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Recursos</h4>
          <ul className="footer-links">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/transactions">Transações</Link></li>
            <li><Link to="/budgets">Orçamentos</Link></li>
            <li><Link to="/predictions">Previsões IA</Link></li>
            <li><Link to="/investments">Investimentos</Link></li>
            <li><Link to="/portfolio">Portfólio</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Ferramentas</h4>
          <ul className="footer-links">
            <li><Link to="/ocr">Scanner de Recibos</Link></li>
            <li><Link to="/upload-statement">Upload de Extrato</Link></li>
            <li><Link to="/alerts">Alertas Financeiros</Link></li>
            <li><a href="/api/health" target="_blank" rel="noopener noreferrer">Status da API</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Suporte</h4>
          <ul className="footer-links">
            <li><a href="https://github.com/seu-usuario/SaveMyMoney" target="_blank" rel="noopener noreferrer">Documentação</a></li>
            <li><a href="https://github.com/seu-usuario/SaveMyMoney/issues" target="_blank" rel="noopener noreferrer">Reportar Problema</a></li>
            <li><a href="mailto:support@savemymoney.com">Contato</a></li>
            <li><a href="/privacy">Privacidade</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Conecte-se</h4>
          <div className="footer-social">
            <a href="https://github.com/seu-usuario/SaveMyMoney" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="https://twitter.com/savemymoney" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/savemymoney" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
          <div className="footer-badges">
            <div className="badge">
              <span className="badge-icon">🛡️</span>
              <div className="badge-text">
                <small>Segurança</small>
                <strong>SSL/TLS</strong>
              </div>
            </div>
            <div className="badge">
              <span className="badge-icon">⚡</span>
              <div className="badge-text">
                <small>Performance</small>
                <strong>95+ Score</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="footer-copyright">
            © {currentYear} SaveMyMoney. Todos os direitos reservados.
          </p>
          <div className="footer-tech">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">MongoDB</span>
            <span className="tech-badge">TensorFlow</span>
            <span className="tech-badge">Docker</span>
          </div>
          <p className="footer-made-with">
            Feito com <span className="heart">❤️</span> para ajudar você a economizar
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
