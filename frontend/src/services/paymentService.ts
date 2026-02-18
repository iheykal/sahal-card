export interface PaymentStatus {
  cardNumber: string;
  paymentStatus: 'current' | 'overdue' | 'suspended' | 'cancelled';
  nextPaymentDue: string;
  daysUntilDue: number;
  monthlyFee: number;
  isValid: boolean;
  validUntil: string;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  paidAt: string;
  amount: number;
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'cash';
  transactionId?: string;
  validUntil: string;
}

export interface PaymentHistory {
  cardNumber: string;
  paymentHistory: PaymentRecord[];
  totalPayments: number;
  totalAmountPaid: number;
}

export interface PaymentRequest {
  cardNumber: string;
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'cash';
  transactionId?: string;
}

export interface FlexiblePaymentRequest {
  cardNumber: string;
  amount: number;
  paymentMethod?: 'mobile_money' | 'bank_transfer' | 'cash';
  transactionId?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    cardNumber: string;
    nextPaymentDue: string;
    validUntil: string;
    paymentStatus: string;
    amount: number;
    transactionId: string;
    customerName?: string;
    monthsAdded?: number;
  };
  error?: string;
}

export interface PaymentSummary {
  totalUsers: number;
  validUsers: number;
  invalidUsers: number;
  overdueUsers: number;
  paymentRate: string;
}

export interface UserPaymentStatus {
  cardNumber: string;
  customerName: string;
  phone: string;
  email: string;
  paymentStatus: string;
  nextPaymentDue: string;
  lastPaymentDate: string;
  validUntil: string;
  isActive: boolean;
  paymentNotes: string;
  daysUntilDue: number;
}

import { API_BASE_URL } from './apiConfig';

// Get payment status for a card
export const getPaymentStatus = async (cardNumber: string): Promise<PaymentStatus> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/payments/status/${cardNumber}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get payment status');
  }

  const data = await response.json();
  return data.data;
};

// Process monthly payment
export const processPayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/payments/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Payment failed');
  }

  return data;
};

// Get payment history for a card
export const getPaymentHistory = async (cardNumber: string): Promise<PaymentHistory> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/payments/history/${cardNumber}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get payment history');
  }

  const data = await response.json();
  return data.data;
};

// Process flexible payment (admin function)
export const processFlexiblePayment = async (paymentData: FlexiblePaymentRequest): Promise<PaymentResponse> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/payments/flexible`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Flexible payment failed');
  }

  return data;
};

// Record manual payment (admin function)
export const recordManualPayment = async (paymentData: FlexiblePaymentRequest): Promise<PaymentResponse> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/payments/manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Manual payment recording failed');
  }

  return data;
};

// Get payment summary (admin function)
export const getPaymentSummary = async (): Promise<PaymentSummary> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/simple-payments/summary`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get payment summary');
  }

  const data = await response.json();
  return data.data;
};

// Get all users payment status (admin function)
export const getAllUsersPaymentStatus = async (status?: string, page = 1, limit = 50): Promise<{ users: UserPaymentStatus[], pagination: any }> => {
  const token = localStorage.getItem('token');

  const url = new URL(`${API_BASE_URL}/simple-payments/status`);
  if (status) {
    url.searchParams.append('status', status);
  }
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', limit.toString());

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get users payment status');
  }

  const data = await response.json();
  return data.data;
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calculate days until due
export const getDaysUntilDue = (dueDate: string): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Check if payment is overdue
export const isPaymentOverdue = (dueDate: string): boolean => {
  return getDaysUntilDue(dueDate) < 0;
};

// Get payment status color for UI
export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'current':
      return 'text-green-600';
    case 'overdue':
      return 'text-red-600';
    case 'suspended':
      return 'text-red-600';
    case 'cancelled':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

// Get payment status badge color for UI
export const getPaymentStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'current':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
