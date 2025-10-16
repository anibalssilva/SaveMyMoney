import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt
    const dismissed = localStorage.getItem('pwaPromptDismissed');

    if (!dismissed && isInstallable && !isInstalled) {
      // Show prompt after 30 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const result = await promptInstall();

    if (result) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (!isVisible || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <button
          onClick={handleDismiss}
          className="install-prompt-close"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="install-prompt-icon">📱</div>

        <div className="install-prompt-text">
          <h3>Instalar SaveMyMoney</h3>
          <p>Adicione o app à tela inicial para acesso rápido e offline!</p>
        </div>

        <div className="install-prompt-buttons">
          <button
            onClick={handleInstall}
            className="install-prompt-btn install-prompt-btn-primary"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="install-prompt-btn install-prompt-btn-secondary"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
