// Shared TypeScript types for SAHAL CARD

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  photo?: string;
  location: string;
  role: 'customer' | 'company' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SahalCard {
  _id: string;
  userId: string;
  cardNumber: string;
  qrCode: string;
  isActive: boolean;
  validUntil: Date;
  membershipFee: number;
  totalSavings: number;
  createdAt: Date;
  renewedAt?: Date;
}

export interface Company {
  _id: string;
  userId: string;
  businessName: string;
  businessType: string;
  discountRate: number;
  branches: Branch[];
  logo?: string;
  isVerified: boolean;
  totalCustomers: number;
  totalSavings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
}

export interface Transaction {
  _id: string;
  customerId: string;
  companyId: string;
  amount: number;
  discount: number;
  savings: number;
  location: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form interfaces
export interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  password: string;
  confirmPassword: string;
  location: string;
  role: 'customer' | 'company';
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface SahalCardForm {
  fullName: string;
  idNumber: string;
  photo: File | null;
  location: string;
  paymentMethod: 'card' | 'mobile';
}

export interface CompanyForm {
  businessName: string;
  businessType: string;
  discountRate: number;
  branches: Omit<Branch, '_id'>[];
  logo: File | null;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
}

// Dashboard interfaces
export interface DashboardStats {
  totalSavings: number;
  totalTransactions: number;
  activePartners: number;
  cardValidity: {
    isValid: boolean;
    daysRemaining: number;
  };
}

export interface CompanyDashboardStats {
  totalCustomers: number;
  totalTransactions: number;
  totalSavings: number;
  monthlyRevenue: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalSavings: number;
  }>;
}

// Language support
export type Language = 'en' | 'so';

export interface LanguageContent {
  en: string;
  so: string;
}

// Theme configuration
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  shadow: string;
}
