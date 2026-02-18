import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    User,
    Phone,
    MapPin,
    Calendar,
    CreditCard,
    ChevronRight,
    Search,
    // Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import { pendingCustomerService, PendingCustomer } from '../../services/pendingCustomerService.ts';
import { marketerService } from '../../services/marketerService.ts';
import { uploadService } from '../../services/uploadService.ts';

const MarketerDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { language } = useTheme();

    const [earnings, setEarnings] = useState({ totalEarnings: 0, approvedCustomers: 0, commissionRate: 0.40 });
    const [pendingCustomers, setPendingCustomers] = useState<PendingCustomer[]>([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);

    // Fetch next ID when form opens
    useEffect(() => {
        if (showAddCustomerForm) {
            const fetchNextId = async () => {
                try {
                    const response = await fetch('/api/auth/next-id', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setFormData(prev => ({ ...prev, idNumber: data.nextId }));
                    }
                } catch (error) {
                    console.error('Failed to fetch next ID', error);
                }
            };
            fetchNextId();
        }
    }, [showAddCustomerForm]);

    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '+25261',
        idNumber: '',
        location: '',
        registrationDate: new Date().toISOString().split('T')[0],
        amount: '1',
        profilePic: null as File | null
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Load marketer earnings
    const loadEarnings = useCallback(async () => {
        if (!user?._id) return;
        try {
            const data = await marketerService.getMarketerEarnings(user._id);
            setEarnings(data);
        } catch (error) {
            console.error('Error loading earnings:', error);
        }
    }, [user]);

    // Load pending customers
    const loadPendingCustomers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await pendingCustomerService.getMyPendingCustomers({ limit: 100 });
            setPendingCustomers(data.pendingCustomers);
            setStats(data.stats);
        } catch (error) {
            console.error('Error loading pending customers:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEarnings();
        loadPendingCustomers();
    }, [loadEarnings, loadPendingCustomers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            let phoneValue = value;
            if (value && !value.startsWith('+252')) {
                if (value.startsWith('61')) {
                    phoneValue = '+252' + value;
                } else if (value.startsWith('252')) {
                    phoneValue = '+' + value;
                } else {
                    phoneValue = '+25261' + value;
                }
            }
            setFormData(prev => ({ ...prev, [name]: phoneValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, profilePic: file }));
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Upload profile picture if provided
            let profilePicUrl: string | undefined = undefined;
            if (formData.profilePic) {
                const validation = uploadService.validateFile(formData.profilePic);
                if (!validation.isValid) {
                    throw new Error(validation.error || 'Invalid image file');
                }
                const uploadResp = await uploadService.uploadFile(formData.profilePic);
                if (!uploadResp?.success || !uploadResp?.data?.url) {
                    throw new Error('Failed to upload profile picture');
                }
                profilePicUrl = uploadResp.data.url;
            }

            await pendingCustomerService.createPendingCustomer({
                fullName: formData.fullName,
                phone: formData.phone,
                idNumber: formData.idNumber,
                location: formData.location,
                profilePicUrl,
                registrationDate: formData.registrationDate,
                amount: parseInt(formData.amount)
            });

            // Reset form
            setFormData({
                fullName: '',
                phone: '+25261',
                idNumber: '',
                location: '',
                registrationDate: new Date().toISOString().split('T')[0],
                amount: '1',
                profilePic: null
            });
            setPreviewImage(null);
            setShowAddCustomerForm(false);

            // Reload customers
            loadPendingCustomers();

            alert(language === 'en' ? 'Customer submitted for approval!' : 'Macmiilka waxaa loo soo gudbiyay ogolaan!');
        } catch (error: any) {
            console.error('Error creating customer:', error);
            alert(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = pendingCustomers.filter(customer => {
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
        const matchesSearch = !searchQuery ||
            customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10"
                    >
                        <h1 className="text-3xl font-bold mb-2">
                            {language === 'en' ? 'Marketer Dashboard' : 'Dashboard Suuq-geeyaha'}
                        </h1>
                        <p className="text-blue-100 text-lg">
                            {language === 'en' ? `Welcome back, ${user?.fullName}!` : `Ku soo dhawoow, ${user?.fullName}!`}
                        </p>
                    </motion.div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                +${earnings.commissionRate} / user
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {language === 'en' ? 'Total Earnings' : 'Wadarta Dakhliga'}
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">
                            ${earnings.totalEarnings.toFixed(2)}
                        </h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                {stats.approved} Active
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {language === 'en' ? 'Approved Customers' : 'Macaamiisha La Ogolaaday'}
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">
                            {earnings.approvedCustomers}
                        </h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                {language === 'en' ? 'In Review' : 'Dib u eegis'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {language === 'en' ? 'Pending Approval' : 'Sugaya Ogolaansho'}
                        </p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">
                            {stats.pending}
                        </h3>
                    </motion.div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'all'
                                ? 'bg-gray-900 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {language === 'en' ? 'All Customers' : 'Dhammaan'}
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'pending'
                                ? 'bg-orange-500 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {language === 'en' ? 'Pending' : 'Sugayaan'}
                        </button>
                        <button
                            onClick={() => setStatusFilter('approved')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'approved'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {language === 'en' ? 'Approved' : 'La Ogolaaday'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={language === 'en' ? 'Search customers...' : 'Raadi macaamiil...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAddCustomerForm(true)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            {language === 'en' ? 'Add Customer' : 'Ku Dar Macmiil'}
                        </motion.button>
                    </div>
                </div>

                {/* Add Customer Form Modal */}
                <AnimatePresence>
                    {showAddCustomerForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                            >
                                <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {language === 'en' ? 'New Customer' : 'Macmiil Cusub'}
                                        </h2>
                                        <p className="text-gray-500 text-sm">
                                            {language === 'en' ? 'Enter customer details for approval' : 'Geli macluumaadka macmiilka'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddCustomerForm(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <XCircle className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-600" />
                                                {language === 'en' ? 'Full Name' : 'Magaca Oo Dhan'}
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                                placeholder={language === 'en' ? 'E.g. Ahmed Ali' : 'Tusaale: Axmed Cali'}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-green-600" />
                                                {language === 'en' ? 'Phone Number' : 'Telefoonka'}
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all font-mono"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-purple-600" />
                                                {language === 'en' ? 'ID Number' : 'Lambarka Aqoonsiga'}
                                            </label>
                                            <input
                                                type="text"
                                                name="idNumber"
                                                value={formData.idNumber}
                                                onChange={handleInputChange}
                                                disabled
                                                placeholder={language === 'en' ? 'Loading next ID...' : 'Dajinayaa aqoonsiga...'}
                                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed font-mono font-bold"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-red-500" />
                                                {language === 'en' ? 'Location' : 'Goobta'}
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-orange-600" />
                                                {language === 'en' ? 'Registration Date' : 'Taariikhda'}
                                            </label>
                                            <input
                                                type="date"
                                                name="registrationDate"
                                                value={formData.registrationDate}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                                {language === 'en' ? 'Months (USD)' : 'Bilaha (USD)'}
                                            </label>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleInputChange}
                                                required
                                                min="1"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                                            />
                                            <p className="text-xs text-gray-500">1 USD = 1 Month</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            {language === 'en' ? 'Profile Picture' : 'Sawirka Profile-ka'}
                                        </label>
                                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            {previewImage ? (
                                                <div className="relative w-32 h-32">
                                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white" />
                                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white text-xs font-medium">Change</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center space-y-2">
                                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-medium">
                                                        {language === 'en' ? 'Click to upload photo' : 'Guji si aad sawir u geliso'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddCustomerForm(false)}
                                            className="flex-1 py-3 px-6 rounded-xl text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            {language === 'en' ? 'Cancel' : 'Jooji'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 py-3 px-6 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span>{language === 'en' ? 'Submit Customer' : 'Gudbi Macmiil'}</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Customers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {language === 'en' ? 'No Customers Found' : 'Macaamiil lama helin'}
                            </h3>
                            <p className="text-gray-500">
                                {language === 'en' ? 'Try adjusting your search or add a new customer.' : 'Isku day inaad raadiso ama ku dar macmiil cusub.'}
                            </p>
                        </div>
                    ) : (
                        filteredCustomers.map((customer, index) => (
                            <motion.div
                                key={customer._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {customer.profilePicUrl ? (
                                            <img
                                                src={customer.profilePicUrl}
                                                alt={customer.fullName}
                                                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-blue-600 ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all">
                                                <User className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                                                {customer.fullName}
                                            </h4>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {customer.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {customer.status === 'pending' && <span className="bg-orange-50 text-orange-600 p-2 rounded-xl"><Clock className="w-4 h-4" /></span>}
                                    {customer.status === 'approved' && <span className="bg-green-50 text-green-600 p-2 rounded-xl"><CheckCircle className="w-4 h-4" /></span>}
                                    {customer.status === 'rejected' && <span className="bg-red-50 text-red-600 p-2 rounded-xl"><XCircle className="w-4 h-4" /></span>}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="truncate">{customer.location || 'No location'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Amount</span>
                                        <span className="text-lg font-bold text-gray-900">${customer.amount}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${customer.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                        customer.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {customer.status}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketerDashboardPage;
