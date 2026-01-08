import axios from 'axios';

// Get API URL from environment variable or use default
const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (apiUrl) {
    // Remove trailing slash if present
    const cleanUrl = apiUrl.replace(/\/$/, '');
    // Ensure the URL ends with /api
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  
  // Fallback to proxy for development (when VITE_API_URL is not set)
  return '/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Priority: 1. Environment variable (always use latest), 2. localStorage, 3. fallback
    // Trim whitespace to avoid issues
    const envToken = import.meta.env.VITE_ADMIN_TOKEN?.trim();
    const storedToken = localStorage.getItem('accessToken')?.trim();
    const token = envToken || storedToken || 'admin-token';
    
    // Update localStorage if env token is different (to keep them in sync)
    if (envToken && envToken !== storedToken) {
      localStorage.setItem('accessToken', envToken);
    }
    
    config.headers.Authorization = `Bearer ${token}`;
    
    // Debug logging (remove in production)
    if (import.meta.env.DEV) {
      console.debug('[Axios] Using token:', token ? `${token.substring(0, 10)}...` : 'none');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

