import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

instance.interceptors.request.use(config => {
  // Lägg till auth-header om token finns
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    // Hantera 401/403, logga ut eller visa felmeddelande
    return Promise.reject(error);
  }
);

export default instance;
