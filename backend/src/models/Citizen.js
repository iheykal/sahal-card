const mongoose = require('mongoose');

const citizenSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: [true, 'National ID is required'],
    unique: true,
    trim: true,
    match: [/^SO\d{8}$/, 'National ID must be in format SO12345678']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    minlength: [10, 'Phone number must be at least 10 digits'],
    maxlength: [15, 'Phone number cannot exceed 15 digits']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
citizenSchema.index({ nationalId: 1 }, { unique: true });
citizenSchema.index({ phone: 1 });

// Virtual for getting last 4 digits of phone
citizenSchema.virtual('phoneLast4').get(function () {
  return this.phone ? this.phone.slice(-4) : '';
});

// Method to verify phone last 4 digits
citizenSchema.methods.verifyPhoneLast4 = function (last4) {
  return this.phone.slice(-4) === last4;
};

module.exports = mongoose.model('Citizen', citizenSchema);
