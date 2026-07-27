import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired/unauthorized tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (name, email, password) => api.post('/api/auth/signup', { name, email, password }),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
};

export const courseAPI = {
  getLanguages: () => api.get('/api/languages'),
  getLanguage: (id) => api.get(`/api/languages/${id}`),
  getLessons: (unitId) => api.get(`/api/units/${unitId}/lessons`),
  getLessonQuestions: (lessonId) => api.get(`/api/lessons/${lessonId}`),
};

export const userAPI = {
  getDashboard: () => api.get('/api/user/dashboard'),
  submitLesson: (lessonId, answers) => api.post(`/api/lessons/${lessonId}/submit`, { answers }),
  refillHearts: () => api.post('/api/user/refill-hearts'),
  deleteAccount: () => api.delete('/api/user'),
};

export default api;
