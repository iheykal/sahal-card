const express = require('express');
const router = express.Router();
const { processMonthlyPayment, getPaymentStatus, getPaymentHistory, recordManualPayment, processFlexiblePayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { validatePayment, validateManualPayment, validateFlexiblePayment } = require('../middleware/validation');

// Process monthly payment (for users)
router.post('/process', authenticateToken, validatePayment, processMonthlyPayment);

// Manual payment record entry (for admins)
router.post('/manual', authenticateToken, validateManualPayment, recordManualPayment);

// Flexible payment entry (for admins) - $1 = 1 month
router.post('/flexible', authenticateToken, validateFlexiblePayment, processFlexiblePayment);

// Get payment status
router.get('/status/:cardNumber', authenticateToken, getPaymentStatus);

// Get payment history
router.get('/history/:cardNumber', authenticateToken, getPaymentHistory);

module.exports = router;
