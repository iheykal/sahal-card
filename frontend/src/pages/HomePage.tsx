import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  // CreditCard, 
  // GraduationCap, 
  // Users, 
  // TrendingUp,
  ArrowRight,
  // Star,
  // CheckCircle,
  // Globe,
  // Shield
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';

const HomePage: React.FC = () => {
  const { language } = useTheme();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Gallery images (same as in GalleryPage) - all images from icons folder
  const galleryImages = [
    // Original numbered images
    '1.jpeg',
    '2.jpeg',
    '3.jpeg',
    '4.jpeg',
    '5.jpeg',
    '6.jpeg',
    // Facebook event images
    '489577276_1242317374568893_4520953705150057931_n.jpg',
    '489776852_1243241001143197_2484832212153513724_n.jpg',
    '491830696_1250859123714718_6104288111010466881_n.jpg',
    '493272461_1260164816117482_3758469469945750571_n.jpg',
    '493468150_1260164906117473_8939871710073352573_n.jpg',
    '493737095_1260164909450806_6666939914771122798_n.jpg',
    '494005379_1260164856117478_6368702701761718367_n.jpg',
    '494090496_1260164956117468_2785811314254096813_n.jpg',
    '494096869_1262457895888174_7346350511475005594_n.jpg',
    '494584536_1262457962554834_7258760863938959064_n.jpg',
    '494669375_1262457699221527_9135505405175271809_n.jpg',
    '494764138_1262457705888193_7459558796317442054_n.jpg',
    '499813782_1284139160386714_6859996329049751199_n.jpg',
    '515299272_1320713926729237_2503452342838229368_n.jpg',
    // Other gallery images
    '00aad105-eacb-4ffd-a787-042fb0927e77.jpeg',
    '11c8c64e-29cd-428e-b8f1-251076ec3cb6.jpeg',
    '8c907007-cf72-4d96-b91e-05026f758602.jpeg',
    'c380bb4d-80b5-48ca-ba29-752e3bd67c17.jpeg',
    'maandhise.jpg',
  ];

  // Auto-swipe functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [galleryImages.length]);


  const stats = [
    { number: '10,000+', label: language === 'en' ? 'Our Clients' : 'Macamiisha' },
    { number: '100%', label: language === 'en' ? 'Customer Satisfaction' : 'Raalli Galin' },
  ];

  return (
    <>
      <Helmet>
        <title>SAHAL CARD - Save More, Spend Less | Somalia's Leading Discount Card</title>
        <meta name="description" content="Join 10,000+ Somalis saving with Sahal Card. Get exclusive discounts at 500+ partner businesses across Somalia. Education, consulting & savings solutions." />
        <meta name="keywords" content="maandhise, sahacard, discount card, somalia, mogadishu, savings, education, consulting, business" />
        <meta name="author" content="SAHAL CARD" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maandhise.com/" />
        <meta property="og:title" content="SAHAL CARD - Save More, Spend Less" />
        <meta property="og:description" content="Join 10,000+ Somalis saving with Sahal Card. Get exclusive discounts at 500+ partner businesses across Somalia." />
        <meta property="og:image" content="https://maandhise.com/og-home.png" />
        <meta property="og:site_name" content="SAHAL CARD" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://maandhise.com/" />
        <meta property="twitter:title" content="SAHAL CARD - Save More, Spend Less" />
        <meta property="twitter:description" content="Join 10,000+ Somalis saving with Sahal Card. Get exclusive discounts at 500+ partner businesses across Somalia." />
        <meta property="twitter:image" content="https://maandhise.com/og-home.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://maandhise.com/" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SAHAL CARD",
            "description": "Uniting Education, Consulting & Savings for a better future in Somalia",
            "url": "https://maandhise.com",
            "logo": "https://maandhise.com/logo.png",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+252-613-273-911",
              "contactType": "customer service",
              "availableLanguage": ["English", "Somali"]
            },
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Mogadishu",
              "addressCountry": "Somalia"
            },
            "sameAs": [
              "https://wa.me/252613273911"
            ],
            "foundingDate": "2021",
            "founder": {
              "@type": "Person",
              "name": "Abdullahi Abdi Elmi"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        {/* Hero Section */}
        <div className="h-screen flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
              <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
              <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
            </div>


            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Main Heading */}
                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="text-2xl md:text-4xl lg:text-5xl font-bold"
                  >
                    <span className="gradient-text">
                      {language === 'en' ? 'SAHAL CARD' : 'SAHAL CARD'}
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
                  >
                    {language === 'en'
                      ? 'Uniting Education, Consulting & Savings for a better future in Somalia'
                      : 'Waxbarasho, La Taliye & Keydin wada jirka ah si loo helo mustaqbal wanaagsan Soomaaliya'
                    }
                  </motion.p>
                </div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-3 justify-center items-center"
                >
                  <button
                    onClick={() => navigate('/get-sahal-card')}
                    className="btn-primary text-base px-6 py-3 flex items-center space-x-2 group"
                  >
                    <span>{language === 'en' ? 'Get Sahal Card' : 'Hel Kaarka Sahal'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>

                  <button
                    onClick={() => navigate('/tixraac')}
                    className="btn-primary text-base px-6 py-3 flex items-center space-x-2 group"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>🚖 Tixraac Gaadiid</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>

                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
                >
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xl md:text-2xl font-bold gradient-text mb-1">
                        {stat.number}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Gallery Section Below Hero */}
        <div className="py-16 bg-white/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-3">
                {language === 'en' ? 'Our Gallery' : 'Gallery-ga'}
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                {language === 'en'
                  ? 'Explore our collection of moments and achievements'
                  : 'Baaritaan ururka wakhtiyada iyo guulaha'
                }
              </p>
            </motion.div>

            <div className="relative max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-xl">
                {/* Gallery Container */}
                <div className="relative h-80 md:h-96">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={currentImageIndex}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-0"
                    >
                      <img
                        src={`/icons/${galleryImages[currentImageIndex]}`}
                        alt={`SAHAL CARD gallery ${currentImageIndex + 1} - showcasing our achievements and community events`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.src = `/icons/maandhise.jpg`; // Fallback image
                          target.onerror = null; // Prevent infinite loop
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress Dots */}
                  <div className="absolute bottom-4 right-4 flex space-x-1.5">
                    {galleryImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                          ? 'bg-white scale-125'
                          : 'bg-white/50 hover:bg-white/70'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </>
  );
};

export default HomePage;