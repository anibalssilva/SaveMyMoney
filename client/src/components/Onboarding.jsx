import React, { useState, useEffect } from 'react';
import './Onboarding.css';

const ONBOARDING_STEPS = [
  {
    title: 'Bem-vindo ao SaveMyMoney!',
    description: 'Sua ferramenta completa de gestão financeira pessoal com recursos avançados de IA.',
    icon: '💰',
    features: [
      'Acompanhamento de receitas e despesas',
      'Alertas inteligentes de orçamento',
      'Previsões com Machine Learning',
      'Sugestões personalizadas de investimentos'
    ]
  },
  {
    title: 'Dashboard Inteligente',
    description: 'Visualize todas as suas finanças em um só lugar.',
    icon: '📊',
    features: [
      'Gráficos interativos',
      'Resumo de receitas e despesas',
      'Alertas de orçamento em tempo real',
      'Score de saúde financeira'
    ],
    link: '/dashboard'
  },
  {
    title: 'Adicione Transações',
    description: 'Registre suas receitas e despesas de várias formas.',
    icon: '📝',
    features: [
      'Cadastro manual rápido',
      'Upload de cupons fiscais (OCR)',
      'Importação de extratos PDF',
      'Exportação para Excel/CSV'
    ],
    link: '/transactions'
  },
  {
    title: 'Alertas de Orçamento',
    description: 'Receba avisos quando seus gastos ultrapassarem limites.',
    icon: '🔔',
    features: [
      'Configure limites por categoria',
      'Alertas automáticos (80% do limite)',
      'Visualização de progresso',
      'Períodos customizáveis'
    ],
    link: '/budgets'
  },
  {
    title: 'Previsões com IA',
    description: 'Veja o futuro das suas finanças com Machine Learning.',
    icon: '🤖',
    features: [
      'Dois modelos de IA (Linear + LSTM)',
      'Previsões de 1 a 90 dias',
      'Análise por categoria',
      'Intervalos de confiança'
    ],
    link: '/predictions'
  },
  {
    title: 'Investimentos',
    description: 'Receba sugestões personalizadas baseadas no seu perfil.',
    icon: '💼',
    features: [
      '8 tipos de produtos financeiros',
      'Quiz de perfil de investidor',
      'Score de saúde financeira',
      'Recomendações inteligentes'
    ],
    link: '/investments'
  },
  {
    title: 'Pronto para começar!',
    description: 'Explore todos os recursos e tenha controle total das suas finanças.',
    icon: '🚀',
    features: [
      'Comece adicionando suas transações',
      'Configure seus orçamentos',
      'Complete o quiz de investidor',
      'Explore o dashboard'
    ]
  }
];

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);

    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Progress bar */}
        <div className="onboarding-progress">
          <div
            className="onboarding-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <div className="onboarding-icon">{step.icon}</div>

          <h2 className="onboarding-title">{step.title}</h2>

          <p className="onboarding-description">{step.description}</p>

          <ul className="onboarding-features">
            {step.features.map((feature, index) => (
              <li key={index}>
                <span className="feature-checkmark">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Navigation */}
        <div className="onboarding-navigation">
          <button
            onClick={handleSkip}
            className="onboarding-btn onboarding-btn-skip"
          >
            Pular
          </button>

          <div className="onboarding-dots">
            {ONBOARDING_STEPS.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <div className="onboarding-buttons">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="onboarding-btn onboarding-btn-secondary"
              >
                Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="onboarding-btn onboarding-btn-primary"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Começar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
