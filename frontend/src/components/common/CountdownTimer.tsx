import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  endDate: string | Date;
  language?: 'en' | 'so';
  onExpired?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  endDate, 
  language = 'en',
  onExpired,
  className = ''
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('CountdownTimer - Props received:', {
      endDate,
      endDateType: typeof endDate,
      endDateIsDate: endDate instanceof Date,
      language
    });
  }, [endDate, language]);

  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      try {
        const now = new Date().getTime();
        const endDateObj = endDate instanceof Date ? endDate : new Date(endDate);
        
        // Check if date is valid
        if (isNaN(endDateObj.getTime())) {
          console.error('CountdownTimer: Invalid date provided:', endDate);
          setTimeRemaining({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true
          });
          return;
        }
        
        const end = endDateObj.getTime();
        const difference = end - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        if (onExpired) {
          onExpired();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
      } catch (error) {
        console.error('CountdownTimer: Error calculating time remaining:', error);
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate, onExpired]);

  if (timeRemaining.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${className} bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl w-full`}
      >
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl sm:text-3xl md:text-4xl mb-2"
          >
            ⏰
          </motion.div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 px-2">
            {language === 'en' ? 'Membership Expired' : 'Kansuugguu dhacay'}
          </h3>
          <p className="text-xs sm:text-sm opacity-90 px-2 leading-tight">
            {language === 'en' 
              ? 'Please renew your membership to continue using the service.'
              : 'Fadlan dib u cusbooneysii kansuuggaaga si aad adeegga ugu sii waddo.'}
          </p>
        </div>
      </motion.div>
    );
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <motion.div
      className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1"
      >
        {value.toString().padStart(2, '0')}
      </motion.span>
      <span className="text-[10px] sm:text-xs md:text-sm text-white/80 font-medium uppercase tracking-wide sm:tracking-wider leading-tight">
        {label}
      </span>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className} bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl w-full`}
    >
      <div className="text-center mb-4 sm:mb-5 md:mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 inline-block"
        >
          ⏳
        </motion.div>
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 px-2">
          {language === 'en' ? 'Membership Expires In' : 'Kansuugguu dhamaan karo'}
        </h3>
        <p className="text-xs sm:text-sm text-white/80 px-2">
          {language === 'en'
            ? 'Time remaining until your membership expires'
            : 'Waqtiga ka haray kansuuggaagu dhamaanayo'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
        <TimeUnit
          value={timeRemaining.days}
          label={language === 'en' ? 'Days' : 'Maalmo'}
        />
        <TimeUnit
          value={timeRemaining.hours}
          label={language === 'en' ? 'Hours' : 'Saacadaha'}
        />
        <TimeUnit
          value={timeRemaining.minutes}
          label={language === 'en' ? 'Minutes' : 'Daqiiqooyin'}
        />
        <TimeUnit
          value={timeRemaining.seconds}
          label={language === 'en' ? 'Seconds' : 'Ilbiriqsi'}
        />
      </div>

      <div className="mt-3 sm:mt-4 text-center px-2">
        <p className="text-[10px] sm:text-xs text-white/70 leading-tight break-words">
          {language === 'en'
            ? `Expires on: ${new Date(endDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`
            : `Dhamaanayaa: ${new Date(endDate).toLocaleDateString('so-SO', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`}
        </p>
      </div>
    </motion.div>
  );
};

export default CountdownTimer;

