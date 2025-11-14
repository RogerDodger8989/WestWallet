import axios from 'axios';

const API_URL = '/auth';

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/login`, { email, password });
  return res.data;
}

export async function register(email: string, password: string) {
  const res = await axios.post(`${API_URL}/register`, { email, password });
  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await axios.post(`${API_URL}/forgot-password`, { email });
  return res.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await axios.post(`${API_URL}/reset-password`, { token, newPassword });
  return res.data;
}
