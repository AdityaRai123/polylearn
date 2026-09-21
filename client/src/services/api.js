import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// An expired or invalid session sends the user back to the login screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.startsWith('/api/auth/');
    if (error.response?.status === 401 && !isLoginAttempt) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error.response) {
    return 'Cannot reach the server. It may be waking up — please try again in a few seconds.';
  }
  return fallback;
};

export const authAPI = {
  config: () => api.get('/api/auth/config'),
  signup: (details) => api.post('/api/auth/signup', details),
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
};

export const courseAPI = {
  getLanguages: () => api.get('/api/languages'),
  getLanguage: (id) => api.get(`/api/languages/${id}`),
  getLessons: (unitId) => api.get(`/api/units/${unitId}/lessons`),
  getLessonQuestions: (lessonId) => api.get(`/api/lessons/${lessonId}`),
  checkAnswer: (lessonId, questionId, answer) => api.post(`/api/lessons/${lessonId}/check`, { questionId, answer }),
};

export const userAPI = {
  getDashboard: () => api.get('/api/user/dashboard'),
  submitLesson: (lessonId, answers) => api.post(`/api/lessons/${lessonId}/submit`, { answers }),
  refillHearts: () => api.post('/api/user/refill-hearts'),
  deleteAccount: () => api.delete('/api/user'),
};

// Student test taking
export const testAPI = {
  list: () => api.get('/api/tests'),
  get: (testId) => api.get(`/api/tests/${testId}`),
  submit: (testId, answers) => api.post(`/api/tests/${testId}/submit`, { answers }),
  result: (testId) => api.get(`/api/tests/${testId}/result`),
};

// Teacher test management
export const teacherAPI = {
  listTests: () => api.get('/api/teacher/tests'),
  getTest: (testId) => api.get(`/api/teacher/tests/${testId}`),
  createTest: (test) => api.post('/api/teacher/tests', test),
  updateTest: (testId, test) => api.put(`/api/teacher/tests/${testId}`, test),
  setPublished: (testId, isPublished) => api.patch(`/api/teacher/tests/${testId}/publish`, { isPublished }),
  deleteTest: (testId) => api.delete(`/api/teacher/tests/${testId}`),
  listAttempts: (testId) => api.get(`/api/teacher/tests/${testId}/attempts`),
  getAttempt: (testId, attemptId) => api.get(`/api/teacher/tests/${testId}/attempts/${attemptId}`),
  resetAttempt: (testId, attemptId) => api.delete(`/api/teacher/tests/${testId}/attempts/${attemptId}`),
};

export default api;
