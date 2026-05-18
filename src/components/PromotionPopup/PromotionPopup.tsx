import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './PromotionPopup.css';

// Importing assets
import popupImage1 from '../../assets/popupimage1.png';
import popupImage2 from '../../assets/popupimage2.png';

const PromotionPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the popup has been shown in this session
    const hasBeenShown = sessionStorage.getItem('promotion_popup_shown');
    
    if (!hasBeenShown) {
      // Show popup after a small delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('promotion_popup_shown', 'true');
  };

  const handleExplore = () => {
    handleClose();
    navigate('/indian-restaurant-menu');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="promo-overlay" onClick={handleClose}>
          <motion.div 
            className="promo-modal"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="promo-close" onClick={handleClose} aria-label="Close">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            <div className="promo-image-top">
              <img src={popupImage2} alt="Special Menu" />
            </div>

            <div className="promo-content">
              <h2 className="promo-title">SNACK SPECIAL LAUNCH OFFER</h2>
              <p className="promo-description">
                Get each item for just $4.99
              </p>
              
              <div className="promo-footer">
                <button className="promo-btn" onClick={handleExplore}>
                  EXPLORE MENU
                </button>
              </div>
            </div>

            <div className="promo-decoration">
              <img src={popupImage1} alt="decoration" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PromotionPopup;
