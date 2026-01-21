import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  createGuest: (name = 'Guest') => api.post('/auth/guest', { name }),
  getMe: () => api.get('/auth/me'),
};

// Vendor APIs
export const vendorAPI = {
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  getMyProfile: () => api.get('/vendors/my/profile'),
};

// Event APIs
export const eventAPI = {
  create: (data) => api.post('/events', data),
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.put(`/events/${id}`, data),
  addVendor: (eventId, vendorId) => api.post(`/events/${eventId}/vendors/${vendorId}`),
  removeVendor: (eventId, vendorId) => api.delete(`/events/${eventId}/vendors/${vendorId}`),
};

// Booking APIs
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getUserBookings: () => api.get('/bookings/user'),
  getVendorBookings: () => api.get('/bookings/vendor'),
  update: (id, data) => api.put(`/bookings/${id}`, data),
};

// AI APIs
export const aiAPI = {
  chat: (message, eventContext = null) => api.post('/ai/chat', { message, event_context: eventContext }),
  getRecommendations: (data) => api.post('/ai/recommendations', data),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

// Seed API
export const seedAPI = {
  seed: () => api.post('/seed'),
};

export default api;
