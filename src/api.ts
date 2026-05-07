import axios, { AxiosError, AxiosResponse } from 'axios';

// ── Shared axios instance ─────────────────────────────────────────────────────
export const API_MENU = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    accept: 'application/json',
    'x-app-version': 'v2',
  },
});

// ── Response interceptor ──────────────────────────────────────────────────────
API_MENU.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(
        new Error('Network unavailable. Please check your internet connection.')
      );
    }
    return Promise.reject(error);
  }
);
