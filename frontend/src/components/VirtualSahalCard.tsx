import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Phone, QrCode, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';

interface VirtualSahalCardProps {
  cardNumber?: string;
  expiryDate?: string;
  className?: string;
}

const VirtualSahalCard: React.FC<VirtualSahalCardProps> = ({ 
  cardNumber = "ID.001", 
  expiryDate = "2026/12/31",
  className = ""
}) => {
  const { language } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`relative w-80 h-48 mx-auto ${className}`}
      style={{ 
        perspective: '1000px',
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {/* Interactive Controls */}
      <div className="absolute -top-12 left-0 right-0 flex justify-center gap-2 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleFlip}
          className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          {isFlipped ? 'Front' : 'Back'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleDetails}
          className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors duration-200 flex items-center gap-1"
        >
          {showDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showDetails ? 'Hide' : 'Details'}
        </motion.button>
      </div>

      {/* Card Container */}
      <motion.div 
        className="relative w-full h-full rounded-2xl shadow-2xl overflow-hidden transform-gpu"
        animate={{ 
          rotateY: isFlipped ? 180 : 0,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ 
          duration: 0.6, 
          ease: "easeInOut",
          scale: { duration: 0.2 }
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl">
            {/* Left Section (Blue) - 2/3 of card */}
            <div className="absolute left-0 top-0 w-2/3 h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-l-2xl">
              {/* Company Name */}
              <motion.div 
                className="absolute top-3 left-4 text-white text-xs font-medium opacity-90"
                animate={{ opacity: showDetails ? 1 : 0.9 }}
                transition={{ duration: 0.3 }}
              >
                SAHAL CARD SOMALIA
              </motion.div>
              
              {/* Phone Number */}
              <motion.div 
                className="absolute top-12 left-4 flex items-center gap-2 text-white"
                animate={{ scale: showDetails ? 1.05 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Phone className="w-3 h-3" />
                <span className="text-sm font-medium">+252 613 273 911</span>
              </motion.div>
              
              {/* Benefits List */}
              <motion.div 
                className="absolute top-20 left-4 space-y-2"
                animate={{ y: showDetails ? -5 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="flex items-center gap-2 text-white text-sm"
                  whileHover={{ x: 5, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                  ></motion.div>
                  <span className="font-medium">Keyd badan</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-white text-sm"
                  whileHover={{ x: 5, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  ></motion.div>
                  <span className="font-medium">Kharash Yar</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-white text-sm"
                  whileHover={{ x: 5, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  ></motion.div>
                  <span className="font-medium">Save more</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 text-white text-sm"
                  whileHover={{ x: 5, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                  ></motion.div>
                  <span className="font-medium">Spend less</span>
                </motion.div>
              </motion.div>
              
              {/* Orange Vertical Bar */}
              <motion.div 
                className="absolute right-0 top-16 w-1 h-20 bg-orange-400 rounded-l-full"
                animate={{ scaleY: showDetails ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              ></motion.div>
            </div>
            
            {/* Right Section (White) - 1/3 of card */}
            <div className="absolute right-0 top-0 w-1/3 h-full bg-white rounded-r-2xl">
              {/* QR Code Placeholder */}
              <motion.div 
                className="absolute top-16 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <QrCode className="w-6 h-6 text-white" />
              </motion.div>
              
              {/* Subtle Grid Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '8px 8px'
                }}></div>
              </div>
            </div>
            
            {/* Bottom Section - Card Title */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-b-2xl flex flex-col justify-center items-center"
              animate={{ y: showDetails ? -2 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-white font-bold text-sm tracking-wide">
                SAHAL DISCOUNT CARD
              </div>
              <div className="text-blue-200 text-xs font-medium">
                BY SAHAL CARD
              </div>
            </motion.div>
            
            {/* Card Number */}
            <motion.div 
              className="absolute top-4 right-4 text-blue-800 font-bold text-lg"
              animate={{ scale: showDetails ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {cardNumber}
            </motion.div>
            
            {/* Expiry Date */}
            <motion.div 
              className="absolute bottom-4 right-4 text-blue-800 text-xs font-medium"
              animate={{ opacity: showDetails ? 1 : 0.8 }}
              transition={{ duration: 0.3 }}
            >
              EXP {expiryDate}
            </motion.div>
            
            {/* Dynamic Shine Effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-2xl"
              animate={{ 
                background: isHovered 
                  ? 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 50%, transparent 100%)'
                  : 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)'
              }}
              transition={{ duration: 0.3 }}
            ></motion.div>
            
            {/* Card Border */}
            <motion.div 
              className="absolute inset-0 border-2 border-white/20 rounded-2xl"
              animate={{ 
                borderColor: isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                boxShadow: isHovered 
                  ? '0 0 20px rgba(59, 130, 246, 0.5)' 
                  : '0 0 0px rgba(59, 130, 246, 0)'
              }}
              transition={{ duration: 0.3 }}
            ></motion.div>
          </div>
        </div>

        {/* Back of Card */}
        <div 
          className="absolute inset-0 w-full h-full" 
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl">
            {/* Magnetic Strip */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black rounded-t-2xl"></div>
            
            {/* Signature Panel */}
            <div className="absolute top-12 left-4 right-4 h-16 bg-white rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-xs font-medium">
                {language === 'en' ? 'Authorized Signature' : 'Saaxiibka La Ogol yahay'}
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div className="absolute top-32 left-4 right-4 text-white text-xs space-y-1">
              <div className="font-bold text-sm mb-2">TERMS & CONDITIONS</div>
              <div>• Valid at participating merchants only</div>
              <div>• Cannot be combined with other offers</div>
              <div>• Subject to availability</div>
              <div>• SAHAL CARD reserves all rights</div>
            </div>
            
            {/* Customer Service */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <div className="text-white text-xs">
                <div className="font-bold">Customer Service</div>
                <div>+252 613 273 911</div>
                <div className="text-gray-400">www.maandhise.com</div>
              </div>
            </div>
            
            {/* Back Border */}
            <div className="absolute inset-0 border-2 border-gray-600/30 rounded-2xl"></div>
          </div>
        </div>
      </motion.div>
      
      {/* Enhanced Card Reflection */}
      <motion.div 
        className="absolute -bottom-2 left-2 right-2 h-4 bg-gradient-to-t from-black/20 to-transparent rounded-b-2xl blur-sm"
        animate={{ 
          opacity: isHovered ? 0.4 : 0.2,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ duration: 0.3 }}
      ></motion.div>

      {/* Floating Particles Effect */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              initial={{ 
                x: Math.random() * 320, 
                y: Math.random() * 192,
                opacity: 0 
              }}
              animate={{ 
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default VirtualSahalCard;
