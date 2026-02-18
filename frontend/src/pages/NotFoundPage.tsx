import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';

const NotFoundPage: React.FC = () => {
  const { language } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl mx-auto"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-9xl font-bold gradient-text">404</div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {language === 'en' ? 'Page Not Found' : 'Bogga Lagu Heli Karo'}
          </h1>
          <p className="text-xl text-gray-600">
            {language === 'en' 
              ? 'Sorry, the page you are looking for does not exist.'
              : 'Ka xumahay, bogga aad raadinaysid ma jiro.'
            }
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/"
            className="btn-primary flex items-center justify-center space-x-2 group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>{language === 'en' ? 'Go Home' : 'Tag Guriga'}</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center space-x-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>{language === 'en' ? 'Go Back' : 'Dib U Noqo'}</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;