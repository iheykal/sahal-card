import React, { useState, useEffect } from 'react';
import { 
  getPaymentStatus, 
  processPayment, 
  formatCurrency, 
  formatDate, 
  getDaysUntilDue, 
  isPaymentOverdue,
  getPaymentStatusColor,
  getPaymentStatusBadgeColor,
  PaymentStatus,
  PaymentRequest
} from '../services/paymentService';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface PaymentComponentProps {
  cardNumber: string;
  onPaymentSuccess?: () => void;
}

const PaymentComponent: React.FC<PaymentComponentProps> = ({ 
  cardNumber, 
  onPaymentSuccess 
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mobile_money' | 'bank_transfer' | 'cash'>('mobile_money');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    fetchPaymentStatus();
  }, [cardNumber]);

  const fetchPaymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await getPaymentStatus(cardNumber);
      setPaymentStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment status');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentStatus) return;

    try {
      setProcessing(true);
      setError(null);

      const paymentData: PaymentRequest = {
        cardNumber,
        paymentMethod: selectedPaymentMethod,
        transactionId: transactionId || undefined
      };

      const result = await processPayment(paymentData);
      
      if (result.success) {
        // Refresh payment status
        await fetchPaymentStatus();
        onPaymentSuccess?.();
        
        // Show success message with green notification box
        const newValidUntil = new Date(result.validUntil || new Date());
        setSuccessMessage(`Payment successful! User is now valid until ${newValidUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (err) {
      console.error('Payment error:', err);
      let errorMessage = 'Payment failed';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        // Handle API error responses
        const apiError = err as any;
        if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      }
      
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchPaymentStatus}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No payment information available</p>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue(paymentStatus.nextPaymentDue);
  const isOverdue = isPaymentOverdue(paymentStatus.nextPaymentDue);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment Status</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusBadgeColor(paymentStatus.paymentStatus)}`}>
          {paymentStatus.paymentStatus.charAt(0).toUpperCase() + paymentStatus.paymentStatus.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Card Number</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{paymentStatus.cardNumber}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Fee</label>
            <p className="mt-1 text-sm text-gray-900">{formatCurrency(paymentStatus.monthlyFee)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Next Payment Due</label>
            <p className={`mt-1 text-sm ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(paymentStatus.nextPaymentDue)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Days Until Due</label>
            <p className={`mt-1 text-sm font-medium ${isOverdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Card Status</label>
            <p className={`mt-1 text-sm ${paymentStatus.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {paymentStatus.isValid ? 'Active' : 'Inactive'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Valid Until</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(paymentStatus.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {(isOverdue || paymentStatus.paymentStatus === 'suspended') && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Make Payment</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID if available"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Amount to Pay</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(paymentStatus.monthlyFee)}</p>
              </div>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {paymentStatus.paymentHistory && paymentStatus.paymentHistory.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {paymentStatus.paymentHistory.slice(0, 5).map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(payment.paidAt)} • {payment.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Valid until: {formatDate(payment.validUntil)}
                  </p>
                  {payment.transactionId && (
                    <p className="text-xs text-gray-400 font-mono">
                      {payment.transactionId}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    
    {/* Success Message Notification */}
    <AnimatePresence>
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-md"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <CheckCircle className="mr-2" size={20} />
              <span>{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-4 text-white hover:text-green-100"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentComponent;
