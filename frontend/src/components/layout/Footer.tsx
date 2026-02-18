import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.tsx';

const Footer: React.FC = () => {
  const { language } = useTheme();

  return (
    <footer className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Company Info */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold">SAHAL CARD</span>
            </div>
            <p className="text-blue-100 text-sm text-center md:text-left max-w-xs">
              {language === 'en' 
                ? 'Uniting Education, Consulting & Savings for a better future.'
                : 'Waxbarasho, La Taliye & Keydin wada jirka ah si loo helo mustaqbal wanaagsan.'
              }
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Quick Links' : 'Xiriirrada Dhaqso'}
            </h3>
            <div className="space-y-2">
              <a href="#about" className="block text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                {language === 'en' ? 'About Us' : 'Ku Saabsan'}
              </a>
              <a href="#services" className="block text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                {language === 'en' ? 'Services' : 'Adeegaha'}
              </a>
              <a href="#sahal-card" className="block text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                {language === 'en' ? 'Sahal Card' : 'Kaarka Sahal'}
              </a>
              <a href="#contact" className="block text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                {language === 'en' ? 'Contact' : 'La Xidhiidh'}
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Contact Info' : 'Macluumaadka Xiriirka'}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <Phone className="w-4 h-4 text-blue-200" />
                <a href="https://wa.me/252613273911" className="text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                  +252 613 273 911
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <Mail className="w-4 h-4 text-blue-200" />
                <a href="mailto:info@sahalcard.com" className="text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                  info@sahalcard.com
                </a>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <MapPin className="w-4 h-4 text-blue-200" />
                <span className="text-blue-100 text-sm">
                  {language === 'en' ? 'Mogadishu, Somalia' : 'Muqdisho, Soomaaliya'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-blue-100 text-sm">
              © 2025 SAHAL CARD. {language === 'en' ? 'All rights reserved.' : 'Dhammaan xuquuqda way dhowran yihiin.'}
            </div>
            <div className="text-blue-100 text-sm">
              {language === 'en' ? 'Made with ❤️ in Somalia' : 'Loo sameeyay ❤️ Soomaaliya'}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;