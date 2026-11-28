import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const storedRefresh = localStorage.getItem('reelclub_refresh_token');
          refreshPromise = axios
            .post(
              `${API_URL}/auth/refresh`,
              storedRefresh ? { refreshToken: storedRefresh } : {},
              { withCredentials: true }
            )
            .finally(() => {
              refreshPromise = null;
            });
        }

        const res = await refreshPromise;
        const { user, accessToken, refreshToken } = res.data.data;
        useAuthStore.getState().setSession(user, accessToken, refreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
