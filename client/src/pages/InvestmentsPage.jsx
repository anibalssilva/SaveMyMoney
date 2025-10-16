import React, { useState, useEffect } from 'react';
import api from '../services/api';
import InvestmentCard from '../components/InvestmentCard';
import Toast from '../components/Toast';
import './InvestmentsPage.css';

const InvestmentsPage = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [toast, setToast] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const quizQuestions = [
    {
      id: 'age',
      type: 'number',
      question: 'Qual sua idade?',
      min: 18,
      max: 100,
    },
    {
      id: 'monthlyIncome',
      type: 'number',
      question: 'Qual sua renda mensal aproximada? (R$)',
      min: 0,
    },
    {
      id: 'investmentExperience',
      type: 'select',
      question: 'Qual sua experiência com investimentos?',
      options: [
        { value: 'beginner', label: 'Iniciante - Nunca investi' },
        { value: 'intermediate', label: 'Intermediário - Já invisto há algum tempo' },
        { value: 'advanced', label: 'Avançado - Tenho experiência significativa' },
      ],
    },
    {
      id: 'riskProfile',
      type: 'select',
      question: 'Como você se sente em relação a riscos nos investimentos?',
      options: [
        { value: 'conservative', label: 'Prefiro segurança, mesmo com rentabilidade menor' },
        { value: 'moderate', label: 'Aceito algum risco para obter melhores retornos' },
        { value: 'aggressive', label: 'Aceito riscos maiores em busca de rentabilidade alta' },
      ],
    },
    {
      id: 'hasEmergencyFund',
      type: 'boolean',
      question: 'Você já possui uma reserva de emergência?',
    },
    {
      id: 'emergencyFundAmount',
      type: 'number',
      question: 'Se sim, qual o valor da sua reserva? (R$)',
      conditional: 'hasEmergencyFund',
      min: 0,
    },
  ];

  useEffect(() => {
    fetchProfile();
    fetchAnalysis();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/investments/profile');
      setProfile(res.data);

      if (!res.data.riskProfile || !res.data.age) {
        setShowQuiz(true);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/investments/analysis');
      setAnalysis(res.data);
    } catch (err) {
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/investments/suggestions');
      setSuggestions(res.data.suggestions);
      setToast({
        message: 'Sugestões geradas com sucesso!',
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setToast({
        message: 'Erro ao gerar sugestões',
        type: 'error',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuizNext = () => {
    const currentQuestion = quizQuestions[currentStep];

    if (currentQuestion.conditional && !quizData[currentQuestion.conditional]) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitQuiz();
    }
  };

  const handleQuizBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      await api.post('/investments/profile', quizData);
      setShowQuiz(false);
      setCurrentStep(0);
      setQuizData({});
      await fetchProfile();
      await fetchAnalysis();
      await fetchSuggestions();
      setToast({
        message: 'Perfil salvo! Gerando sugestões personalizadas...',
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      setToast({
        message: 'Erro ao salvar perfil',
        type: 'error',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskProfileText = (risk) => {
    const texts = {
      conservative: 'Conservador',
      moderate: 'Moderado',
      aggressive: 'Arrojado',
    };
    return texts[risk] || risk;
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#48bb78';
    if (score >= 60) return '#4299e1';
    if (score >= 40) return '#ed8936';
    return '#f56565';
  };

  const currentQuestion = quizQuestions[currentStep];

  return (
    <div className="investments-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {showQuiz && (
        <div className="quiz-modal">
          <div className="quiz-container">
            <div className="quiz-header">
              <h2>Descubra seu Perfil de Investidor</h2>
              <p>Responda as perguntas para receber sugestões personalizadas</p>
              <div className="quiz-progress">
                <div
                  className="quiz-progress-bar"
                  style={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>
              <span className="quiz-step">
                Pergunta {currentStep + 1} de {quizQuestions.length}
              </span>
            </div>

            <div className="quiz-body">
              <h3>{currentQuestion.question}</h3>

              {currentQuestion.type === 'number' && (
                <input
                  type="number"
                  value={quizData[currentQuestion.id] || ''}
                  onChange={(e) => setQuizData({ ...quizData, [currentQuestion.id]: parseFloat(e.target.value) })}
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  className="quiz-input"
                  placeholder="Digite o valor"
                />
              )}

              {currentQuestion.type === 'select' && (
                <div className="quiz-options">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      className={`quiz-option ${quizData[currentQuestion.id] === option.value ? 'selected' : ''}`}
                      onClick={() => setQuizData({ ...quizData, [currentQuestion.id]: option.value })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'boolean' && (
                <div className="quiz-options">
                  <button
                    className={`quiz-option ${quizData[currentQuestion.id] === true ? 'selected' : ''}`}
                    onClick={() => setQuizData({ ...quizData, [currentQuestion.id]: true })}
                  >
                    Sim
                  </button>
                  <button
                    className={`quiz-option ${quizData[currentQuestion.id] === false ? 'selected' : ''}`}
                    onClick={() => setQuizData({ ...quizData, [currentQuestion.id]: false })}
                  >
                    Não
                  </button>
                </div>
              )}
            </div>

            <div className="quiz-footer">
              {currentStep > 0 && (
                <button className="btn-secondary" onClick={handleQuizBack}>
                  Voltar
                </button>
              )}
              <button
                className="btn-primary"
                onClick={handleQuizNext}
                disabled={quizData[currentQuestion.id] === undefined && !currentQuestion.conditional}
              >
                {currentStep === quizQuestions.length - 1 ? 'Finalizar' : 'Próxima'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="investments-header">
        <h1>Sugestões de Investimentos</h1>
        <p className="subtitle">
          Recomendações personalizadas baseadas no seu perfil e situação financeira
        </p>
      </div>

      {profile && analysis && (
        <div className="dashboard-summary">
          <div className="summary-card">
            <div className="card-icon">👤</div>
            <div className="card-content">
              <h3>Seu Perfil</h3>
              <p className="card-value">{getRiskProfileText(profile.riskProfile)}</p>
              <button className="btn-edit" onClick={() => setShowQuiz(true)}>
                Editar Perfil
              </button>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Capacidade de Poupança</h3>
              <p className="card-value">R$ {analysis.financialHealth.savingsCapacity.toFixed(2)}/mês</p>
              <p className="card-detail">{analysis.financialHealth.savingsRate.toFixed(1)}% da renda</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Saúde Financeira</h3>
              <p className="card-value" style={{ color: getHealthColor(analysis.financialHealth.score) }}>
                {analysis.financialHealth.rating}
              </p>
              <p className="card-detail">{analysis.financialHealth.score}/100 pontos</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">🛡️</div>
            <div className="card-content">
              <h3>Reserva de Emergência</h3>
              <p className="card-value">
                {analysis.emergencyFund.completionPercentage.toFixed(0)}%
              </p>
              <p className="card-detail">
                R$ {analysis.emergencyFund.currentAmount.toFixed(2)} de R$ {analysis.emergencyFund.recommendedAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="action-section">
        <button
          className="btn-generate"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          {loading ? 'Gerando Sugestões...' : 'Gerar Novas Sugestões'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <h2>Suas Sugestões Personalizadas</h2>
          <div className="suggestions-grid">
            {suggestions.map((suggestion) => (
              <InvestmentCard
                key={suggestion._id}
                suggestion={suggestion}
                onLearnMore={(s) => {
                  setToast({
                    message: `Para saber mais sobre ${s.productName}, consulte seu banco ou corretora!`,
                    type: 'info',
                    duration: 5000
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h2>Gere suas sugestões personalizadas</h2>
          <p>
            Complete seu perfil e clique em "Gerar Sugestões" para receber recomendações
            de investimentos baseadas na sua situação financeira.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestmentsPage;
