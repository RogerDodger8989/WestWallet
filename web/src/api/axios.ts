
import axios from 'axios';

// Skapa en tydlig och robust Axios-instans
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor för att alltid skicka JWT-token från localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Logga ALLTID url, metod och headers
  console.log('[Axios]', {
    url: config.url,
    method: config.method,
    headers: config.headers,
  });
  return config;
});

// Interceptor för att logga och hantera fel
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[Axios Error]', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error('[Axios Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
