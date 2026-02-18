const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  sahacardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SahalCard',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  discount: {
    type: Number,
    required: [true, 'Discount amount is required'],
    min: [0, 'Discount cannot be negative']
  },
  savings: {
    type: Number,
    required: [true, 'Savings amount is required'],
    min: [0, 'Savings cannot be negative']
  },
  originalAmount: {
    type: Number,
    required: [true, 'Original amount is required'],
    min: [0.01, 'Original amount must be greater than 0']
  },
  discountRate: {
    type: Number,
    required: [true, 'Discount rate is required'],
    min: [0, 'Discount rate cannot be negative'],
    max: [100, 'Discount rate cannot exceed 100%']
  },
  location: {
    type: String,
    required: [true, 'Transaction location is required'],
    trim: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company.branches'
  },
  items: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0.01
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0.01
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'other'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'refunded'],
    default: 'completed'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ companyId: 1, createdAt: -1 });
transactionSchema.index({ sahacardId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ receiptNumber: 1 });

// Virtual for transaction summary
transactionSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    amount: this.amount,
    savings: this.savings,
    discountRate: this.discountRate,
    location: this.location,
    status: this.status,
    createdAt: this.createdAt
  };
});

// Virtual for customer info
transactionSchema.virtual('customerInfo', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true
});

// Virtual for company info
transactionSchema.virtual('companyInfo', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true
});

// Generate receipt number
transactionSchema.statics.generateReceiptNumber = function() {
  const prefix = 'RCP';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Create new transaction
transactionSchema.statics.createTransaction = async function(transactionData) {
  const receiptNumber = this.generateReceiptNumber();
  
  const transaction = new this({
    ...transactionData,
    receiptNumber
  });
  
  return await transaction.save();
};

// Get customer transaction history
transactionSchema.statics.getCustomerHistory = function(customerId, options = {}) {
  const { page = 1, limit = 10, status = null } = options;
  const query = { customerId };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('companyId', 'businessName businessType logo')
    .populate('branchId', 'name address')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Get company transaction history
transactionSchema.statics.getCompanyHistory = function(companyId, options = {}) {
  const { page = 1, limit = 10, status = null, startDate = null, endDate = null } = options;
  const query = { companyId };
  
  if (status) {
    query.status = status;
  }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.find(query)
    .populate('customerId', 'fullName email phone')
    .populate('sahacardId', 'cardNumber')
    .populate('branchId', 'name address')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Get transaction statistics
transactionSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.customerId) {
    matchStage.customerId = mongoose.Types.ObjectId(filters.customerId);
  }
  
  if (filters.companyId) {
    matchStage.companyId = mongoose.Types.ObjectId(filters.companyId);
  }
  
  if (filters.startDate && filters.endDate) {
    matchStage.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  if (filters.status) {
    matchStage.status = filters.status;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalSavings: { $sum: '$savings' },
        totalDiscount: { $sum: '$discount' },
        averageAmount: { $avg: '$amount' },
        averageSavings: { $avg: '$savings' }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    totalSavings: 0,
    totalDiscount: 0,
    averageAmount: 0,
    averageSavings: 0
  };
};

// Method to cancel transaction
transactionSchema.methods.cancel = async function(reason = null) {
  this.status = 'cancelled';
  if (reason) {
    this.notes = (this.notes || '') + ` [Cancelled: ${reason}]`;
  }
  return await this.save();
};

// Method to refund transaction
transactionSchema.methods.refund = async function(reason = null) {
  this.status = 'refunded';
  if (reason) {
    this.notes = (this.notes || '') + ` [Refunded: ${reason}]`;
  }
  return await this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);
