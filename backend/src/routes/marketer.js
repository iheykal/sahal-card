const express = require('express');
const router = express.Router();
const marketerController = require('../controllers/marketerController');
const { authenticateToken, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Superadmin only routes
router.post('/create', authorize('superadmin'), marketerController.createMarketer);
router.get('/', authorize('superadmin'), marketerController.getAllMarketers);
router.get('/:id', authorize('superadmin'), marketerController.getMarketer);
router.put('/:id', authorize('superadmin'), marketerController.updateMarketer);
router.delete('/:id', authorize('superadmin'), marketerController.deleteMarketer);

// Marketer or Superadmin can view earnings
router.get('/:id/earnings', authorize('marketer', 'superadmin'), marketerController.getMarketerEarnings);

// Get all users registered by a specific marketer (Superadmin only)
router.get('/:id/registered-users', authorize('superadmin'), marketerController.getMarketerRegisteredUsers);

module.exports = router;
