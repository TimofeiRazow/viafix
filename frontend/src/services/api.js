import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
};

export const complaintsAPI = {
  getComplaints: (status = null, skip = 0, limit = 100) => 
    api.get('/admin/complaints', { params: { status, skip, limit } }),
  
  updateComplaint: (id, updateData) => 
    api.put(`/admin/complaints/${id}`, updateData),
  
  getComplaintsForMap: () => 
    api.get('/map/complaints'),
};

export const analyticsAPI = {
  generateReport: (startDate, endDate) => 
    api.get('/analytics/report', { 
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    }),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
};

// Экспортируем отдельные функции для удобства
export const getComplaintsForMap = () => complaintsAPI.getComplaintsForMap();
export const getAdminComplaints = (status, skip, limit) => complaintsAPI.getComplaints(status, skip, limit);
export const updateComplaintStatus = (id, updateData) => complaintsAPI.updateComplaint(id, updateData);
export const loginUser = (username, password) => authAPI.login(username, password);
export const registerUser = (userData) => authAPI.register(userData);

export default api;