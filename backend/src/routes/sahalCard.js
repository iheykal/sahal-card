const express = require('express');
const router = express.Router();
const sahacardController = require('../controllers/sahalCardController');
const { authenticateToken, authorize, requireActiveCard } = require('../middleware/auth');
const {
  validateSahalCardRegistration,
  validateTransaction,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Customer routes
router.post('/register', validateSahalCardRegistration, sahacardController.registerCard);
router.get('/my-card', sahacardController.getCard);
router.post('/renew', sahacardController.renewCard);
router.get('/stats', sahacardController.getCardStats);
router.get('/transactions', validatePagination, sahacardController.getTransactionHistory);

// Public validation route (for companies to validate cards)
router.get('/validate/:cardNumber', sahacardController.validateCard);

// Transaction processing (for companies)
router.post('/process-transaction', validateTransaction, sahacardController.processTransaction);

// Admin routes
router.use(authorize('admin', 'superadmin'));

router.post('/create', sahacardController.createCard);
router.get('/user/:userId', sahacardController.getCardByUserId);
router.put('/suspend/:cardId', validateObjectId('cardId'), sahacardController.suspendCard);
router.put('/reactivate/:cardId', validateObjectId('cardId'), sahacardController.reactivateCard);

module.exports = router;
