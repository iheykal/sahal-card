const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorize } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateAdminUserCreation,
  validateProfileUpdate,
  validatePasswordChange
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/search-by-id', authController.searchUserById);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validateProfileUpdate, authController.updateProfile);
router.put('/change-password', validatePasswordChange, authController.changePassword);

// Admin routes
router.post('/create-user', authorize('admin', 'superadmin'), validateAdminUserCreation, authController.createUser);
router.get('/users', authorize('admin', 'superadmin'), authController.getAllUsers);
router.put('/users/:userId', authorize('admin', 'superadmin'), authController.updateUser);
router.delete('/users/:userId', authorize('admin', 'superadmin'), authController.deleteUser);
router.get('/next-id', authorize('admin', 'superadmin', 'marketer'), authController.getNextUserId);

module.exports = router;
