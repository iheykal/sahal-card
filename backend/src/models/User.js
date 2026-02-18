const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    unique: true,
    minlength: [1, 'ID number must be at least 1 character'],
    maxlength: [20, 'ID number cannot exceed 20 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  // Number of paid months (each $ equals 1 month)
  membershipMonths: {
    type: Number,
    default: 0,
    min: 0
  },
  // Calculated date when membership becomes invalid
  validUntil: {
    type: Date,
    default: null
  },
  profilePicUrl: {
    type: String,
    trim: true
  },
  idCardImageUrl: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'superadmin'],
    default: 'customer'
  },
  canLogin: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
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
  }],
  // Track which marketer registered this user (if any)
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marketer',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function () {
  return {
    _id: this._id,
    fullName: this.fullName,
    phone: this.phone,
    idNumber: this.idNumber,
    location: this.location,
    membershipMonths: this.membershipMonths,
    validUntil: this.validUntil,
    profilePicUrl: this.profilePicUrl,
    idCardImageUrl: this.idCardImageUrl,
    role: this.role,
    canLogin: this.canLogin,
    createdAt: this.createdAt
  };
});

// Hash password before saving
userSchema.pre('save', async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Add refresh token
userSchema.methods.addRefreshToken = function (token) {
  this.refreshTokens.push({ token });
  return this.save({ validateBeforeSave: false });
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return this.save({ validateBeforeSave: false });
};

// Static method to find by phone
userSchema.statics.findByPhone = function (phone) {
  return this.findOne({ phone });
};

module.exports = mongoose.model('User', userSchema);
