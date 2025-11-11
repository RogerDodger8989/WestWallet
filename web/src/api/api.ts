import axios from 'axios';

// Detect if running in GitHub Codespaces
const isCodespaces = typeof window !== 'undefined' && window.location.hostname.includes('github.dev');
export const API_BASE_URL = isCodespaces
  ? `https://${window.location.hostname.replace(/-(5173|5174|5175)\./, '-3000.')}`
  : 'http://localhost:3000';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// global 401 handler: clear auth and redirect to login with a friendly message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const originalUrl: string | undefined = error?.config?.url;
    if (status === 401 && originalUrl && !originalUrl.startsWith('/auth/')) {
      try {
        // Avoid redirect loops from the login/register endpoints
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Surface a one-shot message for the login page
        localStorage.setItem('authMessage', 'Sessionen har gått ut. Logga in igen.');
      } catch (_) {
        // ignore storage errors (private mode etc.)
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface User { id: number; username: string }

export const authAPI = {
  register: async (username: string, password: string) => {
    try {
      console.log('Attempting register to:', `${API_BASE_URL}/auth/register`);
      const { data } = await api.post('/auth/register', { username, password });
      console.log('Register success:', data);
      return data;
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },
  login: async (username: string, password: string) => {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      const { data } = await api.post('/auth/login', { username, password });
      console.log('Login success:', data);
      if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },
  logout: async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
  refresh: async () => {
    const { data } = await api.get('/auth/refresh');
    if (data?.access_token) {
      localStorage.setItem('accessToken', data.access_token);
    }
    return data;
  }
};

export const walletsAPI = {
  list: async () => {
    const { data } = await api.get('/wallets');
    return data;
  },
  create: async (name: string, currency = 'SEK') => {
    const { data } = await api.post('/wallets', { name, currency });
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`/wallets/${id}`);
    return data;
  },
  createTransaction: async (walletId: number, amount: number, type: 'credit'|'debit', description?: string) => {
    const { data } = await api.post(`/wallets/${walletId}/transactions`, { amount, type, description });
    return data;
  },
  listTransactions: async (walletId: number) => {
    const { data } = await api.get(`/wallets/${walletId}/transactions`);
    return data;
  }
};

// Categories API helper
export const categoriesAPI = {
  list: async () => {
    const { data } = await api.get('/categories');
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`/categories/${id}`);
    return data;
  },
  create: async (name: string) => {
    const { data } = await api.post('/categories', { name });
    return data;
  },
  update: async (id: number, name: string) => {
    const { data } = await api.put(`/categories/${id}`, { name });
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  }
};

// Suppliers API helper
export const suppliersAPI = {
  list: async (categoryId?: number) => {
    const { data } = await api.get('/suppliers', { params: categoryId ? { categoryId } : undefined });
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data;
  },
  create: async (name: string, categoryId: number) => {
    const { data } = await api.post('/suppliers', { name, categoryId });
    return data;
  },
  update: async (id: number, partial: { name?: string; categoryId?: number }) => {
    const { data } = await api.put(`/suppliers/${id}`, partial);
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/suppliers/${id}`);
    return data;
  }
};

// Import rules API helper
export const importRulesAPI = {
  list: async () => {
    const { data } = await api.get('/expenses/import/rules');
    return data;
  },
  create: async (pattern: string, categoryId?: number, supplierId?: number) => {
    const { data } = await api.post('/expenses/import/rules', { pattern, categoryId, supplierId });
    return data;
  },
  update: async (id: number, updates: any) => {
    const { data } = await api.put(`/expenses/import/rules/${id}`, updates);
    return data;
  },
  remove: async (id: number) => {
    const { data } = await api.delete(`/expenses/import/rules/${id}`);
    return data;
  }
};

// Budgets API helper
export const budgetsAPI = {
  listCategory: async () => {
    const { data } = await api.get('/budgets/category');
    return data;
  },
  createCategory: async (categoryId: number, monthlyLimit: number, startMonth?: string, endMonth?: string) => {
    const { data } = await api.post('/budgets/category', { categoryId, monthlyLimit, startMonth, endMonth });
    return data;
  },
  updateCategory: async (id: number, updates: { monthlyLimit?: number; startMonth?: string; endMonth?: string }) => {
    const { data } = await api.put(`/budgets/category/${id}`, updates);
    return data;
  },
  removeCategory: async (id: number) => {
    const { data } = await api.delete(`/budgets/category/${id}`);
    return data;
  }
};

export default api;
