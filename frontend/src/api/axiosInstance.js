import axios from 'axios';

// Base Axios instance pointing to the Spring Boot REST API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for consistent error extraction
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Return structured payload if backend returned error response
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      status: error.response?.status || 500,
      error: 'NETWORK_ERROR',
      message: error.message || 'Network connection failed. Ensure backend is running.',
    });
  }
);

export default axiosInstance;
