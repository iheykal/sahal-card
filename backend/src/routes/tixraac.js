const express = require('express');
const router = express.Router();
const tixraacController = require('../controllers/tixraacController');

// Login route (uses existing customer database)
router.post('/login', tixraacController.loginCitizen);

// Trip routes
router.post('/trips', tixraacController.createTrip);
router.get('/trips', tixraacController.getTrips);
router.patch('/trips/:tripId', tixraacController.updateTrip);

// Admin routes
router.get('/admin/trips', tixraacController.getAllTrips);
router.patch('/admin/trips/:tripId/complete', tixraacController.completeTripByAdmin);
router.get('/admin/users', tixraacController.getAllUsers);

module.exports = router;
