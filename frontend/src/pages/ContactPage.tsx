import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';

const ContactPage: React.FC = () => {
  const { language } = useTheme();

  const contactInfo = [
    {
      icon: Phone,
      title: language === 'en' ? 'Phone' : 'Telefoon',
      value: '+252 613 273 911',
      link: 'https://wa.me/252613273911',
      description: language === 'en' ? 'WhatsApp Available' : 'WhatsApp Waa La Heli Karaa'
    },
    {
      icon: Mail,
      title: language === 'en' ? 'Email' : 'Email',
      value: 'info@sahalcard.com',
      link: 'mailto:info@sahalcard.com',
      description: language === 'en' ? 'Send us an email' : 'Noo dir email'
    },
    {
      icon: MapPin,
      title: language === 'en' ? 'Location' : 'Goobta',
      value: language === 'en' ? 'Mogadishu, Somalia' : 'Muqdisho, Soomaaliya',
      link: '#',
      description: language === 'en' ? 'Visit our office' : 'Booqo xafiiska'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact SAHAL CARD - Get in Touch | Mogadishu, Somalia</title>
        <meta name="description" content="Contact SAHAL CARD for Sahal Card orders, business inquiries, or support. Phone: +252 613 273 911, Email: info@sahalcard.com" />
        <meta name="keywords" content="contact maandhise, somalia business contact, mogadishu office, sahacard support, business inquiries" />
        <meta name="author" content="SAHAL CARD" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maandhise.com/contact" />
        <meta property="og:title" content="Contact SAHAL CARD - Get in Touch" />
        <meta property="og:description" content="Contact SAHAL CARD for Sahal Card orders, business inquiries, or support. Phone: +252 613 273 911, Email: info@sahalcard.com" />
        <meta property="og:image" content="https://maandhise.com/og-contact.png" />
        <meta property="og:site_name" content="SAHAL CARD" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://maandhise.com/contact" />
        <meta property="twitter:title" content="Contact SAHAL CARD - Get in Touch" />
        <meta property="twitter:description" content="Contact SAHAL CARD for Sahal Card orders, business inquiries, or support. Phone: +252 613 273 911, Email: info@sahalcard.com" />
        <meta property="twitter:image" content="https://maandhise.com/og-contact.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://maandhise.com/contact" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            {language === 'en' ? 'Contact Us' : 'La Xidhiidh'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {language === 'en' 
              ? 'Get in touch with us for any questions, support, or business inquiries. We\'re here to help!'
              : 'La xidhiidh naga soo hadal su\'aalaha, taageerada, ama su\'aalaha ganacsiga. Waxaan halkan joognaa si aan ku caawino!'
            }
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {contactInfo.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: "easeOut" }}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm border border-white/50 hover:border-white/70 transition-all duration-500 hover:shadow-2xl"
            >
              <div className="relative p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <contact.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {contact.title}
                </h3>
                
                <a
                  href={contact.link}
                  target={contact.link.startsWith('http') ? '_blank' : '_self'}
                  rel={contact.link.startsWith('http') ? 'noopener noreferrer' : ''}
                  className="text-lg text-blue-600 hover:text-blue-700 font-semibold mb-2 block transition-colors duration-300"
                >
                  {contact.value}
                </a>
                
                <p className="text-gray-600 text-sm">
                  {contact.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
    </>
  );
};

export default ContactPage;
