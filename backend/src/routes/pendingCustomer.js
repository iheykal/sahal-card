const express = require('express');
const router = express.Router();
const pendingCustomerController = require('../controllers/pendingCustomerController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Marketer routes - create pending customer and view their own
router.post('/create', authorize('marketer'), pendingCustomerController.createPendingCustomer);
router.get('/my-customers', authorize('marketer'), pendingCustomerController.getMarketerPendingCustomers);

// Superadmin routes - view all and approve/reject
router.get('/', authorize('superadmin'), pendingCustomerController.getAllPendingCustomers);
router.post('/:id/approve', authorize('superadmin'), pendingCustomerController.approvePendingCustomer);
router.post('/:id/reject', authorize('superadmin'), pendingCustomerController.rejectPendingCustomer);

module.exports = router;
