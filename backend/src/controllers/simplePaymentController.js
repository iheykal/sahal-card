const SahalCard = require('../models/SahalCard');
const User = require('../models/User');

// Mark user as valid
const markAsValid = async (req, res) => {
  try {
    console.log('markAsValid called with:', req.body);
    const { cardNumber, notes } = req.body;

    const card = await SahalCard.findOne({ cardNumber }).populate('userId');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    await card.markAsValid(notes || '');

    res.json({
      success: true,
      message: 'User marked as valid',
      data: {
        cardNumber: card.cardNumber,
        customerName: card.userId.fullName,
        paymentStatus: card.paymentStatus,
        nextPaymentDue: card.nextPaymentDue,
        validUntil: card.validUntil,
        lastPaymentDate: card.lastPaymentDate
      }
    });

  } catch (error) {
    console.error('Mark as valid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as valid',
      error: error.message
    });
  }
};

// Mark user as invalid
const markAsInvalid = async (req, res) => {
  try {
    console.log('markAsInvalid called with:', req.body);
    const { cardNumber, notes } = req.body;

    const card = await SahalCard.findOne({ cardNumber }).populate('userId');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    await card.markAsInvalid(notes || '');

    res.json({
      success: true,
      message: 'User marked as invalid',
      data: {
        cardNumber: card.cardNumber,
        customerName: card.userId.fullName,
        paymentStatus: card.paymentStatus,
        nextPaymentDue: card.nextPaymentDue,
        suspensionReason: card.suspensionReason
      }
    });

  } catch (error) {
    console.error('Mark as invalid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as invalid',
      error: error.message
    });
  }
};

// Get all users with payment status
const getAllPaymentStatus = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (status) {
      query.paymentStatus = status;
    }

    const cards = await SahalCard.find(query)
      .populate('userId', 'fullName phone email')
      .sort({ nextPaymentDue: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SahalCard.countDocuments(query);

    const result = cards.map(card => ({
      cardNumber: card.cardNumber,
      customerName: card.userId.fullName,
      phone: card.userId.phone,
      email: card.userId.email,
      paymentStatus: card.paymentStatus,
      nextPaymentDue: card.nextPaymentDue,
      lastPaymentDate: card.lastPaymentDate,
      validUntil: card.validUntil,
      isActive: card.isActive,
      paymentNotes: card.paymentNotes,
      daysUntilDue: Math.ceil((card.nextPaymentDue - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      data: {
        users: result,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

// Get payment summary
const getPaymentSummary = async (req, res) => {
  try {
    const totalUsers = await SahalCard.countDocuments();
    const validUsers = await SahalCard.countDocuments({ paymentStatus: 'valid' });
    const invalidUsers = await SahalCard.countDocuments({ paymentStatus: 'invalid' });
    
    const overdueUsers = await SahalCard.countDocuments({
      paymentStatus: 'valid',
      nextPaymentDue: { $lt: new Date() }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        validUsers,
        invalidUsers,
        overdueUsers,
        paymentRate: totalUsers > 0 ? ((validUsers / totalUsers) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment summary',
      error: error.message
    });
  }
};

module.exports = {
  markAsValid,
  markAsInvalid,
  getAllPaymentStatus,
  getPaymentSummary
};
