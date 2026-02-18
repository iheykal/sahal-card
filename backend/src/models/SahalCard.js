const mongoose = require('mongoose');

const sahacardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  qrCode: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  membershipFee: {
    type: Number,
    default: 1.00,
    min: [0, 'Membership fee cannot be negative']
  },
  totalSavings: {
    type: Number,
    default: 0.00,
    min: [0, 'Total savings cannot be negative']
  },
  totalTransactions: {
    type: Number,
    default: 0,
    min: [0, 'Total transactions cannot be negative']
  },
  lastUsed: {
    type: Date,
    default: null
  },
  renewalHistory: [{
    renewedAt: {
      type: Date,
      default: Date.now
    },
    fee: {
      type: Number,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'suspended', 'cancelled'],
    default: 'active'
  },
  suspensionReason: {
    type: String,
    default: null
  },
  // Simple payment tracking
  monthlyFee: {
    type: Number,
    default: 1.00,
    min: [0, 'Monthly fee cannot be negative']
  },
  nextPaymentDue: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['valid', 'invalid'],
    default: 'valid'
  },
  lastPaymentDate: {
    type: Date,
    default: Date.now
  },
  paymentNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
sahacardSchema.index({ userId: 1 });
sahacardSchema.index({ cardNumber: 1 });
sahacardSchema.index({ validUntil: 1 });
sahacardSchema.index({ status: 1 });

// Virtual for card validity
sahacardSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.validUntil > now && 
         this.status === 'active' && 
         this.paymentStatus === 'valid';
});

// Virtual for days remaining
sahacardSchema.virtual('daysRemaining').get(function() {
  if (!this.isValid) return 0;
  const now = new Date();
  const diffTime = this.validUntil - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for card status
sahacardSchema.virtual('statusText').get(function() {
  if (this.status === 'suspended') return 'Suspended';
  if (this.status === 'cancelled') return 'Cancelled';
  if (this.validUntil <= new Date()) return 'Expired';
  if (this.daysRemaining <= 30) return 'Expiring Soon';
  return 'Active';
});

// Generate unique card number from user ID
sahacardSchema.statics.generateCardNumber = function(userIdentifier) {
  console.log('Generating card number from identifier:', userIdentifier);
  
  // Extract only numbers from the identifier
  const numbers = userIdentifier.replace(/\D/g, '');
  console.log('Extracted numbers:', numbers);
  
  // Take the last 8 digits, pad with zeros if needed
  let cardNumber = numbers.slice(-8);
  if (cardNumber.length < 8) {
    cardNumber = cardNumber.padStart(8, '0');
  }
  
  console.log('Final card number:', cardNumber);
  return cardNumber;
};

// Create new Sahal Card
sahacardSchema.statics.createCard = async function(userId, membershipFee = 1.00) {
  // Get user's ID number for card number generation
  const User = require('./User');
  const user = await User.findById(userId);
  
  console.log('Creating card for user:', {
    userId,
    userFullName: user?.fullName,
    userPhone: user?.phone,
    useridNumber: user?.idNumber,
    hasIdNumber: !!user?.idNumber
  });
  
  // Use ID number if available, otherwise use user ID
  const userIdentifier = user?.idNumber || userId;
  console.log('Using identifier for card number:', userIdentifier);
  console.log('User has ID number:', !!user?.idNumber);
  console.log('User ID number value:', user?.idNumber);
  
  const cardNumber = this.generateCardNumber(userIdentifier);
  console.log('Generated card number:', cardNumber);
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 1); // Valid for 1 month
  
  const nextPaymentDue = new Date();
  nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
  
  const card = new this({
    userId,
    cardNumber,
    qrCode: `${cardNumber}:${userId}`,
    validUntil,
    membershipFee,
    monthlyFee: membershipFee,
    nextPaymentDue,
    paymentStatus: 'valid', // New cards start as valid
    lastPaymentDate: new Date(),
    renewalHistory: [{
      renewedAt: new Date(),
      fee: membershipFee,
      validUntil
    }]
  });
  
  return await card.save();
};

// Renew card
sahacardSchema.methods.renew = async function(renewalFee = 0.50) {
  const newValidUntil = new Date();
  newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);
  
  this.validUntil = newValidUntil;
  this.membershipFee += renewalFee;
  this.renewalHistory.push({
    renewedAt: new Date(),
    fee: renewalFee,
    validUntil: newValidUntil
  });
  
  return await this.save();
};

// Simple method to mark as valid
sahacardSchema.methods.markAsValid = async function(notes = '') {
  const newValidUntil = new Date();
  newValidUntil.setMonth(newValidUntil.getMonth() + 1);
  
  const nextPaymentDue = new Date();
  nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
  
  this.validUntil = newValidUntil;
  this.nextPaymentDue = nextPaymentDue;
  this.paymentStatus = 'valid';
  this.lastPaymentDate = new Date();
  this.paymentNotes = notes;
  this.status = 'active';
  this.isActive = true;
  
  return await this.save();
};

// Simple method to mark as invalid
sahacardSchema.methods.markAsInvalid = async function(notes = '') {
  this.paymentStatus = 'invalid';
  this.paymentNotes = notes;
  this.status = 'suspended';
  this.isActive = false;
  this.suspensionReason = 'Payment not received';
  
  return await this.save();
};

// Update savings
sahacardSchema.methods.addSavings = async function(amount) {
  this.totalSavings += amount;
  this.totalTransactions += 1;
  this.lastUsed = new Date();
  return await this.save();
};

// Suspend card
sahacardSchema.methods.suspend = async function(reason) {
  this.isActive = false;
  this.status = 'suspended';
  this.suspensionReason = reason;
  return await this.save();
};

// Reactivate card
sahacardSchema.methods.reactivate = async function() {
  this.isActive = true;
  this.status = 'active';
  this.suspensionReason = null;
  return await this.save();
};

// Renew card for flexible duration ($1 = 1 month)
sahacardSchema.methods.renewForDuration = async function(amount, paymentMethod, transactionId) {
  const monthsToAdd = Math.floor(amount); // $1 = 1 month
  const currentDate = new Date();
  
  // If card is currently valid, extend from current validUntil date
  // If card is expired, start from current date
  const baseDate = this.validUntil > currentDate ? this.validUntil : currentDate;
  
  // Calculate new expiration date
  const newValidUntil = new Date(baseDate);
  newValidUntil.setMonth(newValidUntil.getMonth() + monthsToAdd);
  
  // Update next payment due to be 1 month before expiration
  const nextPaymentDue = new Date(newValidUntil);
  nextPaymentDue.setMonth(nextPaymentDue.getMonth() - 1);
  
  // Update card properties
  this.validUntil = newValidUntil;
  this.nextPaymentDue = nextPaymentDue;
  this.paymentStatus = 'valid';
  this.lastPaymentDate = currentDate;
  this.status = 'active';
  this.isActive = true;
  this.suspensionReason = null;
  
  // Add to renewal history
  this.renewalHistory.push({
    renewedAt: currentDate,
    fee: amount,
    validUntil: newValidUntil,
    monthsAdded: monthsToAdd,
    paymentMethod,
    transactionId
  });
  
  return await this.save();
};

// Simple monthly renewal method (for backward compatibility)
sahacardSchema.methods.renewMonthly = async function(paymentData) {
  const { paymentMethod, transactionId } = paymentData;
  return await this.renewForDuration(this.monthlyFee, paymentMethod, transactionId);
};

// Get card statistics
sahacardSchema.methods.getStats = function() {
  return {
    totalSavings: this.totalSavings,
    totalTransactions: this.totalTransactions,
    daysRemaining: this.daysRemaining,
    isValid: this.isValid,
    status: this.statusText,
    lastUsed: this.lastUsed,
    renewalCount: this.renewalHistory.length
  };
};

module.exports = mongoose.model('SahalCard', sahacardSchema);
