import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:8080';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ors_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success === false) {
        return Promise.reject(new Error(response.data.message || 'API Error'));
      }
      return response.data.data !== undefined ? response.data.data : response.data;
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const apiRequest = (token?: string | null): AxiosInstance => {
  const instance = axios.create({
    baseURL: getBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!config.headers.Authorization && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('ors_token');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        if (response.data.success === false) {
          return Promise.reject(new Error(response.data.message || 'API Error'));
        }
        return response.data.data !== undefined ? response.data.data : response.data;
      }
      return response.data;
    },
    (error) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
};

export default api;
