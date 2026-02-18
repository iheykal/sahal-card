const User = require('../models/User');
const Trip = require('../models/Trip');

// Login citizen using existing customer database
exports.loginCitizen = async (req, res) => {
    try {
        const { idNumber, phoneLast4 } = req.body;

        // Validate required fields
        if (!idNumber || !phoneLast4) {
            return res.status(400).json({
                success: false,
                message: 'ID number and last 4 digits of phone are required'
            });
        }

        // Find user by ID number (Handle padding/unpadding like authController)
        const trimmedId = idNumber.trim();
        let user = await User.findOne({ idNumber: trimmedId });

        // Try padded to 3 digits (e.g. "1" -> "001")
        if (!user) {
            const paddedId = trimmedId.padStart(3, '0');
            if (paddedId !== trimmedId) {
                user = await User.findOne({ idNumber: paddedId });
            }
        }

        // Try unpadded (e.g. "001" -> "1")
        if (!user) {
            const unpaddedId = trimmedId.replace(/^0+/, '');
            if (unpaddedId !== trimmedId && unpaddedId.length > 0) {
                user = await User.findOne({ idNumber: unpaddedId });
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found with this ID number'
            });
        }

        // Verify phone last 4 digits
        const userPhoneLast4 = user.phone.slice(-4);
        if (userPhoneLast4 !== phoneLast4) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials - phone number does not match'
            });
        }

        // Return user data
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                idNumber: user.idNumber,
                fullName: user.fullName,
                phoneLast4: userPhoneLast4
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed'
        });
    }
};

// Create a new trip
exports.createTrip = async (req, res) => {
    try {
        const { userId, vehiclePlate, fromLocation, toLocation } = req.body;

        // Validate required fields
        if (!userId || !vehiclePlate || !fromLocation || !toLocation) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Find user - Use robust lookup to handle both string and ObjectId _id
        let user = await User.findOne({ _id: userId });

        // If not found, try raw collection (bypassing Mongoose casting for string _ids)
        if (!user) {
            user = await User.collection.findOne({ _id: userId });
        }

        if (!user) {
            console.error(`[createTrip] Customer not found for userId: ${userId}`);
            return res.status(404).json({
                success: false,
                message: `Customer not found (ID: ${userId})`
            });
        }

        // Generate unique trip ID
        const tripId = await Trip.generateTripId();

        // Create trip
        const trip = await Trip.create({
            tripId,
            userId,
            passengerName: user.fullName,
            vehiclePlate,
            fromLocation,
            toLocation
        });

        // Populate user data
        await trip.populate('userId', 'idNumber fullName phone');

        res.status(201).json({
            success: true,
            message: 'Trip created successfully',
            data: trip
        });
    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create trip'
        });
    }
};

// Get trips (public search or authenticated)
exports.getTrips = async (req, res) => {
    try {
        const { idNumber, phoneLast4, userId, tripId } = req.query;

        let user;

        // Public search by Trip ID
        if (tripId) {
            const trip = await Trip.findOne({ tripId }).populate('userId', 'idNumber fullName phone');
            if (!trip) {
                return res.status(404).json({
                    success: false,
                    message: 'Trip not found'
                });
            }
            return res.json({
                success: true,
                data: [trip]
            });
        }
        // Public search mode (User verification)
        else if (idNumber && phoneLast4) {
            const trimmedId = idNumber.trim();
            user = await User.findOne({ idNumber: trimmedId });

            // Try padded to 3 digits
            if (!user) {
                const paddedId = trimmedId.padStart(3, '0');
                if (paddedId !== trimmedId) {
                    user = await User.findOne({ idNumber: paddedId });
                }
            }

            // Try unpadded
            if (!user) {
                const unpaddedId = trimmedId.replace(/^0+/, '');
                if (unpaddedId !== trimmedId && unpaddedId.length > 0) {
                    user = await User.findOne({ idNumber: unpaddedId });
                }
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Verify phone last 4 digits
            const userPhoneLast4 = user.phone.slice(-4);
            if (userPhoneLast4 !== phoneLast4) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        }
        // Authenticated mode
        else if (userId) {
            // Use robust lookup for userId
            user = await User.findOne({ _id: userId });

            if (!user) {
                user = await User.collection.findOne({ _id: userId });
            }

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Either tripId, (idNumber + phoneLast4), or userId is required'
            });
        }

        // Get all trips for this user
        const trips = await Trip.find({ userId: user._id })
            .sort({ timestamp: -1 })
            .populate('userId', 'idNumber fullName phone');

        res.json({
            success: true,
            data: trips
        });
    } catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get trips'
        });
    }
};

// Update trip (SOS or complete)
exports.updateTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { action } = req.body;

        // Find trip by tripId (TX-XXXX format)
        const trip = await Trip.findOne({ tripId });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Handle different actions
        if (action === 'sos') {
            trip.sosActive = true;
            await trip.save();

            await trip.populate('userId', 'idNumber fullName phone');

            return res.json({
                success: true,
                message: 'SOS activated',
                data: trip
            });
        }
        else if (action === 'complete') {
            trip.status = 'Completed';
            trip.completedAt = new Date();
            await trip.save();

            await trip.populate('userId', 'idNumber fullName phone');

            return res.json({
                success: true,
                message: 'Trip marked as completed',
                data: trip
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Use "sos" or "complete"'
            });
        }
    } catch (error) {
        console.error('Update trip error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update trip'
        });
    }
};

// Admin: Get all trips with statistics
exports.getAllTrips = async (req, res) => {
    try {
        // Get all trips
        const trips = await Trip.find()
            .sort({ timestamp: -1 })
            .populate('userId', 'idNumber fullName phone');

        // Calculate statistics
        const totalTrips = trips.length;
        const activeTrips = trips.filter(t => t.status === 'On Way').length;
        const completedTrips = trips.filter(t => t.status === 'Completed').length;
        const sosCount = trips.filter(t => t.sosActive).length;

        res.json({
            success: true,
            data: {
                trips,
                statistics: {
                    totalTrips,
                    activeTrips,
                    completedTrips,
                    sosCount
                }
            }
        });
    } catch (error) {
        console.error('Get all trips error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get trips'
        });
    }
};

// Admin: Get all registered users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get users'
        });
    }
};

// Admin: Complete trip
exports.completeTripByAdmin = async (req, res) => {
    try {
        const { tripId } = req.params;

        // Find trip by tripId
        const trip = await Trip.findOne({ tripId });
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Mark as completed
        trip.status = 'Completed';
        trip.completedAt = new Date();
        await trip.save();

        await trip.populate('userId', 'idNumber fullName phone');

        res.json({
            success: true,
            message: 'Trip marked as completed by admin',
            data: trip
        });
    } catch (error) {
        console.error('Complete trip by admin error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete trip'
        });
    }
};
