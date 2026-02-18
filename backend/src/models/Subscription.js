const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sahacardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SahalCard',
    required: true
  },
  subscriptionType: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'suspended', 'expired'],
    default: 'active'
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  autoRenewal: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'mobile_money', 'bank_transfer', 'cash'],
    required: true
  },
  billingHistory: [{
    billedAt: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentMethod: {
      type: String,
      enum: ['stripe', 'mobile_money', 'bank_transfer', 'cash']
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ sahacardId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Static method to find active subscriptions
subscriptionSchema.statics.findActiveSubscriptions = function() {
  return this.find({ 
    status: 'active',
    nextBillingDate: { $lte: new Date() }
  }).populate('userId sahacardId');
};

// Method to add billing record
subscriptionSchema.methods.addBillingRecord = function(billingData) {
  this.billingHistory.push(billingData);
  return this.save();
};

// Method to update next billing date
subscriptionSchema.methods.updateNextBillingDate = function() {
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + 1);
  this.nextBillingDate = nextDate;
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);

