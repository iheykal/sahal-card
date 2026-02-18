const mongoose = require('mongoose');
const PendingCustomer = require('../models/PendingCustomer');
const Marketer = require('../models/Marketer');
const User = require('../models/User');
const SahalCard = require('../models/SahalCard');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');

// Normalize phone number
const normalizePhone = (phone) => {
    if (!phone) return null;

    let normalized = phone.trim().replace(/\s+/g, '');
    normalized = normalized.replace(/[^\d+]/g, '');

    if (normalized.startsWith('+252')) {
        return normalized;
    } else if (normalized.startsWith('252')) {
        return '+' + normalized;
    } else if (normalized.length === 9 && /^\d{9}$/.test(normalized)) {
        return '+252' + normalized;
    }

    return normalized;
};

// Create pending customer (Marketer only)
const createPendingCustomer = async (req, res) => {
    try {
        const { fullName, phone, location, profilePicUrl, registrationDate, amount } = req.body;

        // Get marketer from request (set by auth middleware)
        const marketer = req.marketer;

        if (!marketer) {
            return res.status(401).json({
                success: false,
                message: 'Marketer authentication required'
            });
        }

        // Normalize phone number
        const normalizedPhone = normalizePhone(phone);

        if (!normalizedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid phone number'
            });
        }

        // Check if user with this phone already exists
        const existingUser = await User.findOne({ phone: normalizedPhone });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Customer with this phone number already exists'
            });
        }

        // Check if pending customer with this phone already exists
        const existingPending = await PendingCustomer.findOne({
            phone: normalizedPhone,
            status: 'pending'
        });
        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'A pending customer with this phone number already exists'
            });
        }

        // Generate sequential ID
        // Start from 7 as requested
        const seqId = await Counter.getNextSequence('userId', 7);
        const idNumber = seqId.toString().padStart(3, '0');

        // Calculate validity date
        const months = Math.max(1, parseInt(amount || 1, 10));
        const startDate = new Date(registrationDate || new Date());
        const validUntilDate = new Date(startDate);

        const currentYear = validUntilDate.getFullYear();
        const currentMonth = validUntilDate.getMonth();
        const currentDay = validUntilDate.getDate();

        const totalMonths = currentMonth + months;
        const targetYear = currentYear + Math.floor(totalMonths / 12);
        const targetMonth = totalMonths % 12;
        const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const finalDay = Math.min(currentDay, daysInTargetMonth);

        validUntilDate.setFullYear(targetYear, targetMonth, finalDay);

        // Create pending customer
        const pendingCustomer = new PendingCustomer({
            fullName,
            phone: normalizedPhone,
            idNumber, // Auto-generated
            location,
            profilePicUrl,
            registrationDate: startDate,
            amount: months,
            validUntil: validUntilDate,
            createdBy: new mongoose.Types.ObjectId(marketer._id),
            status: 'pending'
        });

        await pendingCustomer.save();

        console.log('[createPendingCustomer] ✅ Pending customer created successfully:', {
            id: pendingCustomer._id,
            idNumber: pendingCustomer.idNumber,
            fullName: pendingCustomer.fullName,
            phone: pendingCustomer.phone,
            status: pendingCustomer.status,
            createdBy: marketer.fullName
        });

        res.status(201).json({
            success: true,
            message: 'Customer submitted for approval',
            data: {
                pendingCustomer
            }
        });

    } catch (error) {
        console.error('Create pending customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create pending customer',
            error: error.message
        });
    }
};

// Get all pending customers (Superadmin only)
const getAllPendingCustomers = async (req, res) => {
    try {
        console.log('[getAllPendingCustomers] Request from:', req.user?.role, req.user?.phone);
        const { page = 1, limit = 50, status, search } = req.query;
        console.log('[getAllPendingCustomers] Query params:', { page, limit, status, search });

        const query = {};

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('[getAllPendingCustomers] MongoDB query:', JSON.stringify(query));

        const pendingCustomers = await PendingCustomer.find(query)
            .populate({
                path: 'createdBy',
                model: 'Marketer',
                select: 'fullName phone'
            })
            .populate({
                path: 'reviewedBy',
                model: 'User',
                select: 'fullName'
            })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PendingCustomer.countDocuments(query);

        console.log('[getAllPendingCustomers] Found:', pendingCustomers.length, 'total:', total);
        console.log('[getAllPendingCustomers] Sample data:', pendingCustomers.slice(0, 2).map(c => ({
            id: c._id,
            fullName: c.fullName,
            status: c.status,
            createdByData: c.createdBy // Log full object to check population
        })));

        res.json({
            success: true,
            data: {
                pendingCustomers,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get pending customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending customers',
            error: error.message
        });
    }
};

// Get marketer's pending customers (Marketer only)
const getMarketerPendingCustomers = async (req, res) => {
    try {
        const marketer = req.marketer;

        if (!marketer) {
            return res.status(401).json({
                success: false,
                message: 'Marketer authentication required'
            });
        }

        const { page = 1, limit = 50, status } = req.query;

        const query = { createdBy: marketer._id };

        if (status) {
            query.status = status;
        }

        const pendingCustomers = await PendingCustomer.find(query)
            .populate('reviewedBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PendingCustomer.countDocuments(query);

        // Get counts by status
        const pendingCount = await PendingCustomer.countDocuments({
            createdBy: marketer._id,
            status: 'pending'
        });
        const approvedCount = await PendingCustomer.countDocuments({
            createdBy: marketer._id,
            status: 'approved'
        });
        const rejectedCount = await PendingCustomer.countDocuments({
            createdBy: marketer._id,
            status: 'rejected'
        });

        res.json({
            success: true,
            data: {
                pendingCustomers,
                stats: {
                    pending: pendingCount,
                    approved: approvedCount,
                    rejected: rejectedCount
                },
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Get marketer pending customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending customers',
            error: error.message
        });
    }
};

// Approve pending customer (Superadmin only)
const approvePendingCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const superadmin = req.user;

        const pendingCustomer = await PendingCustomer.findById(id)
            .populate('createdBy');

        if (!pendingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Pending customer not found'
            });
        }

        if (pendingCustomer.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Customer has already been ${pendingCustomer.status}`
            });
        }

        // Create the user
        const defaultPassword = 'maandhise123';

        const user = new User({
            fullName: pendingCustomer.fullName,
            phone: pendingCustomer.phone,
            password: defaultPassword,
            role: 'customer',
            idNumber: pendingCustomer.idNumber,
            location: pendingCustomer.location,
            profilePicUrl: pendingCustomer.profilePicUrl,
            membershipMonths: pendingCustomer.amount,
            validUntil: pendingCustomer.validUntil,
            canLogin: false,
            registeredBy: pendingCustomer.createdBy._id // Track who registered this user
        });

        await user.save();

        // Create Sahal Card for the new customer
        try {
            await SahalCard.createCard(user._id, 1.00);

            await Notification.createNotification({
                userId: user._id,
                title: 'Welcome to SAHAL CARD!',
                message: `Welcome ${user.fullName}! Your account has been approved. Your Sahal Card is ready!`,
                type: 'success',
                category: 'card_expiry',
                actionUrl: '/dashboard/sahal-card',
                actionText: 'View Card'
            });
        } catch (cardError) {
            console.error('Error creating Sahal Card:', cardError);
        }

        // Update marketer earnings and stats
        const marketer = await Marketer.findById(pendingCustomer.createdBy._id);
        if (marketer) {
            marketer.totalEarnings += 0.40;
            marketer.approvedCustomers += 1;
            await marketer.save();
        }

        // Update pending customer status
        pendingCustomer.status = 'approved';
        pendingCustomer.reviewedBy = superadmin._id;
        pendingCustomer.reviewedAt = new Date();
        pendingCustomer.createdUserId = user._id;
        await pendingCustomer.save();

        console.log('[approvePendingCustomer] Customer approved:', {
            pendingCustomerId: pendingCustomer._id,
            userId: user._id,
            marketerEarnings: marketer ? marketer.totalEarnings : 'N/A'
        });

        res.json({
            success: true,
            message: 'Customer approved successfully',
            data: {
                user: user.profile,
                marketerEarnings: marketer ? marketer.totalEarnings : 0
            }
        });

    } catch (error) {
        console.error('Approve pending customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve customer',
            error: error.message
        });
    }
};

// Reject pending customer (Superadmin only)
const rejectPendingCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const superadmin = req.user;

        const pendingCustomer = await PendingCustomer.findById(id);

        if (!pendingCustomer) {
            return res.status(404).json({
                success: false,
                message: 'Pending customer not found'
            });
        }

        if (pendingCustomer.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Customer has already been ${pendingCustomer.status}`
            });
        }

        pendingCustomer.status = 'rejected';
        pendingCustomer.reviewedBy = superadmin._id;
        pendingCustomer.reviewedAt = new Date();
        pendingCustomer.rejectionReason = reason || 'No reason provided';
        await pendingCustomer.save();

        console.log('[rejectPendingCustomer] Customer rejected:', {
            pendingCustomerId: pendingCustomer._id,
            reason: reason
        });

        res.json({
            success: true,
            message: 'Customer rejected',
            data: {
                pendingCustomer
            }
        });

    } catch (error) {
        console.error('Reject pending customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject customer',
            error: error.message
        });
    }
};

module.exports = {
    createPendingCustomer,
    getAllPendingCustomers,
    getMarketerPendingCustomers,
    approvePendingCustomer,
    rejectPendingCustomer
};
