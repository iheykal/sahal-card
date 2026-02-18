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

export interface Marketer {
    _id: string;
    fullName: string;
    phone: string;
    profilePicUrl?: string;
    governmentIdUrl: string;
    totalEarnings: number;
    approvedCustomers: number;
    canLogin: boolean;
    createdAt: string;
    role: 'marketer';
}

export interface CreateMarketerData {
    fullName: string;
    phone: string;
    profilePicUrl?: string;
    governmentIdUrl: string;
    password: string;
}

export interface RegisteredUser {
    _id: string;
    fullName: string;
    phone: string;
    location?: string;
    profilePicUrl?: string;
    validUntil?: string;
    createdAt: string;
    membershipMonths: number;
}

export const marketerService = {
    // Create marketer (SuperAdmin only)
    createMarketer: async (data: CreateMarketerData): Promise<{ marketer: Marketer; credentials: { phone: string; password: string } }> => {
        try {
            const response = await api.post('/marketers/create', data);
            return response.data.data;
        } catch (error: any) {
            console.error('Create marketer error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get all marketers (SuperAdmin only)
    getAllMarketers: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{ marketers: Marketer[]; pagination: any }> => {
        try {
            const response = await api.get('/marketers', { params });
            return response.data.data;
        } catch (error: any) {
            console.error('Get all marketers error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get single marketer
    getMarketer: async (id: string): Promise<{ marketer: Marketer }> => {
        try {
            const response = await api.get(`/marketers/${id}`);
            return response.data.data;
        } catch (error: any) {
            console.error('Get marketer error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Update marketer (SuperAdmin only)
    updateMarketer: async (id: string, data: Partial<CreateMarketerData>): Promise<{ marketer: Marketer }> => {
        try {
            const response = await api.put(`/marketers/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            console.error('Update marketer error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Delete marketer (SuperAdmin only)
    deleteMarketer: async (id: string): Promise<void> => {
        try {
            await api.delete(`/marketers/${id}`);
        } catch (error: any) {
            console.error('Delete marketer error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get marketer earnings
    getMarketerEarnings: async (id: string): Promise<{
        fullName: string;
        totalEarnings: number;
        approvedCustomers: number;
        commissionRate: number;
    }> => {
        try {
            const response = await api.get(`/marketers/${id}/earnings`);
            return response.data.data;
        } catch (error: any) {
            console.error('Get marketer earnings error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get users registered by a specific marketer
    getMarketerRegisteredUsers: async (id: string): Promise<{
        marketer: Marketer;
        marketer: Marketer;
        registeredUsers: RegisteredUser[];
        totalRegistered: number;
    }> => {
        try {
            const response = await api.get(`/marketers/${id}/registered-users`);
            return response.data.data;
        } catch (error: any) {
            console.error('Get marketer registered users error:', error.response?.data || error.message);
            throw error;
        }
    }
};
