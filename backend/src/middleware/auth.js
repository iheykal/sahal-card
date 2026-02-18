const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Marketer = require('../models/Marketer');
const mongoose = require('mongoose');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // DEBUG LOGS (Commented out to reduce noise unless needed)
    // console.log('[AUTH DEBUG] Request:', req.path);
    // console.log('[AUTH DEBUG] Auth Header:', authHeader ? 'Present' : 'Missing');

    if (!token) {
      console.log('[AUTH DEBUG] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // db connection check
    if (User.db.readyState !== 1) {
      console.error('[AUTH CRITICAL] User model not connected to DB! State:', User.db.readyState);
    }

    // Trim and cast ID explicitly
    let cleanUserId = userId.toString().trim();
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(cleanUserId);
    } catch (e) {
      console.error('[AUTH ERROR] Invalid ID format:', cleanUserId);
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Try finding via explicit _id query
    let user = await User.findOne({ _id: objectId });

    if (!user) {
      console.warn('[AUTH WARNING] Standard lookup failed. Attempting Scan Fallback...');
      const allUsers = await User.find({});
      user = allUsers.find(u => u._id.toString() === cleanUserId);
      if (user) {
        console.log('[AUTH SUCCESS] Recovered user via Scan Fallback!');
      }
    }

    if (user) {
      req.user = user;
      return next();
    }

    // If not found as user, try to find as marketer
    let marketer = await Marketer.findOne({ _id: objectId });

    if (!marketer) {
      const allMarketers = await Marketer.find({});
      marketer = allMarketers.find(m => m._id.toString() === cleanUserId);
    }

    if (marketer) {
      req.marketer = marketer;
      // Also set req.user with marketer profile for compatibility with authorize middleware
      req.user = { ...marketer.toObject(), role: 'marketer' };
      return next();
    }

    // Neither user nor marketer found
    console.log('[AUTH DEBUG] User/Marketer not found by ID:', cleanUserId);
    return res.status(401).json({
      success: false,
      message: `User not found (ID: ${cleanUserId})`
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user owns resource or is admin
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin and superadmin can access everything
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      try {
        const objectId = new mongoose.Types.ObjectId(decoded.userId);
        const user = await User.findOne({ _id: objectId }).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (e) {
        // ignore invalid ID in optional auth
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This would typically use express-rate-limit middleware
  // For now, we'll just pass through
  next();
};

// Check if user has active Sahal Card
const requireActiveCard = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const SahalCard = require('../models/SahalCard');
    const card = await SahalCard.findOne({
      userId: req.user._id,
      isActive: true,
      status: 'active'
    });

    if (!card) {
      return res.status(403).json({
        success: false,
        message: 'Active Sahal Card required'
      });
    }

    if (card.validUntil <= new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Sahal Card has expired. Please renew your card.'
      });
    }

    req.sahalCard = card;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking Sahal Card status',
      error: error.message
    });
  }
};

// Company role removed - companies are now independent entities
// This middleware is no longer needed since companies don't require user accounts
const requireVerifiedCompany = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Company role no longer exists. Companies are independent entities.'
  });
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeOwnerOrAdmin,
  optionalAuth,
  authRateLimit,
  requireActiveCard,
  requireVerifiedCompany
};
