const mongoose = require('mongoose');

const pendingCustomerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    idNumber: {
        type: String,
        trim: true,
        maxlength: [20, 'ID number cannot exceed 20 characters']
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    profilePicUrl: {
        type: String,
        trim: true
    },
    registrationDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
        max: 120
    },
    validUntil: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Marketer',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    createdUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
pendingCustomerSchema.index({ status: 1 });
pendingCustomerSchema.index({ createdBy: 1 });
pendingCustomerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PendingCustomer', pendingCustomerSchema);
