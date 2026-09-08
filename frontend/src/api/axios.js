import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Request interceptor: attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('idas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const ensureUtc = (obj) => {
  if (typeof obj === 'string') {
    // Append Z to ISO 8601 strings that lack a timezone specifier
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(obj)) {
      return obj + 'Z';
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(ensureUtc);
  }
  if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        newObj[key] = ensureUtc(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

// Response interceptor: append Z to dates, handle 401 by clearing token
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = ensureUtc(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('idas_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
