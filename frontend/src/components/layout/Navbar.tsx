import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  LogOut,
  CreditCard,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useTheme } from '../../contexts/ThemeContext.tsx';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuTimeout, setUserMenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { language } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (userMenuTimeout) {
        clearTimeout(userMenuTimeout);
      }
    };
  }, [userMenuTimeout]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { name: language === 'en' ? 'Home' : 'Guriga', href: '#home', id: 'home' },
    { name: language === 'en' ? 'About' : 'Ku Saabsan', href: '#about', id: 'about' },
    { name: language === 'en' ? 'Services' : 'Adeegaha', href: '#services', id: 'services' },
    { name: language === 'en' ? 'Sahal Card' : 'Kaarka Sahal', href: '#sahal-card', id: 'sahal-card' },
    { name: language === 'en' ? 'Contact' : 'La Xidhiidh', href: '#contact', id: 'contact' },
  ];

  // Handle navigation click
  const handleNavClick = (item: any) => {
    // If we're on the main page (home route), scroll to section
    if (location.pathname === '/' || location.pathname === '') {
      const element = document.getElementById(item.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page (like dashboard), navigate to home first
      navigate('/');
      // Then scroll to the section after a short delay
      setTimeout(() => {
        const element = document.getElementById(item.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-20">
          {/* Logo - Centered */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <img
              src="/icons/discount.png"
              alt="SAHAL CARD Logo"
              className="h-12 w-12 md:h-14 md:w-14 object-contain"
            />
            <span className="hidden md:block text-xl font-bold gradient-text">SAHAL CARD</span>
          </Link>

          {/* Desktop Navigation - Left */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item)}
                className="nav-link"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4 ml-auto">

            {/* Authentication */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                {/* User Menu */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (userMenuTimeout) {
                      clearTimeout(userMenuTimeout);
                      setUserMenuTimeout(null);
                    }
                    setIsUserMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => {
                      setIsUserMenuOpen(false);
                    }, 150); // 150ms delay before closing
                    setUserMenuTimeout(timeout);
                  }}
                >
                  <button className="flex items-center space-x-2 p-2 rounded-lg glass-button hover:bg-white/30 transition-all duration-300">
                    {user?.role === 'superadmin' ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-lg">
                        <img
                          src="/icons/founder.jpeg"
                          alt="Founder"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user?.fullName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 transition-all duration-300 ${isUserMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    }`}>
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{language === 'en' ? 'Dashboard' : 'Dashboard'}</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                      >
                        <Settings className="w-4 h-4" />
                        <span>{language === 'en' ? 'Profile' : 'Profile'}</span>
                      </Link>
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{language === 'en' ? 'Logout' : 'Ka Bixi'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg glass-button hover:bg-white/30 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/90 backdrop-blur-lg border-t border-white/20"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    handleNavClick(item);
                    setIsOpen(false); // Close mobile menu after click
                  }}
                  className="block w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                >
                  {item.name}
                </button>
              ))}

              {!isAuthenticated && (
                <>
                  <hr className="my-2 border-gray-200" />
                  <Link
                    to="/login"
                    className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                  >
                    {language === 'en' ? 'Login' : 'Gali'}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;