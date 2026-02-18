import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Share2, Play, Pause } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.tsx';

const GalleryPage: React.FC = () => {
  const { language } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gallery images - all images from icons folder
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
  ];

  const openModal = (image: string, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    setIsPlaying(false); // Stop slideshow when modal opens
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsPlaying(false); // Stop slideshow when modal closes
  };

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(galleryImages[prevIndex]);
  };

  const toggleSlideshow = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSwipe = (event: any, info: PanInfo) => {
    const threshold = 100; // Minimum swipe distance
    const velocity = info.velocity.x;

    // Check both distance and velocity for better swipe detection
    if ((info.offset.x > threshold || velocity > 500) && info.offset.x > 0) {
      // Swipe right - go to previous image
      prevImage();
    } else if ((info.offset.x < -threshold || velocity < -500) && info.offset.x < 0) {
      // Swipe left - go to next image
      nextImage();
    }
  };

  // Auto-play slideshow effect
  useEffect(() => {
    if (isPlaying && selectedImage) {
      intervalRef.current = setInterval(() => {
        nextImage();
      }, 1000); // 1 second per image
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, selectedImage, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!selectedImage) return;

      switch (event.key) {
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case 'Escape':
          closeModal();
          break;
        case ' ':
          event.preventDefault();
          toggleSlideshow();
          break;
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedImage, currentIndex]);

  const downloadImage = (imageName: string) => {
    const link = document.createElement('a');
    link.href = `/icons/${imageName}`;
    link.download = imageName;
    link.click();
  };

  const shareImage = async (imageName: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Maandhise Gallery',
          text: 'Check out this image from Maandhise Gallery',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            {language === 'en' ? 'Our Gallery' : 'Gallery-ga'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {language === 'en'
              ? 'Explore our collection of moments, achievements, and memories that showcase the journey of SAHAL CARD'
              : 'Baaritaan ururka wakhtiyada, guulaha, iyo xusuusta oo muujinaya socodka SAHAL CARD'
            }
          </p>
        </motion.div>

        {/* Gallery Grid - Larger images with fewer columns */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={image}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
              onClick={() => openModal(image, index)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white">
                <img
                  src={`/icons/${image}`}
                  alt={`SAHAL CARD gallery ${index + 1} - showcasing our community events, achievements, and business activities`}
                  className="w-full h-auto min-h-[20rem] sm:min-h-[24rem] md:min-h-[28rem] lg:min-h-[32rem] xl:min-h-[36rem] object-cover bg-gradient-to-br from-blue-50 to-indigo-100 transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('1.jpeg')) return;
                    target.src = `/icons/1.jpeg`; // Fallback image
                    target.onerror = null;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        {language === 'en' ? 'View Image' : 'Fiiri Sawirka'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareImage(image);
                          }}
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                        >
                          <Share2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 md:mt-20 text-center"
        >
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div className="glass-card p-3 sm:p-4 md:p-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                {galleryImages.length}
              </div>
              <div className="text-gray-600 text-xs sm:text-sm md:text-base">
                {language === 'en' ? 'Images' : 'Sawirrada'}
              </div>
            </div>
            <div className="glass-card p-3 sm:p-4 md:p-6">
              <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                2021-25
              </div>
              <div className="text-gray-600 text-xs sm:text-sm md:text-base">
                {language === 'en' ? 'Timeline' : 'Wakhtiga'}
              </div>
            </div>
            <div className="glass-card p-3 sm:p-4 md:p-6">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                100%
              </div>
              <div className="text-gray-600 text-xs sm:text-sm md:text-base">
                {language === 'en' ? 'Quality' : 'Tayada'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gallery-modal fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-6xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Container with Swipe Support */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -200, right: 200 }}
                dragElastic={0.1}
                onDragEnd={handleSwipe}
                className="relative cursor-grab active:cursor-grabbing"
                whileDrag={{ scale: 0.98 }}
              >
                <motion.img
                  key={currentIndex}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.3
                  }}
                  src={`/icons/${selectedImage}`}
                  alt={`SAHAL CARD gallery ${currentIndex + 1} - showcasing our community events and business achievements`}
                  className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl select-none"
                  draggable={false}
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('1.jpeg')) return;
                    target.src = `/icons/1.jpeg`; // Fallback image
                    target.onerror = null;
                  }}
                />
              </motion.div>
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 z-10"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Play/Pause Button */}
              <button
                onClick={toggleSlideshow}
                className="absolute -top-12 right-16 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 z-10"
                title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200 z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>


              {/* Image Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      {language === 'en' ? 'Image' : 'Sawirka'} {currentIndex + 1} {language === 'en' ? 'of' : 'ka mid ah'} {galleryImages.length}
                    </div>
                    <div className="text-white/70 text-sm">
                      {selectedImage}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadImage(selectedImage)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => shareImage(selectedImage)}
                      className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
