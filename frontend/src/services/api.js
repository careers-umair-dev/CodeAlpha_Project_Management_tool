import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';

// --- Auth ---
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/me/avatar', formData);
  },
  deleteAvatar: () => api.delete('/auth/me/avatar'),
  changePassword: (data) => api.put('/auth/me/password', data),
  deleteAccount: (data) => api.delete('/auth/me/account', { data }),
  searchUsers: (q) => api.get('/auth/search', { params: { q } }),
};

// --- Projects ---
export const projectApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  addMember: (id, email) => api.post(`/projects/${id}/members`, { email }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  dashboardStats: () => api.get('/projects/dashboard/stats'),
};

// --- Tasks ---
export const taskApi = {
  listMine: (params) => api.get('/tasks/mine', { params }),
  search: (q) => api.get('/tasks/search', { params: { q } }),
  listForProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  remove: (id) => api.delete(`/tasks/${id}`),
};

// --- Comments ---
export const commentApi = {
  listForTask: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (data) => api.post('/comments', data),
  remove: (id) => api.delete(`/comments/${id}`),
};

// --- Notifications ---
export const notificationApi = {
  list: () => api.get('/notifications'),
  markAllRead: () => api.patch('/notifications/read'),
  clear: () => api.delete('/notifications'),
};

export default api;
