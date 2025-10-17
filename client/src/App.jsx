import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import MarketTicker from './components/MarketTicker';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Alert from './components/Alert';
import './App.css';

// Lazy load components for code splitting
const Home = lazy(() => import('./pages/Home'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FinancialDashboardPage = lazy(() => import('./pages/FinancialDashboardPage'));
const OcrUploadPage = lazy(() => import('./pages/OcrUploadPage'));
const PdfUploadPage = lazy(() => import('./pages/PdfUploadPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const BudgetAlertsPage = lazy(() => import('./pages/BudgetAlertsPage'));
const PredictionsPage = lazy(() => import('./pages/PredictionsPage'));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    fontSize: '1.2rem',
    color: '#6366f1'
  }}>
    <div>Carregando...</div>
  </div>
);

function App() {
  const [alert, setAlert] = useState(null);

  const handleSetAlert = (message) => {
    setAlert(message);
  };

  const handleCloseAlert = () => {
    setAlert(null);
  };

  return (
    <ThemeProvider>
      <div className="app-wrapper">
        <Navbar />
        <main className="container">
          <Alert message={alert} onClose={handleCloseAlert} />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Private Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage setAlert={handleSetAlert} />} />
                <Route path="/financial-dashboard" element={<FinancialDashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage setAlert={handleSetAlert} />} />
                <Route path="/ocr" element={<OcrUploadPage setAlert={handleSetAlert} />} />
                <Route path="/upload-statement" element={<PdfUploadPage setAlert={handleSetAlert} />} />
                <Route path="/budgets" element={<BudgetAlertsPage />} />
                <Route path="/alerts" element={<BudgetAlertsPage />} />
                <Route path="/predictions" element={<PredictionsPage />} />
                <Route path="/investments" element={<InvestmentsPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
        <MarketTicker refreshInterval={60000} />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
