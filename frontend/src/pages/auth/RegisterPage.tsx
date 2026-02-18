import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    role: 'customer' as 'customer' | 'company',
  });
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { language } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    
    // Auto-capitalize first letter for phone field
    if (e.target.name === 'phone' && value.length > 0) {
      value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create account with default password
      await register({
        ...formData,
        password: 'default123', // Default password for simple registration
      });
      
      // Show different message based on role
      if (formData.role === 'company') {
        alert(language === 'en' 
          ? 'Account created! Please wait for admin approval before logging in.'
          : 'Akoonka waa la sameeyay! Fadlan sug oggolaanshaha maamulaha ka hor inta aadan gelin.');
      }
      
      navigate('/');
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              {language === 'en' ? 'Create Account' : 'Samee Akoon'}
            </h1>
            <p className="text-gray-600">
              {language === 'en' ? 'Join SAHAL CARD today' : 'Ku biir SAHAL CARD maanta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Full Name' : 'Magaca Buuxa'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder={language === 'en' ? 'Enter your full name' : 'Geli magacaaga buuxa'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Landline Number' : 'Lambarka Taleefanka'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  placeholder={language === 'en' ? 'Enter your landline number' : 'Geli lambarka taleefankaaga'}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {language === 'en' ? 'First letter will be automatically capitalized' : 'Xarafka hore wuxuu noqon doonaa mid weyn'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Account Type' : 'Nooca Akoonka'}
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                <option value="customer">{language === 'en' ? 'Customer' : 'Macaamiil'}</option>
                <option value="company">{language === 'en' ? 'Business Partner (Requires Approval)' : 'La Shaqeeya Ganacsi (Waxay u baahan tahay ogolaansho)'}</option>
              </select>
              {formData.role === 'company' && (
                <p className="mt-2 text-xs text-amber-600 flex items-start gap-1">
                  <span className="font-bold mt-0.5">⚠️</span>
                  <span>
                    {language === 'en' 
                      ? 'Business partner accounts require admin approval before you can login.'
                      : 'Akoonada la-shaqeeya ganacsigu waxay u baahan yihiin oggolaansho maamule ka hor inta aadan gelin.'}
                  </span>
                </p>
              )}
            </div>


            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span>{language === 'en' ? 'Create Account' : 'Samee Akoon'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {language === 'en' ? 'Already have an account?' : 'Horey u haysid akoon?'}{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
              >
                {language === 'en' ? 'Sign in' : 'Gali'}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;