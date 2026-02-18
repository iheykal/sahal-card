import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LogIn,
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import LoadingSpinner from './common/LoadingSpinner.tsx';

// Use connection string from centralized config
// @ts-ignore
import { API_BASE_URL } from '../services/apiConfig';

const getApiUrl = (): string => {
  return API_BASE_URL;
};

const GlobalLoginButton: React.FC = () => {
  const { language } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isButtonClicked, setIsButtonClicked] = useState(false);

  // Reset button state when modal closes
  useEffect(() => {
    if (!showLoginForm) {
      setIsButtonClicked(false);
    }
  }, [showLoginForm]);

  // Login form handlers
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let fullPhoneNumber = '';

    try {
      // Clean and format phone number for mobile compatibility
      let cleanPhone = loginData.phone.trim();

      // Remove all non-digit characters except +
      cleanPhone = cleanPhone.replace(/[^\d+]/g, '');

      // Handle different mobile input scenarios
      if (cleanPhone.startsWith('+252')) {
        // Already has +252 prefix
        fullPhoneNumber = cleanPhone;
      } else if (cleanPhone.startsWith('252')) {
        // Has 252 but missing +
        fullPhoneNumber = '+' + cleanPhone;
      } else {
        // Just the number part (9 digits for Somali numbers) - prepend +252
        fullPhoneNumber = '+252' + cleanPhone;
      }

      // Validate format: should be +252 followed by 9 digits
      if (!/^\+252\d{9}$/.test(fullPhoneNumber)) {
        throw new Error(language === 'en'
          ? 'Invalid phone number format. Please enter a valid Somali phone number (+252XXXXXXXXX)'
          : 'Foomka lambarka telefoonka ma sax ah. Fadlan geli lambar Somali ah (+252XXXXXXXXX)');
      }

      console.log('=== LOGIN DEBUG ===');
      console.log('User Agent:', navigator.userAgent);
      console.log('Platform:', navigator.platform);
      console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      console.log('Window location:', {
        hostname: window.location.hostname,
        origin: window.location.origin,
        href: window.location.href,
      });
      console.log('Original phone input:', `"${loginData.phone}"`);
      console.log('Cleaned phone:', `"${cleanPhone}"`);
      // Mask all but last 3 digits for logging
      const maskedPhone = fullPhoneNumber.replace(/^(\+252)(\d{6})(\d{3})$/, '$1******$3');
      console.log('Final phone number:', `"${maskedPhone}"`);
      console.log('Login attempt:', { phone: fullPhoneNumber, password: '***' });

      // Check if running on localhost
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Retry mechanism: fewer retries for localhost, more for production (Render cold starts)
      const maxRetries = isLocalhost ? 0 : 2; // No retries for localhost, 2 for production
      let attempt = 0;
      let loginSucceeded = false;
      // Capture variables used in closures for loop safety
      const currentLanguage = language;
      const currentIsLocalhost = isLocalhost;
      let currentAttempt = 0; // Initialize outside loop to ensure it's always defined

      while (attempt <= maxRetries && !loginSucceeded) {
        attempt++;
        currentAttempt = attempt; // Update at loop level so it's accessible in catch
        // Capture currentAttempt in a const to avoid unsafe closure reference
        const attemptNumber = currentAttempt;
        console.log(`Login attempt ${attemptNumber} of ${maxRetries + 1}...`);

        try {
          // Wrap in Promise.race with timeout as a safety measure
          const loginStartTime = Date.now();

          console.log(`[Login Attempt ${attemptNumber}] Starting login promise...`);

          const loginPromise = login(fullPhoneNumber, loginData.password);
          const timeoutMs = currentIsLocalhost ? 15000 : 65000; // 15s for localhost, 65s for production

          console.log(`[Login Attempt ${attemptNumber}] Timeout set to ${timeoutMs}ms`);

          let timeoutId: NodeJS.Timeout;
          // eslint-disable-next-line no-loop-func
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              const elapsed = Date.now() - loginStartTime;
              console.error(`[Login Attempt ${attemptNumber}] Timeout triggered after ${elapsed}ms`);
              const timeoutMsg = currentIsLocalhost
                ? (currentLanguage === 'en'
                  ? 'Backend server is not responding. Please make sure the server is running on http://localhost:5001'
                  : 'Server-ka ma u jeediya. Fadlan hubi in server-ku uu shaqeeyo http://localhost:5001')
                : (currentLanguage === 'en'
                  ? 'Backend server is taking too long to respond. The server may be waking up. Please try again in a moment.'
                  : 'Server-ka ayaa waqtin badan u qaaday. Server-ku wuu kici karaa. Fadlan mar kale isku day.');
              reject(new Error(timeoutMsg));
            }, timeoutMs);
          });

          // If loginPromise resolves (even with undefined), login succeeded
          try {
            console.log(`[Login Attempt ${attemptNumber}] Waiting for Promise.race...`);
            await Promise.race([loginPromise, timeoutPromise]);
            const elapsed = Date.now() - loginStartTime;
            // Clear timeout if login succeeded before timeout
            if (timeoutId!) clearTimeout(timeoutId!);
            console.log(`[Login Attempt ${attemptNumber}] Login successful after ${elapsed}ms`);
            loginSucceeded = true;
            break; // Success, exit retry loop
          } catch (raceError: any) {
            const elapsed = Date.now() - loginStartTime;
            // Clear timeout on error too
            if (timeoutId!) clearTimeout(timeoutId!);
            console.error(`[Login Attempt ${attemptNumber}] Promise.race failed after ${elapsed}ms:`, raceError.message);
            throw raceError;
          }
        } catch (error: any) {
          console.error(`Login attempt ${attemptNumber} failed:`, error.message);

          // If it's a timeout and we have retries left (and not localhost), wait and retry
          if (!currentIsLocalhost && (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) && attemptNumber <= maxRetries) {
            const waitTime = attemptNumber * 2000; // Wait 2s, 4s before retries
            console.log(`Waiting ${waitTime}ms before retry ${attemptNumber + 1}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue; // Retry
          }

          // If localhost or no retries left, throw the error immediately
          throw error;
        }
      }

      if (!loginSucceeded) {
        throw new Error(language === 'en'
          ? 'Login failed after multiple attempts. The backend server may be down. Please try again later.'
          : 'Gelitaan way ku fashilantay ka dib isku dayayaal badan. Server-ka wuu dhacay. Fadlan waqtiimo kale isku day.');
      }

      // Show success message
      setShowSuccessMessage(true);

      // Close login form and navigate based on phone pattern after a short delay
      // Marketers have phone numbers starting with +25261
      setTimeout(() => {
        setShowLoginForm(false);
        setShowSuccessMessage(false);

        // Check if phone starts with +25261 (marketer pattern)
        if (fullPhoneNumber.startsWith('+25261')) {
          navigate('/marketer/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Request data sent:', { phone: fullPhoneNumber, password: '***' });
      console.error('Error response:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Handle different types of errors - prioritize network/timeout errors
      let errorMessage = '';
      const currentApiUrl = getApiUrl();
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // Get status code from error (check both error.status and error.response.status)
      const statusCode = error.status || error.response?.status;

      // Check for HTTP response errors FIRST (before network errors)
      // This ensures 401, 500, etc. are handled correctly
      if (statusCode) {
        if (statusCode === 401) {
          errorMessage = language === 'en'
            ? 'Invalid phone number or password. Please check your credentials.'
            : 'Lambarka telefoonka ama furaha sirta ma sax ah. Fadlan hubi macluumaadkaaga.';
        } else if (statusCode === 500) {
          errorMessage = language === 'en'
            ? 'Server error. Please try again later.'
            : 'Qaladka server. Fadlan mar kale isku day waqtimo kale.';
        } else if (error.response?.data?.message) {
          errorMessage = `Login failed: ${error.response.data.message}`;
        } else if (error.response?.data?.errors) {
          errorMessage = `Validation failed: ${JSON.stringify(error.response.data.errors)}`;
        } else {
          errorMessage = language === 'en'
            ? `Login failed. Status: ${statusCode}`
            : `Gelitaan way ku fashilantay. Xaalada: ${statusCode}`;
        }
      }
      // Check for network/timeout errors (these don't have a response or status)
      else if (!error.response && !statusCode) {
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          // Different messages for localhost vs production
          if (isLocalhost) {
            if (currentApiUrl.includes('localhost')) {
              errorMessage = language === 'en'
                ? 'Backend server is not responding. Please make sure the backend is running on http://localhost:5001'
                : 'Server-ka ma u jeediya. Fadlan hubi in backend-ku uu shaqeeyo http://localhost:5001';
            } else {
              errorMessage = language === 'en'
                ? '⚠️ API is pointing to production. For local testing, create a .env file in frontend/ with: REACT_APP_API_URL=http://localhost:5001/api and restart the dev server.'
                : '⚠️ API-ga wuxuu u jeedayaa production. Si aad u test gareeyso local, samee file .env gudaha frontend/ oo ku qor: REACT_APP_API_URL=http://localhost:5001/api oo dib u bilow server-ka.';
            }
          } else {
            errorMessage = language === 'en'
              ? 'Backend server is not responding. The server may be waking up (this can take up to 60 seconds on free hosting). Please wait a moment and try again.'
              : 'Server-ka ayaa u jeediya. Server-ku wuu kici karaa (60 ilbiriqood oo kaliya). Fadlan sug oo mar kale isku day.';
          }
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
          errorMessage = language === 'en'
            ? 'Network error. Please check your internet connection and try again.'
            : 'Qaladka xidhiidhka. Fadlan hubi xiriirkaaga internetka oo mar kale isku day.';
        } else if (error.message?.includes('format') || error.message?.includes('Foomka')) {
          // Validation error thrown by us
          errorMessage = error.message;
        } else {
          // Generic error without response
          errorMessage = language === 'en'
            ? 'Connection error. Please check your internet connection and try again.'
            : 'Qaladka isku xirka. Fadlan hubi xiriirkaaga internetka oo mar kale isku day.';
        }
      }
      // Fallback for any other error (no status code and no network error)
      else {
        errorMessage = language === 'en'
          ? 'Login failed. Please check your credentials and try again.'
          : 'Gelitaan way ku fashilantay. Fadlan hubi macluumaadkaaga oo mar kale isku day.';
      }

      // Show error message to user
      if (errorMessage) {
        alert(errorMessage);
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Login Button - Global Floating Action Button - Only show when not authenticated */}
      {!isAuthenticated && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          onClick={() => {
            if (!isButtonClicked && !showLoginForm) {
              setIsButtonClicked(true);
              setShowLoginForm(true);
              // Reset button click state after a short delay
              setTimeout(() => setIsButtonClicked(false), 1000);
            }
          }}
          disabled={isButtonClicked || showLoginForm}
          className="fixed top-8 right-8 z-[9999] bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 rounded-full px-4 py-3 shadow-lg hover:shadow-xl group flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={language === 'en' ? 'Login' : 'Gali'}
          type="button"
        >
          <LogIn className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
          <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors duration-300">
            {language === 'en' ? 'Login' : 'Gali'}
          </span>
        </motion.button>
      )}

      {/* Login Form Modal */}
      <AnimatePresence>
        {showLoginForm && (
          <motion.div
            key="global-login-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
            onClick={() => setShowLoginForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold gradient-text">
                    {language === 'en' ? 'Welcome Back' : 'Ku Soo Dhawoow'}
                  </h2>
                  <button
                    onClick={() => setShowLoginForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Phone Number' : 'Lambarka Telefoonka'}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-300 bg-white">
                      <div className="flex items-center px-3 py-3 text-base text-gray-600 border-r border-gray-200">
                        <span className="mr-1">🇸🇴</span>
                        <span className="font-medium">+252</span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={loginData.phone}
                        onChange={handleLoginChange}
                        required
                        className="flex-1 px-3 py-3 border-0 outline-none text-base bg-transparent"
                        placeholder={language === 'en' ? 'Enter phone number' : 'Geli lambarka telefoonka'}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Password' : 'Furaha Sirta'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        required
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder={language === 'en' ? 'Enter your password' : 'Geli furaha sirta'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>{language === 'en' ? 'Sign In' : 'Gali'}</span>
                      </>
                    )}
                  </button>
                </form>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed top-8 right-8 z-[10000] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-medium">
            {language === 'en' ? 'Logged in successfully!' : 'Si ayaan ku galiyay!'}
          </span>
        </motion.div>
      )}
    </>
  );
};

export default GlobalLoginButton;
