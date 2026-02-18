const express = require('express');
const router = express.Router();
const { markAsValid, markAsInvalid, getAllPaymentStatus, getPaymentSummary } = require('../controllers/simplePaymentController');
const { authenticateToken } = require('../middleware/auth');

// Mark user as valid
router.post('/mark-valid', authenticateToken, markAsValid);

// Mark user as invalid
router.post('/mark-invalid', authenticateToken, markAsInvalid);

// Get all users with payment status
router.get('/status', authenticateToken, getAllPaymentStatus);

// Get payment summary
router.get('/summary', authenticateToken, getPaymentSummary);

module.exports = router;
