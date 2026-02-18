const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const marketerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    profilePicUrl: {
        type: String,
        trim: true
    },
    governmentIdUrl: {
        type: String,
        required: [true, 'Government ID is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    totalEarnings: {
        type: Number,
        default: 0,
        min: 0
    },
    approvedCustomers: {
        type: Number,
        default: 0,
        min: 0
    },
    canLogin: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastLogin: {
        type: Date,
        default: null
    },
    refreshTokens: [{
        token: String,
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 2592000 // 30 days
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for better query performance
marketerSchema.index({ phone: 1 }, { unique: true });
marketerSchema.index({ createdBy: 1 });

// Virtual for marketer's profile
marketerSchema.virtual('profile').get(function () {
    return {
        _id: this._id,
        fullName: this.fullName,
        phone: this.phone,
        profilePicUrl: this.profilePicUrl,
        governmentIdUrl: this.governmentIdUrl,
        totalEarnings: this.totalEarnings,
        approvedCustomers: this.approvedCustomers,
        canLogin: this.canLogin,
        createdAt: this.createdAt,
        role: 'marketer'
    };
});

// Hash password before saving
marketerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
marketerSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
marketerSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save({ validateBeforeSave: false });
};

// Add refresh token
marketerSchema.methods.addRefreshToken = function (token) {
    this.refreshTokens.push({ token });
    return this.save({ validateBeforeSave: false });
};

// Remove refresh token
marketerSchema.methods.removeRefreshToken = function (token) {
    this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
    return this.save({ validateBeforeSave: false });
};

// Static method to find by phone
marketerSchema.statics.findByPhone = function (phone) {
    return this.findOne({ phone });
};

module.exports = mongoose.model('Marketer', marketerSchema);
