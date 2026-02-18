const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Branch address is required'],
    trim: true
  },
  phone: {
    type: String,
    required: false, // Phone is optional for branches
    trim: true,
    default: null
  },
  coordinates: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  manager: {
    name: String,
    phone: String,
    email: String
  }
}, {
  timestamps: true
});

const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Companies no longer require user accounts
    default: null
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: [
      'pharmacy', 'supermarket', 'restaurant', 'clothing', 'electronics',
      'beauty', 'healthcare', 'automotive', 'education', 'services', 'furniture',
      'telecommunication', 'travelagency', 'other'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  discountRate: {
    type: Number,
    required: [true, 'Discount rate is required'],
    min: [1, 'Discount rate must be at least 1%'],
    max: [100, 'Discount rate cannot exceed 100%']
  },
  branches: [branchSchema],
  logo: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    default: null
  },
  totalCustomers: {
    type: Number,
    default: 0,
    min: [0, 'Total customers cannot be negative']
  },
  totalTransactions: {
    type: Number,
    default: 0,
    min: [0, 'Total transactions cannot be negative']
  },
  totalSavings: {
    type: Number,
    default: 0.00,
    min: [0, 'Total savings cannot be negative']
  },
  monthlyRevenue: {
    type: Number,
    default: 0.00,
    min: [0, 'Monthly revenue cannot be negative']
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: false, // Phone is optional for companies
      trim: true,
      default: null
    },
    website: {
      type: String,
      trim: true
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
companySchema.index({ businessName: 'text', description: 'text' });
companySchema.index({ businessType: 1 });
companySchema.index({ isVerified: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ featured: 1 });
companySchema.index({ 'branches.coordinates': '2dsphere' });

// Virtual for active branches count
companySchema.virtual('activeBranchesCount').get(function () {
  return this.branches.filter(branch => branch.isActive).length;
});

// Virtual for company profile
companySchema.virtual('profile').get(function () {
  return {
    _id: this._id,
    businessName: this.businessName,
    businessType: this.businessType,
    description: this.description,
    discountRate: this.discountRate,
    logo: this.logo,
    isVerified: this.isVerified,
    totalCustomers: this.totalCustomers,
    rating: this.rating,
    activeBranchesCount: this.activeBranchesCount,
    isActive: this.isActive
  };
});

// Static method to find nearby companies
companySchema.statics.findNearby = function (lat, lng, maxDistance = 10000) {
  return this.find({
    'branches.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    isVerified: true
  });
};

// Static method to get companies by type
companySchema.statics.getByType = function (businessType) {
  return this.find({
    businessType,
    isActive: true,
    isVerified: true
  }).sort({ featured: -1, rating: -1 });
};

// Method to add customer
companySchema.methods.addCustomer = async function () {
  this.totalCustomers += 1;
  return await this.save();
};

// Method to add transaction
companySchema.methods.addTransaction = async function (amount, savings) {
  this.totalTransactions += 1;
  this.totalSavings += savings;
  this.monthlyRevenue += amount;
  return await this.save();
};

// Method to update rating
companySchema.methods.updateRating = async function (newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return await this.save();
};

// Method to verify company
companySchema.methods.verify = async function (notes = null) {
  this.isVerified = true;
  this.verificationStatus = 'verified';
  this.verificationNotes = notes;
  return await this.save();
};

// Method to reject verification
companySchema.methods.rejectVerification = async function (notes) {
  this.isVerified = false;
  this.verificationStatus = 'rejected';
  this.verificationNotes = notes;
  return await this.save();
};

// Method to get analytics
companySchema.methods.getAnalytics = function () {
  return {
    totalCustomers: this.totalCustomers,
    totalTransactions: this.totalTransactions,
    totalSavings: this.totalSavings,
    monthlyRevenue: this.monthlyRevenue,
    averageRating: this.rating.average,
    ratingCount: this.rating.count,
    activeBranches: this.activeBranchesCount,
    joinDate: this.joinDate
  };
};

module.exports = mongoose.model('Company', companySchema);
