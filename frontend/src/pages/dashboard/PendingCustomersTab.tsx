import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Clock, User, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { pendingCustomerService, PendingCustomer } from '../../services/pendingCustomerService.ts';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import toast from 'react-hot-toast';

const PendingCustomersTab: React.FC = () => {
    const { language } = useTheme();
    const [pendingCustomers, setPendingCustomers] = useState<PendingCustomer[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadPendingCustomers = async () => {
        try {
            console.log('[PendingCustomersTab] Loading pending customers...');
            setLoading(true);
            const response = await pendingCustomerService.getAllPendingCustomers({ status: 'pending' });
            console.log('[PendingCustomersTab] API Response:', response);
            console.log('[PendingCustomersTab] Pending customers count:', response.pendingCustomers.length);
            setPendingCustomers(response.pendingCustomers);
        } catch (error: any) {
            console.error('[PendingCustomersTab] Error loading pending customers:', error);
            console.error('[PendingCustomersTab] Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            toast.error('Failed to load pending customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPendingCustomers();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            setProcessingId(id);
            await pendingCustomerService.approvePendingCustomer(id);
            toast.success('Customer approved successfully!');
            loadPendingCustomers(); // Reload the list
        } catch (error: any) {
            console.error('Error approving customer:', error);
            toast.error(error.response?.data?.message || 'Failed to approve customer');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason (optional):');
        try {
            setProcessingId(id);
            await pendingCustomerService.rejectPendingCustomer(id, reason || undefined);
            toast.success('Customer rejected');
            loadPendingCustomers(); // Reload the list
        } catch (error: any) {
            console.error('Error rejecting customer:', error);
            toast.error(error.response?.data?.message || 'Failed to reject customer');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-7 h-7 text-orange-600" />
                    {language === 'en' ? 'Pending Customer Approvals' : 'Macmiilada Sugitaanka'}
                </h2>
                <p className="text-gray-600 mt-1">
                    {language === 'en'
                        ? 'Review and approve customers submitted by marketers'
                        : 'Eeg oo ogolow macmiilada ay soo gudbiyeen suuqgeeyayaasha'}
                </p>
            </div>

            {/* Pending Customers List */}
            {pendingCustomers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {language === 'en' ? 'No Pending Customers' : 'Ma Jiraan Macmiil Sugitaan'}
                    </h3>
                    <p className="text-gray-500">
                        {language === 'en'
                            ? 'All customer submissions have been reviewed'
                            : 'Dhammaan macmiilada ayaa la eegay'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingCustomers.map((customer) => (
                        <div
                            key={customer._id}
                            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                {/* Customer Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        {customer.profilePicUrl ? (
                                            <img
                                                src={customer.profilePicUrl}
                                                alt={customer.fullName}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <User className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{customer.fullName}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Phone className="w-4 h-4" />
                                                {customer.phone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {customer.idNumber && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">ID: {customer.idNumber}</span>
                                            </div>
                                        )}
                                        {customer.location && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm">{customer.location}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm">
                                                {new Date(customer.registrationDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <DollarSign className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-semibold">${customer.amount}</span>
                                        </div>
                                    </div>

                                    {/* Submitted By */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <p className="text-xs text-gray-500 mb-1">
                                            {language === 'en' ? 'Submitted by Marketer:' : 'Waxaa soo gudbiyay:'}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900">{customer.createdBy?.fullName || 'Unknown'}</p>
                                        <p className="text-xs text-gray-600">{customer.createdBy?.phone || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 ml-4">
                                    <button
                                        onClick={() => handleApprove(customer._id)}
                                        disabled={processingId === customer._id}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        {language === 'en' ? 'Approve' : 'Ogolow'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(customer._id)}
                                        disabled={processingId === customer._id}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X className="w-5 h-5" />
                                        {language === 'en' ? 'Reject' : 'Diid'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingCustomersTab;
