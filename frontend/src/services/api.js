// Base URL for the backend API
// const API_URL = process.env.REACT_APP_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }

      // ✅ Lê o body do erro antes de jogar fora
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.response = { data: errorData, status: response.status };
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: () => apiCall('/auth/logout', { method: 'POST' }),
  me: () => apiCall('/auth/me'),
};

// User API
export const userAPI = {
  getProfile: () => apiCall('/user/profile'),
  updateProfile: (data) => apiCall('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Company API
export const companyAPI = {
  getCompany: (companyId) => apiCall(`/companies/${companyId}`),
  updateCompany: (companyId, data) => apiCall(`/companies/${companyId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getUsers: (companyId) => apiCall(`/users/company/${companyId}`),
  addUser: (userData) => apiCall(`/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  removeUser: (userId) => apiCall(`/users/${userId}`, {
    method: 'DELETE',
  }),
  updateUser: (userId, userData) => apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};

// Admin API
export const adminAPI = {
  getCompanies: () => apiCall('/admin/companies'),
  approveCompany: (companyId) => apiCall(`/admin/companies/${companyId}/approve`, {
    method: 'PUT',
  }),
  rejectCompany: (companyId) => apiCall(`/admin/companies/${companyId}/reject`, {
    method: 'PUT',
  }),
  getUsers: () => apiCall('/admin/users'),
};