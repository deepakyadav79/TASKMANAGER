import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (userData) => api.post('/auth/login', userData),
  updateRole: (role) => api.put('/auth/update-role', { role }),
  getPendingMembers: () => api.get('/auth/pending-members'),
  approveMember: (memberId, approve) => api.put(`/auth/approve-member/${memberId}`, { approve }),
};

// Task API calls
export const taskAPI = {
  getTasks: () => api.get('/tasks'),
  createTask: (taskData) => api.post('/tasks', taskData),
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getTeamMembers: () => api.get('/tasks/team'),
  getAnalytics: () => api.get('/tasks/analytics'),
  awardAchievement: (achievementData) => api.post('/tasks/achievements', achievementData)
};

export default api;
