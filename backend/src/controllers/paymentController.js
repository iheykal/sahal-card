const SahalCard = require('../models/SahalCard');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Process monthly payment
const processMonthlyPayment = async (req, res) => {
  try {
    console.log('🔍 Payment processing started');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 User ID:', req.user?.id);
    
    const { cardNumber, paymentMethod, transactionId } = req.body;
    const userId = req.user.id;
    
    console.log('🔍 Extracted data:', { cardNumber, paymentMethod, transactionId, userId });

    // Find the card
    console.log('🔍 Searching for card:', { cardNumber, userId });
    const card = await SahalCard.findOne({ 
      cardNumber, 
      userId 
    }).populate('userId');

    console.log('🔍 Card found:', card ? 'Yes' : 'No');
    if (card) {
      console.log('🔍 Card details:', {
        cardNumber: card.cardNumber,
        isValid: card.isValid,
        paymentStatus: card.paymentStatus,
        nextPaymentDue: card.nextPaymentDue,
        monthlyFee: card.monthlyFee
      });
    }

    if (!card) {
      console.log('❌ Card not found for user');
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check if payment is needed
    const now = new Date();
    if (card.nextPaymentDue > now && card.paymentStatus === 'current') {
      return res.status(400).json({
        success: false,
        message: 'Payment not due yet',
        data: {
          nextPaymentDue: card.nextPaymentDue,
          daysRemaining: Math.ceil((card.nextPaymentDue - now) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Manual payment record - no gateway needed
    const paymentResult = {
      success: true,
      transactionId: transactionId || `MANUAL_${Date.now()}`,
      amount: card.monthlyFee
    };

    // Renew the card for another month
    await card.renewMonthly({
      paymentMethod,
      transactionId: paymentResult.transactionId
    });

    // Create a transaction record for the payment
    await Transaction.createTransaction({
      customerId: card.userId._id,
      companyId: null, // Payment transaction
      sahacardId: card._id,
      amount: card.monthlyFee,
      discount: 0,
      savings: 0,
      originalAmount: card.monthlyFee,
      discountRate: 0,
      location: 'Online Payment',
      items: [{
        name: 'Monthly Sahal Card Subscription',
        quantity: 1,
        unitPrice: card.monthlyFee,
        totalPrice: card.monthlyFee
      }],
      paymentMethod: paymentMethod,
      status: 'completed',
      notes: `Monthly subscription payment - ${paymentMethod}`
    });

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { sahacardId: card._id },
      {
        $push: {
          billingHistory: {
            billedAt: new Date(),
            amount: card.monthlyFee,
            status: 'paid',
            transactionId: paymentResult.transactionId,
            paymentMethod
          }
        },
        nextBillingDate: card.nextPaymentDue
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        cardNumber: card.cardNumber,
        nextPaymentDue: card.nextPaymentDue,
        validUntil: card.validUntil,
        paymentStatus: card.paymentStatus,
        amount: card.monthlyFee,
        transactionId: paymentResult.transactionId
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user?.id);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message,
      details: {
        type: error.name,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { cardNumber } = req.params;
    const userId = req.user.id;

    const card = await SahalCard.findOne({ 
      cardNumber, 
      userId 
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Check current payment status
    await card.checkPaymentStatus();

    const now = new Date();
    const daysUntilDue = Math.ceil((card.nextPaymentDue - now) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        cardNumber: card.cardNumber,
        paymentStatus: card.paymentStatus,
        nextPaymentDue: card.nextPaymentDue,
        daysUntilDue,
        monthlyFee: card.monthlyFee,
        isValid: card.isValid,
        validUntil: card.validUntil,
        paymentHistory: card.paymentHistory.slice(-5) // Last 5 payments
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

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const { cardNumber } = req.params;
    const userId = req.user.id;

    const card = await SahalCard.findOne({ 
      cardNumber, 
      userId 
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    res.json({
      success: true,
      data: {
        cardNumber: card.cardNumber,
        paymentHistory: card.paymentHistory,
        totalPayments: card.paymentHistory.length,
        totalAmountPaid: card.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
};

// Manual payment record entry (admin function)
const recordManualPayment = async (req, res) => {
  try {
    const { cardNumber, paymentMethod, transactionId, amount, notes } = req.body;
    const adminId = req.user.id;

    // Find the card
    const card = await SahalCard.findOne({ cardNumber }).populate('userId');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Record the manual payment
    const paymentResult = {
      success: true,
      transactionId: transactionId || `MANUAL_${Date.now()}`,
      amount: amount || card.monthlyFee
    };

    // Renew the card for another month
    await card.renewMonthly({
      paymentMethod: paymentMethod || 'cash',
      transactionId: paymentResult.transactionId
    });

    // Create a transaction record for the payment
    await Transaction.createTransaction({
      customerId: card.userId._id,
      companyId: null, // Manual payment
      sahacardId: card._id,
      amount: paymentResult.amount,
      discount: 0,
      savings: 0,
      originalAmount: paymentResult.amount,
      discountRate: 0,
      location: 'Manual Payment Entry',
      items: [{
        name: 'Monthly Sahal Card Subscription',
        quantity: 1,
        unitPrice: paymentResult.amount,
        totalPrice: paymentResult.amount
      }],
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      notes: `Manual payment entry by admin - ${notes || 'No notes'}`
    });

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { sahacardId: card._id },
      {
        $push: {
          billingHistory: {
            billedAt: new Date(),
            amount: paymentResult.amount,
            status: 'paid',
            transactionId: paymentResult.transactionId,
            paymentMethod: paymentMethod || 'cash'
          }
        },
        nextBillingDate: card.nextPaymentDue
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Manual payment recorded successfully',
      data: {
        cardNumber: card.cardNumber,
        customerName: card.userId.fullName,
        nextPaymentDue: card.nextPaymentDue,
        validUntil: card.validUntil,
        paymentStatus: card.paymentStatus,
        amount: paymentResult.amount,
        transactionId: paymentResult.transactionId
      }
    });

  } catch (error) {
    console.error('Manual payment recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record manual payment',
      error: error.message
    });
  }
};

// Flexible payment entry (admin function) - $1 = 1 month
const processFlexiblePayment = async (req, res) => {
  try {
    const { cardNumber, amount, paymentMethod, transactionId, notes } = req.body;
    const adminId = req.user.id;

    // Find the card
    const card = await SahalCard.findOne({ cardNumber }).populate('userId');

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    // Calculate months from amount ($1 = 1 month)
    const months = Math.floor(amount);
    if (months <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least $1 (1 month)'
      });
    }

    // Record the flexible payment
    const paymentResult = {
      success: true,
      transactionId: transactionId || `FLEXIBLE_${Date.now()}`,
      amount: amount
    };

    // Extend the card for the specified months
    const currentValidUntil = new Date(card.validUntil);
    const newValidUntil = new Date(currentValidUntil);
    newValidUntil.setMonth(newValidUntil.getMonth() + months);

    // Update card validity
    card.validUntil = newValidUntil;
    card.nextPaymentDue = newValidUntil;
    card.paymentStatus = 'current';
    card.paymentHistory.push({
      amount: amount,
      paymentMethod: paymentMethod || 'cash',
      transactionId: paymentResult.transactionId,
      paidAt: new Date(),
      months: months,
      type: 'flexible'
    });
    await card.save();

    // Create a transaction record for the payment
    await Transaction.createTransaction({
      customerId: card.userId._id,
      companyId: null, // Flexible payment
      sahacardId: card._id,
      amount: amount,
      discount: 0,
      savings: 0,
      originalAmount: amount,
      discountRate: 0,
      location: 'Flexible Payment Entry',
      items: [{
        name: `Sahal Card Subscription - ${months} month(s)`,
        quantity: months,
        unitPrice: 1,
        totalPrice: amount
      }],
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      notes: `Flexible payment entry by admin - ${months} month(s) - ${notes || 'No notes'}`
    });

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { sahacardId: card._id },
      {
        $push: {
          billingHistory: {
            billedAt: new Date(),
            amount: amount,
            status: 'paid',
            transactionId: paymentResult.transactionId,
            paymentMethod: paymentMethod || 'cash',
            months: months
          }
        },
        nextBillingDate: newValidUntil
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Flexible payment processed successfully',
      data: {
        cardNumber: card.cardNumber,
        customerName: card.userId.fullName,
        amount: amount,
        months: months,
        nextPaymentDue: card.nextPaymentDue,
        validUntil: card.validUntil,
        paymentStatus: card.paymentStatus,
        transactionId: paymentResult.transactionId
      }
    });

  } catch (error) {
    console.error('Flexible payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process flexible payment',
      error: error.message
    });
  }
};

module.exports = {
  processMonthlyPayment,
  getPaymentStatus,
  getPaymentHistory,
  recordManualPayment,
  processFlexiblePayment
};
