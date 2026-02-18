import axios from 'axios';

import { API_BASE_URL } from './apiConfig';

// Helper function to get timeout dynamically
const getApiTimeout = (): number => {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocalhost ? 10000 : 60000; // 10s for localhost, 60s for production
  }
  return 60000; // Default to production timeout
};

const API_TIMEOUT = getApiTimeout();

// Log configuration (only in browser)
if (typeof window !== 'undefined') {
  console.log('[API Config]', {
    hostname: window.location.hostname,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    apiUrl: API_BASE_URL,
    timeout: API_TIMEOUT,
    envApiUrl: process.env.REACT_APP_API_URL,
  });
}

// Create axios instance with timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry on 401 for login requests (would cause infinite loop)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('token', accessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  fullName: string;
  phone: string;
  idNumber?: string;
  location?: string;
  profilePicUrl?: string;
  role: 'customer' | 'admin' | 'superadmin' | 'marketer';
  canLogin: boolean;
  membershipMonths?: number;
  validUntil?: string;
  createdAt: string;
}

export interface RegisterData {
  fullName: string;
  phone: string;
  password: string;
  role?: 'customer' | 'company';
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  // Login user
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const startTime = Date.now();
    console.log('[authService.login] Starting login request...', {
      phone,
      endpoint: '/auth/login',
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      timestamp: new Date().toISOString(),
    });

    // Create abort controller as additional safety
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[authService.login] ⚠️ Timeout reached, aborting request...', {
        timeout: API_TIMEOUT,
        elapsed: Date.now() - startTime
      });
      controller.abort();
    }, API_TIMEOUT);

    console.log('[authService.login] Request configuration:', {
      url: '/auth/login',
      method: 'POST',
      timeout: API_TIMEOUT,
      headers: api.defaults.headers
    });

    try {
      const response = await api.post('/auth/login', { phone, password }, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      console.log('[authService.login] Response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataStructure: Object.keys(response.data || {}),
        elapsed: `${elapsed}ms`,
      });
      const result = response.data.data; // Extract data from the nested structure
      console.log('[authService.login] Extracted data:', { hasUser: !!result?.user, hasTokens: !!result?.tokens });
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      // Check if aborted
      if (error.name === 'AbortError' || error.name === 'CanceledError' || axios.isCancel(error)) {
        console.error('[authService.login] 🛑 Request was ABORTED:', {
          elapsed: `${elapsed}ms`,
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack
        });
        const timeoutError = new Error('Request timed out');
        (timeoutError as any).code = 'ECONNABORTED';
        throw timeoutError;
      }

      console.error('[authService.login] ❌ Error occurred:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        elapsed: `${elapsed}ms`,
        timeout: API_TIMEOUT,
        isTimeout: error.code === 'ECONNABORTED',
        errorName: error.name,
        stack: error.stack,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          timeout: error.config?.timeout
        }
      });
      throw error;
    }
  },

  // Register user
  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data.data; // Extract data from the nested structure
  },

  // Logout user
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data.data.user;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<void> => {
    await api.post('/auth/resend-verification', { email });
  },

  // Admin functions
  createUser: async (userData: {
    fullName: string;
    phone: string;
    role?: 'customer' | 'admin' | 'superadmin';
    idNumber?: string;
    profilePicUrl?: string;
    registrationDate?: string;
    amount?: number;
    validUntil?: string;
  }): Promise<User> => {
    const response = await api.post('/auth/create-user', userData);
    return response.data.data.user;
  },

  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{ users: User[]; pagination: any }> => {
    const response = await api.get('/auth/users', { params });
    return response.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data.data.user || response.data.data || response.data;
  },
};

export default authService;