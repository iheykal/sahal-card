const SahalCard = require('../models/SahalCard');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const QRCode = require('qrcode');

// Register for Sahal Card
const registerCard = async (req, res) => {
  try {
    const { fullName, idNumber, location, paymentMethod } = req.body;
    const userId = req.user._id;

    // Check if user already has a card
    const existingCard = await SahalCard.findOne({ userId });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'You already have a Sahal Card'
      });
    }

    // Create new Sahal Card
    const card = await SahalCard.createCard(userId, 1.00);

    // Generate QR code
    const qrCodeData = {
      cardNumber: card.cardNumber,
      userId: userId,
      validUntil: card.validUntil
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrCodeData));

    // Update user profile if needed
    await User.findByIdAndUpdate(userId, {
      fullName: fullName || req.user.fullName,
      idNumber: idNumber || req.user.idNumber,
      location: location || req.user.location
    });

    // Create success notification
    await Notification.createNotification({
      userId,
      title: 'Sahal Card Created Successfully!',
      message: `Your Sahal Card (${card.cardNumber}) is now active. Start saving with our partner businesses!`,
      type: 'success',
      category: 'card_expiry',
      actionUrl: '/dashboard/sahal-card',
      actionText: 'View Card'
    });

    res.status(201).json({
      success: true,
      message: 'Sahal Card registered successfully',
      data: {
        card: {
          ...card.toObject(),
          qrCodeImage
        }
      }
    });

  } catch (error) {
    console.error('Sahal Card registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register Sahal Card',
      error: error.message
    });
  }
};

// Get user's Sahal Card
const getCard = async (req, res) => {
  try {
    const userId = req.user._id;

    const card = await SahalCard.findOne({ userId });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Sahal Card not found'
      });
    }

    // Generate QR code
    const qrCodeData = {
      cardNumber: card.cardNumber,
      userId: userId,
      validUntil: card.validUntil
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrCodeData));

    res.json({
      success: true,
      data: {
        card: {
          ...card.toObject(),
          qrCodeImage
        }
      }
    });

  } catch (error) {
    console.error('Get Sahal Card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get Sahal Card',
      error: error.message
    });
  }
};

// Renew Sahal Card
const renewCard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod } = req.body;

    const card = await SahalCard.findOne({ userId });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Sahal Card not found'
      });
    }

    // Check if card is already valid for more than 30 days
    const daysRemaining = card.daysRemaining;
    if (daysRemaining > 30) {
      return res.status(400).json({
        success: false,
        message: 'Your card is still valid for more than 30 days'
      });
    }

    // Renew the card
    await card.renew(0.50);

    // Create success notification
    await Notification.createNotification({
      userId,
      title: 'Sahal Card Renewed!',
      message: `Your Sahal Card has been renewed successfully. It's now valid until ${card.validUntil.toLocaleDateString()}.`,
      type: 'success',
      category: 'card_expiry',
      actionUrl: '/dashboard/sahal-card',
      actionText: 'View Card'
    });

    res.json({
      success: true,
      message: 'Sahal Card renewed successfully',
      data: {
        card: card.getStats()
      }
    });

  } catch (error) {
    console.error('Sahal Card renewal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew Sahal Card',
      error: error.message
    });
  }
};

// Get card statistics
const getCardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const card = await SahalCard.findOne({ userId });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Sahal Card not found'
      });
    }

    // Get transaction history
    const transactions = await Transaction.find({ customerId: userId })
      .populate('companyId', 'businessName businessType logo')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly savings
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthlyStats = await Transaction.getStats({
      customerId: userId,
      startDate: currentMonth,
      endDate: nextMonth
    });

    res.json({
      success: true,
      data: {
        card: card.getStats(),
        recentTransactions: transactions,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Get card stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get card statistics',
      error: error.message
    });
  }
};

// Validate card for transaction
const validateCard = async (req, res) => {
  try {
    const { cardNumber } = req.params;

    const card = await SahalCard.findOne({ cardNumber })
      .populate('userId', 'fullName email phone isActive');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Invalid card number'
      });
    }

    if (!card.isValid) {
      let message = 'Card is not valid';
      if (card.paymentStatus === 'invalid') {
        message = 'Card suspended - payment not received. Please contact admin to reactivate.';
      } else if (card.status === 'suspended') {
        message = `Card suspended: ${card.suspensionReason}`;
      }

      return res.status(400).json({
        success: false,
        message,
        data: {
          status: card.statusText,
          paymentStatus: card.paymentStatus,
          nextPaymentDue: card.nextPaymentDue,
          monthlyFee: card.monthlyFee,
          daysRemaining: card.daysRemaining
        }
      });
    }

    if (!card.userId.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Card holder account is inactive'
      });
    }

    res.json({
      success: true,
      message: 'Card is valid',
      data: {
        cardNumber: card.cardNumber,
        customerName: card.userId.fullName,
        isValid: card.isValid,
        paymentStatus: card.paymentStatus,
        nextPaymentDue: card.nextPaymentDue,
        monthlyFee: card.monthlyFee,
        daysRemaining: card.daysRemaining
      }
    });

  } catch (error) {
    console.error('Validate card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate card',
      error: error.message
    });
  }
};

// Process transaction with card
const processTransaction = async (req, res) => {
  try {
    const { cardNumber, companyId, amount, location, items } = req.body;

    // Validate card
    const card = await SahalCard.findOne({ cardNumber })
      .populate('userId', 'fullName email phone isActive');

    if (!card || !card.isValid || !card.userId.isActive) {
      let message = 'Invalid or expired card';
      if (card && card.paymentStatus === 'invalid') {
        message = 'Card suspended - payment not received. Please contact admin to reactivate.';
      } else if (card && card.status === 'suspended') {
        message = `Card suspended: ${card.suspensionReason}`;
      }

      return res.status(400).json({
        success: false,
        message,
        data: card ? {
          paymentStatus: card.paymentStatus,
          nextPaymentDue: card.nextPaymentDue,
          monthlyFee: card.monthlyFee
        } : null
      });
    }

    // Get company and discount rate
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    if (!company || !company.isVerified || !company.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company'
      });
    }

    // Calculate discount and savings
    const discountRate = company.discountRate;
    const discount = (amount * discountRate) / 100;
    const savings = discount;
    const finalAmount = amount - discount;

    // Create transaction
    const transaction = await Transaction.createTransaction({
      customerId: card.userId._id,
      companyId: company._id,
      sahacardId: card._id,
      amount: finalAmount,
      discount,
      savings,
      originalAmount: amount,
      discountRate,
      location,
      items: items || [],
      paymentMethod: 'sahal_card'
    });

    // Update card savings
    await card.addSavings(savings);

    // Update company stats
    await company.addTransaction(amount, savings);

    // Create notifications
    await Promise.all([
      // Customer notification
      Notification.createNotification({
        userId: card.userId._id,
        title: 'Transaction Completed!',
        message: `You saved $${savings.toFixed(2)} at ${company.businessName}. Total savings: $${card.totalSavings.toFixed(2)}`,
        type: 'success',
        category: 'transaction',
        actionUrl: '/dashboard/transactions',
        actionText: 'View Transaction'
      }),
      // Company notification
      Notification.createNotification({
        userId: company.userId,
        title: 'New Transaction',
        message: `${card.userId.fullName} made a purchase and saved $${savings.toFixed(2)}`,
        type: 'info',
        category: 'transaction'
      })
    ]);

    res.json({
      success: true,
      message: 'Transaction completed successfully',
      data: {
        transaction: transaction.summary,
        savings,
        totalSavings: card.totalSavings
      }
    });

  } catch (error) {
    console.error('Process transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process transaction',
      error: error.message
    });
  }
};

// Get transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    if (startDate && endDate) {
      options.startDate = new Date(startDate);
      options.endDate = new Date(endDate);
    }

    const transactions = await Transaction.getCustomerHistory(userId, options);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: transactions.length
        }
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
};

// Suspend card (admin only)
const suspendCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { reason } = req.body;

    const card = await SahalCard.findById(cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    await card.suspend(reason);

    // Create notification
    await Notification.createNotification({
      userId: card.userId,
      title: 'Sahal Card Suspended',
      message: `Your Sahal Card has been suspended. Reason: ${reason}`,
      type: 'error',
      category: 'system'
    });

    res.json({
      success: true,
      message: 'Card suspended successfully'
    });

  } catch (error) {
    console.error('Suspend card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend card',
      error: error.message
    });
  }
};

// Reactivate card (admin only)
const reactivateCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const card = await SahalCard.findById(cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    await card.reactivate();

    // Create notification
    await Notification.createNotification({
      userId: card.userId,
      title: 'Sahal Card Reactivated',
      message: 'Your Sahal Card has been reactivated and is now active.',
      type: 'success',
      category: 'system'
    });

    res.json({
      success: true,
      message: 'Card reactivated successfully'
    });

  } catch (error) {
    console.error('Reactivate card error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate card',
      error: error.message
    });
  }
};

// Admin function to get a user's card by user ID
const getCardByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const card = await SahalCard.findOne({ userId }).populate('userId', 'fullName email phone');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'No card found for this user'
      });
    }

    res.json({
      success: true,
      data: card
    });

  } catch (error) {
    console.error('Error getting card by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get card',
      error: error.message
    });
  }
};

// Admin function to create a card for a user
const createCard = async (req, res) => {
  try {
    const { userId, membershipFee = 1.00 } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a card
    const existingCard = await SahalCard.findOne({ userId });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'User already has a Sahal Card',
        data: {
          cardNumber: existingCard.cardNumber,
          status: existingCard.status
        }
      });
    }

    // Create new card using the static method
    const card = await SahalCard.createCard(userId, membershipFee);

    res.status(201).json({
      success: true,
      message: 'Sahal Card created successfully',
      data: {
        cardNumber: card.cardNumber,
        userId: card.userId,
        status: card.status,
        validUntil: card.validUntil,
        monthlyFee: card.monthlyFee,
        nextPaymentDue: card.nextPaymentDue
      }
    });

  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Sahal Card',
      error: error.message
    });
  }
};

module.exports = {
  registerCard,
  createCard,
  getCard,
  getCardByUserId,
  renewCard,
  getCardStats,
  validateCard,
  processTransaction,
  getTransactionHistory,
  suspendCard,
  reactivateCard
};
