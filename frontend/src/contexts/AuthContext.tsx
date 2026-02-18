import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState, useCallback } from 'react';
import { authService } from '../services/authService.ts';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string;
  fullName: string;
  phone: string;
  idNumber?: string;
  location?: string;
  profilePicUrl?: string;
  idCardImageUrl?: string;
  role: 'customer' | 'admin' | 'superadmin' | 'marketer';
  canLogin: boolean;
  membershipMonths?: number;
  validUntil?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  createUser: (userData: {
    fullName: string;
    phone: string;
    role?: 'customer' | 'admin' | 'superadmin';
    idNumber?: string;
    profilePicUrl?: string;
    registrationDate?: string;
    amount?: number;
    validUntil?: string;
  }) => Promise<User>;
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => Promise<{ users: User[]; pagination: any }>;
  deleteUser: (userId: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  clearError: () => void;
}

interface RegisterData {
  fullName: string;
  phone: string;
  password: string;
  role?: 'customer' | 'company';
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'), // Set to true if token exists
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Animated Toast Component
const AnimatedSuccessToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="relative bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-2xl border border-green-400/20 backdrop-blur-sm overflow-hidden">
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        />

        {/* Content */}
        <div className="relative flex items-center p-4 space-x-3">
          {/* Animated Checkmark */}
          <div className="flex-shrink-0">
            <motion.div
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <motion.svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0, scale: 0 }}
                animate={{ pathLength: 1, scale: 1 }}
                transition={{
                  delay: 0.4,
                  duration: 0.8,
                  ease: "easeInOut"
                }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    delay: 0.4,
                    duration: 0.8,
                    ease: "easeInOut"
                  }}
                />
              </motion.svg>
            </motion.div>
          </div>

          {/* Message */}
          <div className="flex-1">
            <motion.p
              className="text-sm font-semibold"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              {message}
            </motion.p>
          </div>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/30"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  const showAnimatedToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    // Detect if on mobile device
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );

    const checkAuth = async () => {
      // Try to get token from localStorage with error handling
      let token: string | null = null;
      try {
        token = localStorage.getItem('token');
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        // If localStorage fails, immediately show login
        if (isMounted) {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
        return;
      }

      if (!token) {
        // No token, immediately set loading to false
        if (isMounted) {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
        return;
      }

      try {
        const user = await authService.getProfile();

        if (isMounted) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              token,
              refreshToken: localStorage.getItem('refreshToken') || '',
            },
          });
        }
      } catch (error: any) {
        console.error('Auth check failed:', error);

        if (isMounted) {
          // Clear tokens on error
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          } catch (storageError) {
            console.error('Error clearing localStorage on auth failure:', storageError);
          }
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    // Add a small delay to ensure DOM is ready (especially on mobile)
    const initTimeout = setTimeout(() => {
      checkAuth();
    }, 100);

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
    };
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      console.log('[AuthContext.login] Starting login...', { phone });
      dispatch({ type: 'AUTH_START' });
      console.log('[AuthContext.login] AUTH_START dispatched');

      console.log('[AuthContext.login] Calling authService.login...');
      const response = await authService.login(phone, password);
      console.log('[AuthContext.login] authService.login returned:', { hasUser: !!response?.user, hasTokens: !!response?.tokens });

      if (!response?.tokens?.accessToken || !response?.tokens?.refreshToken) {
        throw new Error('Invalid response: missing tokens');
      }

      console.log('[AuthContext.login] Storing tokens in localStorage...');
      localStorage.setItem('token', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      console.log('[AuthContext.login] Tokens stored');

      console.log('[AuthContext.login] Dispatching AUTH_SUCCESS...');
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
        },
      });
      console.log('[AuthContext.login] AUTH_SUCCESS dispatched');

      toast.success(`Welcome back, ${response.user.fullName}!`);
      console.log('[AuthContext.login] Login completed successfully');
    } catch (error: any) {
      console.error('[AuthContext.login] Error caught:', {
        message: error.message,
        code: error.code,
        status: error.status || error.response?.status,
        responseData: error.response?.data,
      });

      // Get status code from error (check both error.status and error.response.status)
      const statusCode = error.status || error.response?.status;

      // Get language from localStorage (default to 'en')
      const currentLanguage = (typeof window !== 'undefined' ? localStorage.getItem('language') : null) || 'en';

      // Determine user-friendly error message
      let errorMessage = '';

      if (statusCode === 401) {
        errorMessage = error.response?.data?.message ||
          (currentLanguage === 'en'
            ? 'Invalid phone number or password. Please check your credentials.'
            : 'Lambarka telefoonka ama furaha sirta ma sax ah. Fadlan hubi macluumaadkaaga.');
      } else if (statusCode === 500) {
        errorMessage = error.response?.data?.message ||
          (currentLanguage === 'en'
            ? 'Server error. Please try again later.'
            : 'Qaladka server. Fadlan mar kale isku day waqtimo kale.');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = `Validation failed: ${JSON.stringify(error.response.data.errors)}`;
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = currentLanguage === 'en'
          ? 'Request timed out. Please try again.'
          : 'Waqtiga ayaa dhamaaday. Fadlan mar kale isku day.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMessage = currentLanguage === 'en'
          ? 'Network error. Please check your internet connection and try again.'
          : 'Qaladka xidhiidhka. Fadlan hubi xiriirkaaga internetka oo mar kale isku day.';
      } else {
        errorMessage = error.message ||
          (currentLanguage === 'en'
            ? 'Login failed. Please check your credentials and try again.'
            : 'Gelitaan way ku fashilantay. Fadlan hubi macluumaadkaaga oo mar kale isku day.');
      }

      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.register(userData);

      localStorage.setItem('token', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
        },
      });

      toast.success(`Welcome to SAHAL CARD, ${response.user.fullName}!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'AUTH_LOGOUT' });
      toast.success('👋 Logged out successfully!', {
        duration: 1000, // Show for 1 second only
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '16px',
          borderRadius: '20px',
          padding: '20px 28px',
          boxShadow: '0 25px 50px rgba(245, 158, 11, 0.5), 0 10px 20px rgba(0, 0, 0, 0.15)',
          border: '3px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          transform: 'scale(1.05)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          overflow: 'hidden',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          letterSpacing: '0.5px',
        },
        iconTheme: {
          primary: '#ffffff',
          secondary: '#f59e0b',
        },
        className: 'logout-toast',
        ariaProps: {
          role: 'status',
          'aria-live': 'polite',
        },
      });
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      throw error;
    }
  };

  const createUser = async (userData: {
    fullName: string;
    phone: string;
    role?: 'customer' | 'admin' | 'superadmin';
    idNumber?: string;
    profilePicUrl?: string;
    idCardImageUrl?: string;
  }) => {
    try {
      const newUser = await authService.createUser(userData);
      toast.success(`User ${newUser.fullName} created successfully!`);
      return newUser;
    } catch (error: any) {
      console.error('Create user error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors);
        toast.error(`Validation failed: ${validationErrors.map((e: any) => e.message).join(', ')}`);
      } else {
        toast.error(errorMessage);
      }
      throw error;
    }
  };

  const getAllUsers = async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) => {
    try {
      return await authService.getAllUsers(params);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to get users';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await authService.deleteUser(userId);
      showAnimatedToast('User deleted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateUser(userId, userData);
      return updatedUser;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      toast.error(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    createUser,
    getAllUsers,
    deleteUser,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <AnimatedSuccessToast
              key={toast.id}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </AuthContext.Provider>
  );
};