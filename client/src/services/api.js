import axios from 'axios';

const rawApiUrl =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3001';

const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');

export const API_BASE_URL = `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
// also provide named export for compatibility
export { api };

export const register = (userData) => api.post('/auth/register', userData);
export const login = (userData) => api.post('/auth/login', userData);

export const getTransactions = () => api.get('/transactions');
export const createTransaction = (transactionData) => api.post('/transactions', transactionData);
export const updateTransaction = (id, transactionData) => api.put(`/transactions/${id}`, transactionData);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
// Subcategories by parent category (server provides full list regardless de uso)
export const getSubcategoriesByCategory = (categoryId) => api.get(`/transactions/subcategories/${categoryId}`);
export const uploadReceipt = (formData) => api.post('/transactions/ocr', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const saveOcrTransactions = (data) => api.post('/transactions/ocr/save', data);
export const uploadPdfStatement = (formData) => api.post('/transactions/pdf', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const getBudgets = () => api.get('/budgets');
export const saveBudget = (budgetData) => api.post('/budgets', budgetData);
export const backfillSubcategories = () => api.post('/transactions/backfill-subcategories');
