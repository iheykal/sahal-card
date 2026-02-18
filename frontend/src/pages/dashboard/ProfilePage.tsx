import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import CountdownTimer from '../../components/common/CountdownTimer.tsx';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useTheme();

  // Debug logging
  React.useEffect(() => {
    console.log('ProfilePage - User object:', user);
    console.log('ProfilePage - validUntil:', user?.validUntil);
    console.log('ProfilePage - validUntil type:', typeof user?.validUntil);
    console.log('ProfilePage - validUntil exists?', !!user?.validUntil);
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            {language === 'en' ? 'Profile Settings' : 'Dejinta Profile'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {language === 'en'
              ? 'Manage your personal information and account settings.'
              : 'Maamul macluumaadkaaga shakhsiyeed iyo dejinta akoonka.'
            }
          </p>
        </motion.div>

        <div className="glass-card p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'en' ? 'Personal Information' : 'Macluumaadka Shakhsiyeed'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Full Name' : 'Magaca Buuxa'}
              </label>
              <p className="text-gray-900">{user?.fullName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Email' : 'Email'}
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Phone' : 'Telefoon'}
              </label>
              <p className="text-gray-900">{user?.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'ID Number' : 'Lambarka Aqoonsiga'}
              </label>
              <p className="text-gray-900">{user?.idNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Location' : 'Goobta'}
              </label>
              <p className="text-gray-900">{user?.location}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'en' ? 'Account Type' : 'Nooca Akoonka'}
              </label>
              <p className="text-gray-900 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Countdown Timer Section - Always visible for debugging */}
        <div className="mt-8">
          {(() => {
            console.log('ProfilePage render - user?.validUntil:', user?.validUntil);
            console.log('ProfilePage render - user object keys:', user ? Object.keys(user) : 'no user');

            // Check if validUntil exists and is not null/undefined/empty
            const hasValidUntil = user?.validUntil &&
              user.validUntil !== null &&
              user.validUntil !== undefined &&
              user.validUntil !== '';

            console.log('ProfilePage render - hasValidUntil:', hasValidUntil);

            return hasValidUntil ? (
              <CountdownTimer
                endDate={user.validUntil}
                language={language}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 md:p-12"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-4xl mb-4 inline-block"
                  >
                    ⏳
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {language === 'en' ? 'Membership Status' : 'Xaaladda Kansuugga'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'en'
                      ? 'No expiration date set. Please contact an administrator to set up your membership.'
                      : 'Taariikhda dhacaadka lama dejiyo. Fadlan la xidhiidh maamule si aad kansuuggaaga u dejiso.'}
                  </p>
                  {/* Debug info - remove in production */}
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
                    <p className="font-semibold mb-2">Debug Info:</p>
                    <p>User exists: {user ? 'Yes' : 'No'}</p>
                    <p>validUntil value: {user?.validUntil ? String(user.validUntil) : 'null/undefined'}</p>
                    <p>validUntil type: {user?.validUntil ? typeof user.validUntil : 'N/A'}</p>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </div>

        <div className="glass-card p-8 md:p-12 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'en' ? 'ID Card Image' : 'Sawirka Kaarka Aqoonsiga'}
          </h2>
          {user?.idCardImageUrl ? (
            <img
              src={user.idCardImageUrl}
              alt="ID Card"
              className="w-full max-w-sm mx-auto rounded-lg shadow-lg object-contain bg-gray-50"
            />
          ) : (
            <p className="text-gray-600">
              {language === 'en' ? 'No ID image available' : 'Sawirka aqoonsiga lama hayo'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;