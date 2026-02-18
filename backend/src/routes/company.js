const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Public route - Get all active companies (no authentication required)
// This allows companies to be accessed from anywhere in the application
router.get('/public/all', companyController.getPublicCompanies);

// All other routes require authentication
router.use(authenticateToken);

// Superadmin only routes - IMPORTANT: specific routes before parameterized routes
router.post('/create', authorize('superadmin'), companyController.createCompany);
router.get('/all', authorize('superadmin'), companyController.getAllCompanies);
// Parameterized routes come last to avoid matching /create or /all as IDs
router.get('/:id', companyController.getCompany);
router.put('/:id', authorize('superadmin'), companyController.updateCompany);
router.delete('/:id', authorize('superadmin'), companyController.deleteCompany);

module.exports = router;

