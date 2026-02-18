import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../contexts/ThemeContext.tsx';
import {
  CreditCard,
  GraduationCap,
  Briefcase
} from 'lucide-react';

const ServicesPage: React.FC = () => {
  const { language } = useTheme();

  return (
    <>
      <Helmet>
        <title>Our Services - Sahal Card, Education & Business Consulting | Maandhise</title>
        <meta name="description" content="Discover Maandhise's comprehensive services: Sahal discount card, quality education programs, and professional business consulting across Somalia." />
        <meta name="keywords" content="maandhise services, sahacard, education somalia, business consulting, discount card, somalia business services" />
        <meta name="author" content="SAHAL CARD" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maandhise.com/services" />
        <meta property="og:title" content="Our Services - Sahal Card, Education & Business Consulting" />
        <meta property="og:description" content="Discover Maandhise's comprehensive services: Sahal discount card, quality education programs, and professional business consulting across Somalia." />
        <meta property="og:image" content="https://maandhise.com/og-services.png" />
        <meta property="og:site_name" content="SAHAL CARD" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://maandhise.com/services" />
        <meta property="twitter:title" content="Our Services - Sahal Card, Education & Business Consulting" />
        <meta property="twitter:description" content="Discover Maandhise's comprehensive services: Sahal discount card, quality education programs, and professional business consulting across Somalia." />
        <meta property="twitter:image" content="https://maandhise.com/og-services.png" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://maandhise.com/services" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        </div>
      </div>
    </>
  );
};

export default ServicesPage;