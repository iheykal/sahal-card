const Marketer = require('../models/Marketer');

// Normalize phone number for marketers (61xxxxxxx -> +25261xxxxxxx)
const normalizePhone = (phone) => {
    if (!phone) return null;

    let normalized = phone.trim().replace(/\s+/g, '');
    normalized = normalized.replace(/[^\d+]/g, '');

    if (normalized.startsWith('+252')) {
        return normalized;
    } else if (normalized.startsWith('252')) {
        return '+' + normalized;
    } else if (normalized.startsWith('61') && normalized.length === 11) {
        return '+252' + normalized;
    } else if (normalized.length === 9 && /^\d{9}$/.test(normalized)) {
        return '+252' + normalized;
    }

    return normalized;
};

// Create marketer (Superadmin only)
const createMarketer = async (req, res) => {
    try {
        const { fullName, phone, profilePicUrl, governmentIdUrl, password } = req.body;

        console.log('[createMarketer] Received request:', {
            fullName,
            phone,
            hasProfilePic: !!profilePicUrl,
            profilePicUrl: profilePicUrl ? profilePicUrl.substring(0, 50) + '...' : 'none',
            hasGovId: !!governmentIdUrl,
            govIdUrl: governmentIdUrl ? governmentIdUrl.substring(0, 50) + '...' : 'none'
        });

        // Normalize phone number
        const normalizedPhone = normalizePhone(phone);

        if (!normalizedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid phone number'
            });
        }

        // Check if marketer with this phone already exists
        const existingMarketer = await Marketer.findByPhone(normalizedPhone);
        if (existingMarketer) {
            return res.status(400).json({
                success: false,
                message: 'Marketer with this phone number already exists'
            });
        }

        // Create new marketer
        const marketer = new Marketer({
            fullName,
            phone: normalizedPhone,
            profilePicUrl,
            governmentIdUrl,
            password: password || 'marketer123', // Default password if not provided
            createdBy: req.user._id // Superadmin who created this marketer
        });

        await marketer.save();

        console.log('[createMarketer] Marketer created:', {
            id: marketer._id,
            fullName: marketer.fullName,
            phone: marketer.phone
        });

        res.status(201).json({
            success: true,
            message: 'Marketer created successfully',
            data: {
                marketer: marketer.profile,
                credentials: {
                    phone: marketer.phone,
                    password: password || 'marketer123'
                }
            }
        });

    } catch (error) {
        console.error('Create marketer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create marketer',
            error: error.message
        });
    }
};

// Get all marketers (Superadmin only)
const getAllMarketers = async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const marketers = await Marketer.find(query)
            .select('-password -refreshTokens')
            .populate('createdBy', 'fullName phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Marketer.countDocuments(query);

        res.json({
            success: true,
            data: {
                marketers,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get marketers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marketers',
            error: error.message
        });
    }
};

// Get single marketer
const getMarketer = async (req, res) => {
    try {
        const { id } = req.params;

        const marketer = await Marketer.findById(id)
            .select('-password -refreshTokens')
            .populate('createdBy', 'fullName phone');

        if (!marketer) {
            return res.status(404).json({
                success: false,
                message: 'Marketer not found'
            });
        }

        res.json({
            success: true,
            data: { marketer }
        });

    } catch (error) {
        console.error('Get marketer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marketer',
            error: error.message
        });
    }
};

// Update marketer (Superadmin only)
const updateMarketer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Don't allow updating sensitive fields directly
        delete updateData.password;
        delete updateData.totalEarnings;
        delete updateData.approvedCustomers;
        delete updateData.createdBy;
        delete updateData.refreshTokens;

        // Normalize phone if being updated
        if (updateData.phone) {
            updateData.phone = normalizePhone(updateData.phone);
        }

        const marketer = await Marketer.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -refreshTokens');

        if (!marketer) {
            return res.status(404).json({
                success: false,
                message: 'Marketer not found'
            });
        }

        res.json({
            success: true,
            message: 'Marketer updated successfully',
            data: { marketer }
        });

    } catch (error) {
        console.error('Update marketer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update marketer',
            error: error.message
        });
    }
};

// Delete marketer (Superadmin only)
const deleteMarketer = async (req, res) => {
    try {
        const { id } = req.params;

        const marketer = await Marketer.findByIdAndDelete(id);

        if (!marketer) {
            return res.status(404).json({
                success: false,
                message: 'Marketer not found'
            });
        }

        res.json({
            success: true,
            message: 'Marketer deleted successfully'
        });

    } catch (error) {
        console.error('Delete marketer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete marketer',
            error: error.message
        });
    }
};

// Get marketer earnings (Marketer or Superadmin)
const getMarketerEarnings = async (req, res) => {
    try {
        const { id } = req.params;

        // If user is a marketer, they can only view their own earnings
        if (req.marketer && req.marketer._id.toString() !== id) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own earnings'
            });
        }

        const marketer = await Marketer.findById(id)
            .select('fullName totalEarnings approvedCustomers');

        if (!marketer) {
            return res.status(404).json({
                success: false,
                message: 'Marketer not found'
            });
        }

        res.json({
            success: true,
            data: {
                fullName: marketer.fullName,
                totalEarnings: marketer.totalEarnings,
                approvedCustomers: marketer.approvedCustomers,
                commissionRate: 0.40
            }
        });

    } catch (error) {
        console.error('Get marketer earnings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marketer earnings',
            error: error.message
        });
    }
};

// Get users registered by a specific marketer (Superadmin only)
const getMarketerRegisteredUsers = async (req, res) => {
    try {
        const { id } = req.params;

        // Import User model
        const User = require('../models/User');

        // Find the marketer first
        const marketer = await Marketer.findById(id)
            .select('fullName phone profilePicUrl governmentIdUrl totalEarnings approvedCustomers createdAt');

        if (!marketer) {
            return res.status(404).json({
                success: false,
                message: 'Marketer not found'
            });
        }

        // Find all users registered by this marketer
        const registeredUsers = await User.find({ registeredBy: id })
            .select('fullName phone location profilePicUrl validUntil createdAt membershipMonths')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                marketer,
                registeredUsers,
                totalRegistered: registeredUsers.length
            }
        });

    } catch (error) {
        console.error('Get marketer registered users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get marketer registered users',
            error: error.message
        });
    }
};

module.exports = {
    createMarketer,
    getAllMarketers,
    getMarketer,
    updateMarketer,
    deleteMarketer,
    getMarketerEarnings,
    getMarketerRegisteredUsers
};
