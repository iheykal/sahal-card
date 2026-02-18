const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'promotion', 'reminder'],
    default: 'info'
  },
  category: {
    type: String,
    enum: [
      'card_expiry', 'new_partner', 'discount_offer', 'transaction',
      'system', 'promotion', 'reminder', 'verification', 'other'
    ],
    default: 'other'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot exceed 50 characters']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for notification status
notificationSchema.virtual('status').get(function() {
  if (this.expiresAt && this.expiresAt < new Date()) {
    return 'expired';
  }
  if (!this.isActive) {
    return 'inactive';
  }
  return this.isRead ? 'read' : 'unread';
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  return await notification.save();
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(notifications) {
  return await this.insertMany(notifications);
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    type = null, 
    category = null, 
    isRead = null,
    priority = null 
  } = options;
  
  const query = { 
    userId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (type) query.type = type;
  if (category) query.category = category;
  if (isRead !== null) query.isRead = isRead;
  if (priority) query.priority = priority;
  
  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = async function(title, message, options = {}) {
  const {
    type = 'info',
    category = 'system',
    priority = 'medium',
    actionUrl = null,
    actionText = null,
    metadata = {},
    expiresAt = null
  } = options;
  
  // Get all active users
  const User = mongoose.model('User');
  const users = await User.find({ isActive: true }).select('_id');
  
  const notifications = users.map(user => ({
    userId: user._id,
    title,
    message,
    type,
    category,
    priority,
    actionUrl,
    actionText,
    metadata,
    expiresAt
  }));
  
  return await this.createBulkNotifications(notifications);
};

// Static method to create card expiry notifications
notificationSchema.statics.createCardExpiryNotifications = async function() {
  const SahalCard = mongoose.model('SahalCard');
  const User = mongoose.model('User');
  
  // Find cards expiring in 30, 7, and 1 days
  const expiryDates = [30, 7, 1];
  const notifications = [];
  
  for (const days of expiryDates) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const expiringCards = await SahalCard.find({
      validUntil: {
        $gte: new Date(expiryDate.getTime() - 24 * 60 * 60 * 1000),
        $lt: new Date(expiryDate.getTime() + 24 * 60 * 60 * 1000)
      },
      isActive: true
    }).populate('userId');
    
    for (const card of expiringCards) {
      const priority = days === 1 ? 'urgent' : days === 7 ? 'high' : 'medium';
      const title = `Sahal Card Expiry ${days === 1 ? 'Tomorrow' : `in ${days} days`}`;
      const message = `Your Sahal Card (${card.cardNumber}) will expire ${days === 1 ? 'tomorrow' : `in ${days} days`}. Renew now to continue saving!`;
      
      notifications.push({
        userId: card.userId._id,
        title,
        message,
        type: days === 1 ? 'error' : 'warning',
        category: 'card_expiry',
        priority,
        actionUrl: '/dashboard/sahal-card/renew',
        actionText: 'Renew Now',
        metadata: {
          cardId: card._id,
          cardNumber: card.cardNumber,
          expiryDate: card.validUntil,
          daysRemaining: days
        }
      });
    }
  }
  
  if (notifications.length > 0) {
    return await this.createBulkNotifications(notifications);
  }
  
  return [];
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  return await this.save();
};

// Method to deactivate
notificationSchema.methods.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
