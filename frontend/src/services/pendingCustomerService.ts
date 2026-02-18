import axios from 'axios';

import { API_BASE_URL } from './apiConfig';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export interface PendingCustomer {
    _id: string;
    fullName: string;
    phone: string;
    idNumber?: string;
    location?: string;
    profilePicUrl?: string;
    registrationDate: string;
    amount: number;
    validUntil: string;
    createdBy: {
        _id: string;
        fullName: string;
        phone: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: {
        _id: string;
        fullName: string;
    };
    reviewedAt?: string;
    rejectionReason?: string;
    createdAt: string;
}

export interface CreatePendingCustomerData {
    fullName: string;
    phone: string;
    idNumber?: string;
    location?: string;
    profilePicUrl?: string;
    registrationDate: string;
    amount: number;
}

export const pendingCustomerService = {
    // Create pending customer (Marketer only)
    createPendingCustomer: async (data: CreatePendingCustomerData): Promise<{ pendingCustomer: PendingCustomer }> => {
        try {
            const response = await api.post('/pending-customers/create', data);
            return response.data.data;
        } catch (error: any) {
            console.error('Create pending customer error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get all pending customers (SuperAdmin only)
    getAllPendingCustomers: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<{ pendingCustomers: PendingCustomer[]; pagination: any }> => {
        try {
            const response = await api.get('/pending-customers', { params });
            return response.data.data;
        } catch (error: any) {
            console.error('Get all pending customers error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get marketer's pending customers (Marketer only)
    getMyPendingCustomers: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        pendingCustomers: PendingCustomer[];
        stats: { pending: number; approved: number; rejected: number; };
        pagination: any;
    }> => {
        try {
            const response = await api.get('/pending-customers/my-customers', { params });
            return response.data.data;
        } catch (error: any) {
            console.error('Get my pending customers error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Approve pending customer (SuperAdmin only)
    approvePendingCustomer: async (id: string): Promise<{ user: any; marketerEarnings: number }> => {
        try {
            const response = await api.post(`/pending-customers/${id}/approve`);
            return response.data.data;
        } catch (error: any) {
            console.error('Approve pending customer error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Reject pending customer (SuperAdmin only)
    rejectPendingCustomer: async (id: string, reason?: string): Promise<{ pendingCustomer: PendingCustomer }> => {
        try {
            const response = await api.post(`/pending-customers/${id}/reject`, { reason });
            return response.data.data;
        } catch (error: any) {
            console.error('Reject pending customer error:', error.response?.data || error.message);
            throw error;
        }
    }
};
