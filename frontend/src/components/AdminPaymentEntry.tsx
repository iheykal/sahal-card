import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from '../services/apiConfig';

interface AdminPaymentEntryProps {
  onPaymentRecorded?: () => void;
}

const AdminPaymentEntry: React.FC<AdminPaymentEntryProps> = ({ onPaymentRecorded }) => {
  const [paymentType, setPaymentType] = useState<'monthly' | 'flexible'>('flexible');
  const [monthsPreview, setMonthsPreview] = useState(0);
  const [formData, setFormData] = useState({
    cardNumber: '',
    paymentMethod: 'cash' as 'mobile_money' | 'bank_transfer' | 'cash',
    transactionId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate months preview for flexible payments
  useEffect(() => {
    if (paymentType === 'flexible' && formData.amount) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > 0) {
        setMonthsPreview(Math.floor(amount));
      } else {
        setMonthsPreview(0);
      }
    } else {
      setMonthsPreview(0);
    }
  }, [formData.amount, paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cardNumber.trim()) {
      setError('Card number is required');
      return;
    }

    if (paymentType === 'flexible') {
      if (!formData.amount || formData.amount.trim() === '') {
        setError('Amount is required for flexible payments');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount greater than $0');
        return;
      }

      if (amount > 120) {
        setError('Amount cannot exceed $120 (maximum 120 months)');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Choose endpoint based on payment type
      const endpoint = paymentType === 'flexible' ? '/payments/flexible' : '/payments/manual';

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          cardNumber: formData.cardNumber.trim(),
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId.trim() || undefined,
          amount: paymentType === 'flexible' ? parseFloat(formData.amount) : (formData.amount ? parseFloat(formData.amount) : undefined)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record payment');
      }

      const successMessage = paymentType === 'flexible'
        ? `Payment recorded successfully for ${data.data.customerName} (${data.data.cardNumber}) - ${data.data.monthsAdded} month(s) added`
        : `Payment recorded successfully for ${data.data.customerName} (${data.data.cardNumber})`;

      setSuccess(successMessage);

      // Reset form
      setFormData({
        cardNumber: '',
        paymentMethod: 'cash',
        transactionId: '',
        amount: ''
      });

      onPaymentRecorded?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Manual Payment Entry</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
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
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="flexible"
                checked={paymentType === 'flexible'}
                onChange={(e) => setPaymentType(e.target.value as 'monthly' | 'flexible')}
                className="mr-2"
              />
              Flexible Duration ($1 = 1 month)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="monthly"
                checked={paymentType === 'monthly'}
                onChange={(e) => setPaymentType(e.target.value as 'monthly' | 'flexible')}
                className="mr-2"
              />
              Standard Monthly
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Card Number *
          </label>
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleInputChange}
            placeholder="Enter Sahal Card number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
            Transaction ID (Optional)
          </label>
          <input
            type="text"
            id="transactionId"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleInputChange}
            placeholder="Enter transaction ID if available"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount {paymentType === 'flexible' ? '($1 = 1 month)' : '(Optional)'} *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder={paymentType === 'flexible' ? 'Enter amount (e.g., 6 for 6 months)' : 'Enter amount (defaults to $1.00)'}
            min="0"
            step="0.01"
            max={paymentType === 'flexible' ? '120' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={paymentType === 'flexible'}
          />
          {paymentType === 'flexible' && monthsPreview > 0 && (
            <p className="mt-1 text-sm text-blue-600 font-medium">
              This will add {monthsPreview} month{monthsPreview !== 1 ? 's' : ''} to the subscription
            </p>
          )}
          {paymentType === 'monthly' && (
            <p className="mt-1 text-sm text-gray-500">Leave empty to use default monthly fee ($1.00)</p>
          )}
        </div>


        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {paymentType === 'flexible'
                  ? 'This will immediately extend the card subscription based on the amount paid ($1 = 1 month). Make sure the payment has been received before recording.'
                  : 'This will immediately reactivate the card for another month. Make sure the payment has been received before recording.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentEntry;
