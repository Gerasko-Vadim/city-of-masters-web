export const API_PATH = 'https://city-of-masters-backend-production.up.railway.app'

// app/shared/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: API_PATH,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
