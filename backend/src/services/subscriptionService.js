const SahalCard = require('../models/SahalCard');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');

// Check all cards for overdue payments
const checkOverduePayments = async () => {
  try {
    const now = new Date();
    
    // Find cards with overdue payments
    const overdueCards = await SahalCard.find({
      nextPaymentDue: { $lt: now },
      paymentStatus: { $in: ['current', 'overdue'] },
      status: 'active'
    }).populate('userId');

    console.log(`Found ${overdueCards.length} cards with overdue payments`);

    for (const card of overdueCards) {
      // Suspend the card immediately (no grace period)
      await card.suspend('Payment overdue');
      
      // Send notification to user
      await Notification.create({
        userId: card.userId._id,
        type: 'payment_overdue',
        title: 'Sahal Card Suspended',
        message: `Your Sahal Card has been suspended due to overdue payment. Please make a payment of $${card.monthlyFee} to reactivate your card.`,
        data: {
          cardNumber: card.cardNumber,
          amount: card.monthlyFee,
          nextPaymentDue: card.nextPaymentDue
        }
      });

      // Update subscription status
      await Subscription.findOneAndUpdate(
        { sahacardId: card._id },
        { status: 'suspended' }
      );

      console.log(`Card ${card.cardNumber} suspended due to overdue payment`);
    }

    console.log(`Processed ${overdueCards.length} overdue payments`);
  } catch (error) {
    console.error('Error checking overdue payments:', error);
  }
};

// Send payment reminders
const sendPaymentReminders = async () => {
  try {
    const now = new Date();
    const reminderDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days before due

    const cardsDueSoon = await SahalCard.find({
      nextPaymentDue: { $lte: reminderDate, $gt: now },
      paymentStatus: 'current',
      status: 'active'
    }).populate('userId');

    console.log(`Found ${cardsDueSoon.length} cards due for payment soon`);

    for (const card of cardsDueSoon) {
      const daysUntilDue = Math.ceil((card.nextPaymentDue - now) / (1000 * 60 * 60 * 24));
      
      await Notification.create({
        userId: card.userId._id,
        type: 'payment_reminder',
        title: 'Payment Due Soon',
        message: `Your Sahal Card payment of $${card.monthlyFee} is due in ${daysUntilDue} days.`,
        data: {
          cardNumber: card.cardNumber,
          amount: card.monthlyFee,
          nextPaymentDue: card.nextPaymentDue,
          daysRemaining: daysUntilDue
        }
      });
    }

    console.log(`Sent payment reminders for ${cardsDueSoon.length} cards`);
  } catch (error) {
    console.error('Error sending payment reminders:', error);
  }
};

// Send final payment reminders (1 day before due)
const sendFinalPaymentReminders = async () => {
  try {
    const now = new Date();
    const finalReminderDate = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1 day before due

    const cardsDueTomorrow = await SahalCard.find({
      nextPaymentDue: { $lte: finalReminderDate, $gt: now },
      paymentStatus: 'current',
      status: 'active'
    }).populate('userId');

    console.log(`Found ${cardsDueTomorrow.length} cards due for payment tomorrow`);

    for (const card of cardsDueTomorrow) {
      await Notification.create({
        userId: card.userId._id,
        type: 'final_payment_reminder',
        title: 'Final Payment Reminder',
        message: `Your Sahal Card payment of $${card.monthlyFee} is due tomorrow. Make payment now to avoid suspension.`,
        data: {
          cardNumber: card.cardNumber,
          amount: card.monthlyFee,
          nextPaymentDue: card.nextPaymentDue
        }
      });
    }

    console.log(`Sent final payment reminders for ${cardsDueTomorrow.length} cards`);
  } catch (error) {
    console.error('Error sending final payment reminders:', error);
  }
};

// Get subscription statistics
const getSubscriptionStats = async () => {
  try {
    const now = new Date();
    
    const stats = await SahalCard.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$monthlyFee' }
        }
      }
    ]);

    const overdueCount = await SahalCard.countDocuments({
      nextPaymentDue: { $lt: now },
      paymentStatus: 'current'
    });

    const dueSoonCount = await SahalCard.countDocuments({
      nextPaymentDue: { 
        $lte: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)),
        $gt: now 
      },
      paymentStatus: 'current'
    });

    return {
      statusBreakdown: stats,
      overdueCount,
      dueSoonCount,
      totalActiveCards: await SahalCard.countDocuments({ status: 'active' }),
      totalSuspendedCards: await SahalCard.countDocuments({ status: 'suspended' })
    };
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    return null;
  }
};

// Reactivate card after payment
const reactivateCardAfterPayment = async (cardId, paymentData) => {
  try {
    const card = await SahalCard.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    // Reactivate the card
    await card.reactivate();
    
    // Update subscription status
    await Subscription.findOneAndUpdate(
      { sahacardId: cardId },
      { status: 'active' }
    );

    // Send reactivation notification
    await Notification.create({
      userId: card.userId,
      type: 'card_reactivated',
      title: 'Sahal Card Reactivated',
      message: `Your Sahal Card has been reactivated successfully. Next payment due: ${card.nextPaymentDue.toDateString()}`,
      data: {
        cardNumber: card.cardNumber,
        nextPaymentDue: card.nextPaymentDue,
        amount: card.monthlyFee
      }
    });

    console.log(`Card ${card.cardNumber} reactivated after payment`);
    return card;
  } catch (error) {
    console.error('Error reactivating card:', error);
    throw error;
  }
};

module.exports = {
  checkOverduePayments,
  sendPaymentReminders,
  sendFinalPaymentReminders,
  getSubscriptionStats,
  reactivateCardAfterPayment
};

