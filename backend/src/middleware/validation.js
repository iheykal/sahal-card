const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('role')
    .optional()
    .isIn(['customer'])
    .withMessage('Role must be customer'),

  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Admin user creation validation
const validateAdminUserCreation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('phone')
    .matches(/^\+252\d{9}$/)
    .withMessage('Please provide a valid Somali phone number (+252XXXXXXXXX)'),



  body('registrationDate')
    .optional()
    .isISO8601()
    .withMessage('registrationDate must be a valid date (ISO8601)'),

  body('amount')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('amount must be an integer between 1 and 120 (months)'),

  body('role')
    .optional()
    .isIn(['customer', 'admin', 'superadmin'])
    .withMessage('Role must be customer, admin, or superadmin'),

  handleValidationErrors
];

// Sahal Card registration validation
const validateSahalCardRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('idNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('ID number must be between 5 and 20 characters'),

  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  body('paymentMethod')
    .isIn(['card', 'mobile'])
    .withMessage('Payment method must be either card or mobile'),

  handleValidationErrors
];

// Company registration validation
const validateCompanyRegistration = [
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('businessType')
    .isIn([
      'pharmacy', 'supermarket', 'restaurant', 'clothing', 'electronics',
      'beauty', 'healthcare', 'automotive', 'education', 'services', 'furniture',
      'telecommunication', 'travelagency', 'other'
    ])
    .withMessage('Invalid business type'),

  body('discountRate')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount rate must be between 1% and 100%'),

  body('branches')
    .isArray({ min: 1 })
    .withMessage('At least one branch is required'),

  body('branches.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Branch name must be between 2 and 100 characters'),

  body('branches.*.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Branch address must be between 5 and 200 characters'),

  body('branches.*.phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number for branch'),

  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact email'),

  body('contactInfo.phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid contact phone number'),

  handleValidationErrors
];

// Transaction validation
const validateTransaction = [
  body('companyId')
    .isMongoId()
    .withMessage('Valid company ID is required'),

  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('discount')
    .isFloat({ min: 0 })
    .withMessage('Discount cannot be negative'),

  body('savings')
    .isFloat({ min: 0 })
    .withMessage('Savings cannot be negative'),

  body('originalAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Original amount must be greater than 0'),

  body('discountRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount rate must be between 0% and 100%'),

  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'mobile', 'other'])
    .withMessage('Invalid payment method'),

  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),

  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isAlpha()
    .withMessage('Sort field must contain only letters'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),

  handleValidationErrors
];

// File upload validation - accepts any image format by default
const validateFileUpload = (fieldName, checkImageType = true) => [
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`
      });
    }

    // Accept any image format
    if (checkImageType && !req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
      });
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 5MB'
      });
    }

    next();
  }
];

// Update profile validation
const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),

  handleValidationErrors
];

// Payment validation
const validatePayment = [
  body('cardNumber')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Card number is required'),

  body('paymentMethod')
    .isIn(['mobile_money', 'bank_transfer', 'cash'])
    .withMessage('Payment method must be mobile_money, bank_transfer, or cash'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),

  handleValidationErrors
];

// Manual payment validation
const validateManualPayment = [
  body('cardNumber')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Card number is required'),

  body('paymentMethod')
    .optional()
    .isIn(['mobile_money', 'bank_transfer', 'cash'])
    .withMessage('Payment method must be mobile_money, bank_transfer, or cash'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  handleValidationErrors
];

// Flexible payment validation
const validateFlexiblePayment = [
  body('cardNumber')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Card number is required'),

  body('amount')
    .isFloat({ min: 0.01, max: 120 })
    .withMessage('Amount must be between $0.01 and $120 (maximum 120 months)'),

  body('paymentMethod')
    .optional()
    .isIn(['mobile_money', 'bank_transfer', 'cash'])
    .withMessage('Payment method must be mobile_money, bank_transfer, or cash'),

  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Transaction ID must be between 1 and 100 characters'),

  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateAdminUserCreation,
  validateSahalCardRegistration,
  validateCompanyRegistration,
  validateTransaction,
  validateObjectId,
  validatePagination,
  validateFileUpload,
  validateProfileUpdate,
  validatePasswordChange,
  validatePayment,
  validateManualPayment,
  validateFlexiblePayment
};
