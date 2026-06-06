const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = { headers: getAuthHeaders(), ...options };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (window.location.pathname !== '/') window.location.href = '/';
      }
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

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (credentials) => apiCall('/auth/login',    { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData)    => apiCall('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  logout:   ()            => apiCall('/auth/logout',   { method: 'POST' }),
  me:       ()            => apiCall('/auth/me'),
};

// ── User / Profile ────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile:    ()       => apiCall('/user/profile'),
  updateProfile: (data)   => apiCall('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Company ───────────────────────────────────────────────────────────────────
export const companyAPI = {
  getCompany:   (id)         => apiCall(`/companies/${id}`),
  updateCompany:(id, data)   => apiCall(`/companies/${id}`,         { method: 'PUT',    body: JSON.stringify(data) }),
  getUsers:     (id)         => apiCall(`/users/company/${id}`),
  addUser:      (data)       => apiCall('/users',                    { method: 'POST',   body: JSON.stringify(data) }),
  removeUser:   (id)         => apiCall(`/users/${id}`,              { method: 'DELETE' }),
  updateUser:   (id, data)   => apiCall(`/users/${id}`,              { method: 'PUT',    body: JSON.stringify(data) }),
};

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const vehicleAPI = {
  // catálogo público (cliente) — sem company_id
  getCatalog:           ()         => apiCall('/vehicles'),
  // veículos da empresa
  getByCompany:         (cid)      => apiCall(`/vehicles?company_id=${cid}`),
  getById:              (id)       => apiCall(`/vehicles/${id}`),
  getUnavailableDates:  (id)       => apiCall(`/vehicles/${id}/unavailable-dates`),
  create:               (data)     => apiCall('/vehicles',     { method: 'POST',   body: JSON.stringify(data) }),
  update:               (id, data) => apiCall(`/vehicles/${id}`, { method: 'PUT',  body: JSON.stringify(data) }),
  deactivate:           (id)       => apiCall(`/vehicles/${id}`, { method: 'DELETE' }),
};

// ── Drivers ───────────────────────────────────────────────────────────────────
export const driverAPI = {
  getByCompany: (cid)      => apiCall(`/drivers?company_id=${cid}`),
  getById:      (id)       => apiCall(`/drivers/${id}`),
  create:       (data)     => apiCall('/drivers',      { method: 'POST',   body: JSON.stringify(data) }),
  update:       (id, data) => apiCall(`/drivers/${id}`, { method: 'PUT',   body: JSON.stringify(data) }),
  deactivate:   (id)       => apiCall(`/drivers/${id}`, { method: 'DELETE' }),
};

// ── Trip Requests ─────────────────────────────────────────────────────────────
export const tripRequestAPI = {
  getByClient:   (clientId)  => apiCall(`/trip-requests?client_id=${clientId}`),
  getByCompany:  (companyId) => apiCall(`/trip-requests?company_id=${companyId}`),
  getById:       (id)        => apiCall(`/trip-requests/${id}`),
  create:        (data)      => apiCall('/trip-requests',             { method: 'POST',   body: JSON.stringify(data) }),
  updateStatus:  (id, data)  => apiCall(`/trip-requests/${id}/status`, { method: 'PUT',  body: JSON.stringify(data) }),
  cancel:        (id)        => apiCall(`/trip-requests/${id}`,       { method: 'DELETE' }),
};

// ── Trips ─────────────────────────────────────────────────────────────────────
export const tripAPI = {
  getAll:       ()         => apiCall('/trips'),
  getByCompany: (cid)      => apiCall(`/trips?company_id=${cid}`),
  getByClient:  (cid)      => apiCall(`/trips?client_id=${cid}`),
  getById:      (id)       => apiCall(`/trips/${id}`),
  create:       (data)     => apiCall('/trips',       { method: 'POST',   body: JSON.stringify(data) }),
  update:       (id, data) => apiCall(`/trips/${id}`, { method: 'PUT',    body: JSON.stringify(data) }),
  cancel:       (id)       => apiCall(`/trips/${id}`, { method: 'DELETE' }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getCompanies:    ()   => apiCall('/admin/companies'),
  approveCompany:  (id) => apiCall(`/admin/companies/${id}/approve`, { method: 'PUT' }),
  rejectCompany:   (id) => apiCall(`/admin/companies/${id}/reject`,  { method: 'PUT' }),
  getUsers:        ()   => apiCall('/admin/users'),
};
