import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import {
    Car,
    MapPin,
    Download,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Info,
    User,
    Phone,
    CreditCard,
    Shield,
    ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface UserData {
    _id: string;
    idNumber: string;
    fullName: string;
    phoneLast4: string;
    phone?: string;
    validUntil?: string | null;
}

interface Trip {
    _id: string;
    tripId: string;
    userId: UserData;
    passengerName: string;
    vehiclePlate: string;
    fromLocation: string;
    toLocation: string;
    status: 'On Way' | 'Completed';
    sosActive: boolean;
    timestamp: string;
    completedAt?: string;
}

interface TripStatistics {
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
    sosCount: number;
}

const TixraacPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'trip' | 'receipt' | 'admin' | 'info'>('trip');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [allTrips, setAllTrips] = useState<Trip[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [viewMode, setViewMode] = useState<'trips' | 'users'>('trips');
    const [adminSearchQuery, setAdminSearchQuery] = useState('');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState<TripStatistics | null>(null);

    // Two-step login states
    const [searchId, setSearchId] = useState('');
    const [searchedUser, setSearchedUser] = useState<UserData | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);

    // Admin Login state
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [adminCredentials, setAdminCredentials] = useState({ id: '', pin: '' });
    const [adminError, setAdminError] = useState<string | null>(null);

    const [tripForm, setTripForm] = useState({
        vehiclePlate: '',
        fromLocation: '',
        toLocation: ''
    });

    const [searchForm, setSearchForm] = useState({
        idNumber: '',
        phoneLast4: ''
    });

    const [searchParams] = useSearchParams();
    const tripIdParam = searchParams.get('tripId');

    // Auto-refresh admin panel
    useEffect(() => {
        if (activeTab === 'admin' && isAdminAuthenticated) {
            fetchAllTrips();
            fetchAllUsers();
            const interval = setInterval(() => {
                fetchAllTrips();
                // users don't need frequent refresh
            }, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [activeTab, isAdminAuthenticated]);

    // Handle tripId from URL (QR Code Scan)
    useEffect(() => {
        if (tripIdParam) {
            setActiveTab('receipt');
            fetchTripById(tripIdParam);
        }
    }, [tripIdParam]);

    // Fetch user trips when authenticated
    useEffect(() => {
        if (isAuthenticated && currentUser && activeTab === 'receipt' && !tripIdParam) {
            fetchUserTrips();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, currentUser, activeTab, tripIdParam]);



    // Step 1: Search user by ID
    const searchUserById = async () => {
        if (!searchId.trim()) {
            toast.error('Please enter an ID number');
            return;
        }

        setSearchLoading(true);
        setSearchError(null);
        setSearchedUser(null);
        setPin('');
        setPinError(null);

        try {
            const response = await axios.post('/api/auth/search-by-id', {
                idNumber: searchId.trim()
            });

            if (response.data.success && response.data.user) {
                setSearchedUser(response.data.user);
                setSearchError(null);
                toast.success('✅ User found! Enter last 4 digits to verify.');
            } else {
                setSearchError('User not found');
                toast.error('User not found');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'User not found';

            // Show debug info if available
            if (error.response?.data?.debug) {
                console.error('SEARCH DEBUG:', error.response.data.debug);
                const debugInfo = error.response.data.debug;
                const sampleIds = debugInfo.sampleDbIds && debugInfo.sampleDbIds.length > 0
                    ? debugInfo.sampleDbIds.join(', ')
                    : 'none';

                toast.error(`${errorMsg} (DB Samples: ${sampleIds})`, { duration: 6000 });
                setSearchError(`${errorMsg} (DB Samples: ${sampleIds})`);
            } else {
                setSearchError(errorMsg);
                toast.error(errorMsg);
            }
        } finally {
            setSearchLoading(false);
        }
    };

    // Step 2: Verify PIN and login
    const handlePinVerification = () => {
        if (!searchedUser || !searchedUser.phone) {
            setPinError('User data not available');
            return;
        }

        // Get last 4 digits from user's phone number
        let phoneDigits = searchedUser.phone;

        // Remove country code if present
        if (phoneDigits.startsWith('+252')) {
            phoneDigits = phoneDigits.slice(4);
        } else if (phoneDigits.startsWith('252')) {
            phoneDigits = phoneDigits.slice(3);
        }

        const last4Digits = phoneDigits.slice(-4);

        if (pin.trim() === last4Digits) {
            // Check if card is expired
            if (searchedUser.validUntil) {
                const expiry = new Date(searchedUser.validUntil);
                if (expiry < new Date()) {
                    setPinError(
                        `⚠️ Kaarka Sahal Card-kaaga waa dhacay (${format(expiry, 'dd/MM/yyyy')}). Fadlan la xiriir maamulka si aad u cusbooneysiiso.`
                    );
                    toast.error('Kaarka waa dhacay — fadlan cusboonaysii', { duration: 5000 });
                    return;
                }
            }
            // Successful verification - log in
            setCurrentUser(searchedUser);
            setIsAuthenticated(true);
            setPinError(null);
            setSearchId('');
            setSearchedUser(null);
            setPin('');
            toast.success('✅ Login successful!');
        } else {
            setPinError('Incorrect PIN. Please try again.');
            toast.error('Incorrect PIN');
        }
    };

    // Admin Login Handler
    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminCredentials.id === '001' && adminCredentials.pin === '6774') {
            setIsAdminAuthenticated(true);
            setAdminError(null);
            toast.success('Admin access granted');
        } else {
            setAdminError('Invalid credentials');
            toast.error('Invalid ID or PIN');
        }
    };

    // Create trip
    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setLoading(true);

        try {
            const response = await axios.post('/api/tixraac/trips', {
                userId: currentUser._id,
                ...tripForm
            });

            if (response.data.success) {
                toast.success(`✅ Trip created! ID: ${response.data.data.tripId} `);
                setTripForm({ vehiclePlate: '', fromLocation: '', toLocation: '' });
                setActiveTab('receipt');
                fetchUserTrips();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user trips
    const fetchUserTrips = async () => {
        if (!currentUser) return;

        try {
            const response = await axios.get('/api/tixraac/trips', {
                params: { userId: currentUser._id }
            });

            if (response.data.success) {
                setTrips(response.data.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch trips:', error);
        }
    };

    // Public search trips
    const handleSearchTrips = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.get('/api/tixraac/trips', {
                params: searchForm
            });

            if (response.data.success) {
                setTrips(response.data.data);
                toast.success('✅ Trips found!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Search failed');
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch trip by ID (for QR code scan)
    const fetchTripById = async (tripId: string) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/tixraac/trips', {
                params: { tripId }
            });

            if (response.data.success) {
                setTrips(response.data.data);
                toast.success('✅ Receipt Loaded!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load receipt');
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    // Activate SOS
    const handleSOS = async (tripId: string) => {
        if (!window.confirm('🚨 Activate SOS Emergency Alert?')) return;

        try {
            const response = await axios.patch(`/ api / tixraac / trips / ${tripId} `, {
                action: 'sos'
            });

            if (response.data.success) {
                toast.success('🚨 SOS ACTIVATED!', {
                    duration: 5000,
                    style: {
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    }
                });
                fetchUserTrips();
                if (activeTab === 'admin') fetchAllTrips();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to activate SOS');
        }
    };

    // Fetch all trips (admin)
    const fetchAllTrips = async () => {
        try {
            const response = await axios.get('/api/tixraac/admin/trips');

            if (response.data.success) {
                setAllTrips(response.data.data.trips);
                setStatistics(response.data.data.statistics);
            }
        } catch (error: any) {
            console.error('Failed to fetch all trips:', error);
        }
    };

    // Fetch all users (admin)
    const fetchAllUsers = async () => {
        try {
            const response = await axios.get('/api/tixraac/admin/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };



    // Download receipt as image
    const downloadReceipt = async (tripId: string) => {
        const element = document.getElementById(`receipt-${tripId}`);
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2
            });

            const link = document.createElement('a');
            link.download = `tixraac-receipt-${tripId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            toast.success('📥 Receipt downloaded!');
        } catch (error) {
            toast.error('Failed to download receipt');
        }
    };

    // Logout
    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setTrips([]);
        toast.success('👋 Logged out');
    };

    return (
        <>
            <Helmet>
                <title>Tixraac Gaadiid - Vehicle Tracking \u0026 Passenger Safety | SAHAL CARD</title>
                <meta name="description" content="Register your trips, track vehicles, and ensure passenger safety with Tixraac Gaadiid emergency alert system." />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-50 pt-20 pb-24">
                {/* Header */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                🚖 Tixraac Gaadiid
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Vehicle Tracking &amp; Passenger Safety System
                        </p>
                    </motion.div>

                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8 px-2">
                        <div className="flex flex-wrap justify-center gap-1 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg p-1.5 w-full max-w-sm sm:max-w-none sm:inline-flex sm:flex-nowrap">
                            {[
                                { key: 'trip' as const, label: 'TRIP', icon: Car },
                                { key: 'receipt' as const, label: 'RECEIPT', icon: CreditCard },
                                { key: 'admin' as const, label: 'ADMIN', icon: Shield },
                                { key: 'info' as const, label: 'INFO', icon: Info }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-1.5 text-sm ${activeTab === tab.key
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4 shrink-0" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {/* TRIP TAB */}
                        {activeTab === 'trip' && (
                            <motion.div
                                key="trip"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-2xl mx-auto"
                            >
                                {!isAuthenticated ? (
                                    // Two-Step Login: Search by ID, then verify with PIN
                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                            GELITAAN / LOGIN
                                        </h2>

                                        {/* Step 1: Search by ID */}
                                        {!searchedUser ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        <CreditCard className="w-4 h-4 inline mr-2" />
                                                        Geli ID-gaaga Sahal Card
                                                    </label>
                                                    <div className="flex space-x-3">
                                                        <input
                                                            type="tel"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            placeholder="001"
                                                            value={searchId}
                                                            onChange={(e) => setSearchId(e.target.value.replace(/[^0-9]/g, ''))}
                                                            onKeyPress={(e) => {
                                                                if (!/[0-9]/.test(e.key)) e.preventDefault();
                                                                if (e.key === 'Enter') searchUserById();
                                                            }}
                                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                            disabled={searchLoading}
                                                        />
                                                        <button
                                                            onClick={searchUserById}
                                                            disabled={searchLoading || !searchId.trim()}
                                                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {searchLoading ? 'LOADING...' : 'SEARCH 🔍'}
                                                        </button>
                                                    </div>
                                                </div>

                                                {searchError && (
                                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-2" />
                                                        {searchError}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            // Step 2: PIN Verification
                                            <div className="space-y-4">
                                                {/* User Found Info - name blurred until 4 digits entered */}
                                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                    <div className="flex items-center mb-3">
                                                        {/* Avatar */}
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg mr-3 shadow-md overflow-hidden">
                                                            {pin.length === 4 ? (
                                                                <span>{searchedUser.fullName.charAt(0).toUpperCase()}</span>
                                                            ) : (
                                                                <User className="w-6 h-6" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">User Found ✅</span>
                                                            {/* Name: blurred until 4 digits entered */}
                                                            <p
                                                                className="text-emerald-900 font-bold text-lg transition-all duration-500"
                                                                style={{
                                                                    filter: pin.length === 4 ? 'none' : 'blur(6px)',
                                                                    userSelect: pin.length === 4 ? 'auto' : 'none'
                                                                }}
                                                            >
                                                                {searchedUser.fullName}
                                                            </p>
                                                            <p className="text-emerald-600 text-xs">ID: {searchedUser.idNumber}</p>
                                                        </div>
                                                    </div>
                                                    {pin.length < 4 && (
                                                        <p className="text-xs text-emerald-600 italic">Enter last 4 digits to reveal identity</p>
                                                    )}
                                                </div>

                                                {/* PIN Input */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        <Phone className="w-4 h-4 inline mr-2" />
                                                        Gali 4-ta Lambar ee u dambeysa numberkaaga
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        placeholder="5678"
                                                        value={pin}
                                                        onChange={(e) => {
                                                            const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                                            setPin(numericValue);
                                                            setPinError(null);
                                                        }}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter' && pin.length === 4) {
                                                                handlePinVerification();
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-center text-lg font-mono"
                                                    />
                                                </div>

                                                {pinError && (
                                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
                                                        <AlertCircle className="w-4 h-4 mr-2" />
                                                        {pinError}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => {
                                                            setSearchedUser(null);
                                                            setSearchId('');
                                                            setPin('');
                                                            setPinError(null);
                                                            setSearchError(null);
                                                        }}
                                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                                    >
                                                        CANCEL
                                                    </button>
                                                    <button
                                                        onClick={handlePinVerification}
                                                        disabled={pin.length !== 4}
                                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        VERIFY 🔐
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Trip Registration Form
                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                DIIWANGELI SAFARI / REGISTER TRIP
                                            </h2>
                                            <button
                                                onClick={handleLogout}
                                                className="text-sm text-red-600 hover:text-red-700 font-semibold"
                                            >
                                                Logout
                                            </button>
                                        </div>

                                        <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                            <p className="text-sm text-gray-700">
                                                <strong>Passenger:</strong> {currentUser?.fullName}
                                            </p>
                                        </div>

                                        <form onSubmit={handleCreateTrip} className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    <Car className="w-4 h-4 inline mr-2" />
                                                    Vehicle Plate / Lambarka Baabuurka
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="A1234"
                                                    value={tripForm.vehiclePlate}
                                                    onChange={(e) => setTripForm({ ...tripForm, vehiclePlate: e.target.value.toUpperCase() })}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    <MapPin className="w-4 h-4 inline mr-2" />
                                                    Laga qaaday
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Hodan"
                                                    value={tripForm.fromLocation}
                                                    onChange={(e) => setTripForm({ ...tripForm, fromLocation: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    <MapPin className="w-4 h-4 inline mr-2" />
                                                    U Socda
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Airport"
                                                    value={tripForm.toLocation}
                                                    onChange={(e) => setTripForm({ ...tripForm, toLocation: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'CREATING...' : 'DIIWANGELI SAFARKA 🚀'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* RECEIPT TAB */}
                        {activeTab === 'receipt' && (
                            <motion.div
                                key="receipt"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl mx-auto"
                            >
                                {selectedTrip && isAdminAuthenticated && (
                                    <button
                                        onClick={() => {
                                            setSelectedTrip(null);
                                            setActiveTab('admin');
                                        }}
                                        className="mb-6 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-all flex items-center space-x-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Back to Admin Panel</span>
                                    </button>
                                )}

                                {/* Public Search */}
                                {!isAuthenticated && !selectedTrip && (
                                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8 mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            RAADI RECEIPT-KA / SEARCH RECEIPT
                                        </h2>

                                        <form onSubmit={handleSearchTrips} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                type="text"
                                                placeholder="ID Number (e.g. 001)"
                                                value={searchForm.idNumber}
                                                onChange={(e) => setSearchForm({ ...searchForm, idNumber: e.target.value })}
                                                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Last 4 Digits"
                                                maxLength={4}
                                                value={searchForm.phoneLast4}
                                                onChange={(e) => setSearchForm({ ...searchForm, phoneLast4: e.target.value })}
                                                className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                                required
                                            />
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'SEARCHING...' : 'RAADI 🔍'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* Trip Receipts */}
                                <div className="space-y-6">
                                    {(selectedTrip ? [selectedTrip] : trips).length === 0 ? (
                                        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50">
                                            <p className="text-gray-500 text-lg">No trips found</p>
                                        </div>
                                    ) : (
                                        (selectedTrip ? [selectedTrip] : trips).map((trip) => (
                                            <div key={trip._id} className="max-w-md mx-auto">
                                                {/* Downloadable receipt card */}
                                                <div
                                                    id={`receipt-${trip.tripId}`}
                                                    className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-blue-200 overflow-hidden"
                                                >
                                                    {/* Header */}
                                                    <div className="text-center py-6 px-6 border-b-2 border-blue-400">
                                                        <h3 className="text-2xl font-black text-gray-900 tracking-wide">TIXRAAC GAADIID</h3>
                                                        <p className="text-blue-600 font-bold text-sm mt-1">ID: {trip.tripId}</p>
                                                    </div>

                                                    {/* Rows */}
                                                    <div className="px-6 py-4 space-y-0 divide-y divide-gray-100">
                                                        <div className="flex justify-between items-center py-3">
                                                            <span className="font-bold text-gray-800">Rikaabka:</span>
                                                            <span className="text-gray-700">{trip.passengerName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-3">
                                                            <span className="font-bold text-gray-800">Taarikada:</span>
                                                            <span className="text-gray-700 font-mono">{trip.vehiclePlate}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-3">
                                                            <span className="font-bold text-gray-800">Laga qaaday:</span>
                                                            <span className="text-gray-700">{trip.fromLocation}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-3">
                                                            <span className="font-bold text-gray-800">U socda:</span>
                                                            <span className="text-blue-600 font-bold">{trip.toLocation}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-3">
                                                            <span className="font-bold text-gray-800">Waqtiga:</span>
                                                            <span className="text-gray-700 text-sm">{format(new Date(trip.timestamp), 'dd/MM/yyyy, HH:mm:ss')}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-3">
                                                            <span className="font-bold text-gray-800">Status:</span>
                                                            <span className={`px-4 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-wider ${trip.status === 'Completed' ? 'bg-green-500' : 'bg-amber-400'
                                                                }`}>
                                                                {trip.status === 'Completed' ? 'DHAMMAYSTAY' : 'ON WAY'}
                                                            </span>
                                                        </div>
                                                        {trip.sosActive && (
                                                            <div className="flex justify-between items-center py-3">
                                                                <span className="font-bold text-red-700">SOS:</span>
                                                                <span className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-black uppercase animate-pulse">🚨 ACTIVE</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="text-center py-4 px-6 border-t border-gray-100">
                                                        <p className="text-xs text-gray-400 italic">Xogtan waa badqab waana cadayn rasmi ah.</p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons — outside downloadable area */}
                                                <div className="mt-4 space-y-3">
                                                    <button
                                                        onClick={() => downloadReceipt(trip.tripId)}
                                                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 group"
                                                    >
                                                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        <span>SAVE TO GALLERY</span>
                                                    </button>

                                                    {trip.status === 'On Way' && !trip.sosActive && (
                                                        <button
                                                            onClick={() => handleSOS(trip.tripId)}
                                                            className="w-full bg-red-50 text-red-600 border-2 border-red-100 py-3 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center space-x-2"
                                                        >
                                                            <AlertTriangle className="w-5 h-5" />
                                                            <span>EMERGENCY SOS</span>
                                                        </button>
                                                    )}

                                                    {trip.sosActive && (
                                                        <div className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-center animate-pulse flex items-center justify-center space-x-2">
                                                            <AlertTriangle className="w-5 h-5" />
                                                            <span>SOS ACTIVE - HELP ON WAY</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ADMIN TAB */}
                        {activeTab === 'admin' && (
                            <motion.div
                                key="admin"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-6xl mx-auto"
                            >
                                {!isAdminAuthenticated ? (
                                    <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8">
                                        <div className="text-center mb-6">
                                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Shield className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
                                            <p className="text-gray-500 text-sm mt-1">Authorized personnel only</p>
                                        </div>

                                        <form onSubmit={handleAdminLogin} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Admin ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={adminCredentials.id}
                                                    onChange={(e) => setAdminCredentials({ ...adminCredentials, id: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="Enter Admin ID"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Security PIN
                                                </label>
                                                <input
                                                    type="password"
                                                    value={adminCredentials.pin}
                                                    onChange={(e) => setAdminCredentials({ ...adminCredentials, pin: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    placeholder="Enter PIN"
                                                />
                                            </div>

                                            {adminError && (
                                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-2" />
                                                    {adminError}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                                            >
                                                ACCESS DASHBOARD
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        {/* Statistics */}
                                        {statistics && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
                                                    <p className="text-sm text-gray-500 mb-2">Total Trips</p>
                                                    <p className="text-3xl font-bold text-gray-900">{statistics.totalTrips}</p>
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
                                                    <p className="text-sm text-gray-500 mb-2">Active Trips</p>
                                                    <p className="text-3xl font-bold text-yellow-600">{statistics.activeTrips}</p>
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
                                                    <p className="text-sm text-gray-500 mb-2">Completed</p>
                                                    <p className="text-3xl font-bold text-green-600">{statistics.completedTrips}</p>
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg p-6">
                                                    <p className="text-sm text-gray-500 mb-2">SOS Alerts</p>
                                                    <p className="text-3xl font-bold text-red-600">{statistics.sosCount}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* All Trips / Users Toggle */}
                                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8">
                                            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {viewMode === 'trips' ? 'All Trips (Auto-refresh: 5s)' : 'Registered Users'}
                                                </h2>

                                                <div className="flex w-full md:w-auto gap-4">
                                                    {/* Search Input */}
                                                    <div className="relative flex-1 md:w-64">
                                                        <input
                                                            type="text"
                                                            placeholder={viewMode === 'trips' ? "Search trips..." : "Search users..."}
                                                            value={adminSearchQuery}
                                                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                                        />
                                                        <div className="absolute left-3 top-2.5 text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg shrink-0">
                                                        <button
                                                            onClick={() => setViewMode('trips')}
                                                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'trips' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >
                                                            Trips
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setViewMode('users');
                                                                fetchAllUsers();
                                                            }}
                                                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${viewMode === 'users' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >
                                                            Users
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {viewMode === 'trips' ? (
                                                <div>
                                                    {allTrips.length === 0 ? (
                                                        <p className="text-center text-gray-500 py-8">No trips registered yet</p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                                            {allTrips
                                                                .filter(trip =>
                                                                    !adminSearchQuery ||
                                                                    trip.tripId.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                                    trip.passengerName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                                    trip.vehiclePlate.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                                    trip.fromLocation.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                                    trip.toLocation.toLowerCase().includes(adminSearchQuery.toLowerCase())
                                                                )
                                                                .map((trip) => (
                                                                    <div
                                                                        key={trip._id}
                                                                        className={`bg-white rounded-2xl shadow-md border-2 border-dashed overflow-hidden transition-all ${trip.sosActive ? 'border-red-400 ring-2 ring-red-300 animate-pulse' : 'border-blue-200'
                                                                            }`}
                                                                    >
                                                                        {/* Receipt Header */}
                                                                        <div className="text-center py-4 px-4 border-b-2 border-blue-400">
                                                                            <h3 className="text-lg font-black text-gray-900 tracking-wide">TIXRAAC GAADIID</h3>
                                                                            <p className="text-blue-600 font-bold text-xs mt-0.5">ID: {trip.tripId}</p>
                                                                        </div>

                                                                        {/* Receipt Rows */}
                                                                        <div className="px-4 py-2 space-y-0 divide-y divide-gray-100 text-sm">
                                                                            <div className="flex justify-between items-center py-2">
                                                                                <span className="font-bold text-gray-800">Rikaabka:</span>
                                                                                <span className="text-gray-700 text-right max-w-[55%] truncate">{trip.passengerName}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center py-2">
                                                                                <span className="font-bold text-gray-800">Taarikada:</span>
                                                                                <span className="text-gray-700 font-mono">{trip.vehiclePlate}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center py-2">
                                                                                <span className="font-bold text-gray-800">Laga qaaday:</span>
                                                                                <span className="text-gray-700">{trip.fromLocation}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center py-2">
                                                                                <span className="font-bold text-gray-800">U socda:</span>
                                                                                <span className="text-blue-600 font-bold">{trip.toLocation}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center py-2">
                                                                                <span className="font-bold text-gray-800">Waqtiga:</span>
                                                                                <span className="text-gray-600 text-xs">{format(new Date(trip.timestamp), 'dd/MM/yyyy, HH:mm')}</span>
                                                                            </div>
                                                                            <div className="flex justify-between items-center py-2">
                                                                                <span className="font-bold text-gray-800">Status:</span>
                                                                                <span className={`px-3 py-1 rounded-full text-white text-xs font-black uppercase ${trip.status === 'Completed' ? 'bg-green-500' : 'bg-amber-400'
                                                                                    }`}>
                                                                                    {trip.status === 'Completed' ? 'DHAMMAYSTAY' : 'ON WAY'}
                                                                                </span>
                                                                            </div>
                                                                            {trip.sosActive && (
                                                                                <div className="flex justify-between items-center py-2">
                                                                                    <span className="font-bold text-red-700">SOS:</span>
                                                                                    <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black animate-pulse">🚨 ACTIVE</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Footer */}
                                                                        <div className="text-center py-3 px-4 border-t border-gray-100">
                                                                            <p className="text-[10px] text-gray-400 italic">Xogtan waa badqab waana cadayn rasmi ah.</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {users
                                                        .filter(user =>
                                                            user.fullName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                            user.idNumber.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                            (user.phone || '').includes(adminSearchQuery) ||
                                                            (user.phoneLast4 || '').includes(adminSearchQuery)
                                                        )
                                                        .length === 0 ? (
                                                        <p className="text-center text-gray-500 py-8">
                                                            {users.length === 0 ? "No registered users found" : "No matching users found"}
                                                        </p>
                                                    ) : (
                                                        <div className="overflow-hidden rounded-xl border border-gray-200">
                                                            <table className="min-w-full divide-y divide-gray-200">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Number</th>
                                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone (Last 4)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="bg-white divide-y divide-gray-200">
                                                                    {users
                                                                        .filter(user =>
                                                                            user.fullName.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                                            user.idNumber.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
                                                                            (user.phone || '').includes(adminSearchQuery) ||
                                                                            (user.phoneLast4 || '').includes(adminSearchQuery)
                                                                        )
                                                                        .map((user) => (
                                                                            <tr key={user._id}>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{user.fullName}</td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.idNumber}</td>
                                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                                                    ...{user.phone ? user.phone.slice(-4) : (user.phoneLast4 || 'N/A')}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* INFO TAB */}
                        {activeTab === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl mx-auto"
                            >
                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/50 shadow-xl p-8">
                                    <div className="text-center mb-8">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                            Tixraac Gaadiid
                                        </h2>
                                        <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                                            Tixraac Gaadiid is a passenger safety and trip tracking system designed to protect travelers and ensure full transparency during vehicle journeys.
                                        </p>
                                        <p className="text-md text-gray-600 mt-4 max-w-3xl mx-auto italic">
                                            This program is owned and professionally managed by <strong>Sahal Card</strong>, developed after the company identified a significant public need for a structured and reliable passenger protection system.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-3">ℹ️</span>
                                                How It Works
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="flex">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm mr-4">1</div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Registration</h4>
                                                        <p className="text-gray-600 text-sm">Passengers register using their Sahal ID and their assigned verification code.</p>
                                                    </div>
                                                </div>
                                                <div className="flex">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm mr-4">2</div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Create Trip</h4>
                                                        <p className="text-gray-600 text-sm">Before boarding, register the trip by entering vehicle plate, route details, and driver info.</p>
                                                    </div>
                                                </div>
                                                <div className="flex">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm mr-4">3</div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Get Receipt</h4>
                                                        <p className="text-gray-600 text-sm">The system generates a downloadable trip receipt containing a unique tracking ID.</p>
                                                    </div>
                                                </div>
                                                <div className="flex">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm mr-4">4</div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Emergency SOS</h4>
                                                        <p className="text-gray-600 text-sm">If you feel unsafe, activate the SOS Emergency Alert. Sahal Card monitoring is verified instantly.</p>
                                                    </div>
                                                </div>
                                                <div className="flex">
                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm mr-4">5</div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">Complete Trip</h4>
                                                        <p className="text-gray-600 text-sm">When you arrive safely, the trip is marked as Completed in the system.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-3">🛡️</span>
                                                Safety Features
                                            </h3>
                                            <ul className="space-y-4">
                                                <li className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                                                    <span className="text-gray-700 font-medium">Unique Trip ID for tracking</span>
                                                </li>
                                                <li className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                                                    <span className="text-gray-700 font-medium">Downloadable digital receipt</span>
                                                </li>
                                                <li className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                                                    <span className="text-gray-700 font-medium">One-click SOS emergency alert</span>
                                                </li>
                                                <li className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                                                    <span className="text-gray-700 font-medium">Public trip verification via Sahal ID</span>
                                                </li>
                                                <li className="flex items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5" />
                                                    <span className="text-gray-700 font-medium">Real-time professional admin monitoring</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between">
                                        <div className="mb-4 md:mb-0">
                                            <h4 className="text-xl font-bold text-red-900 mb-2 flex items-center">
                                                <Phone className="w-6 h-6 mr-2" />
                                                Emergency & Authorities
                                            </h4>
                                            <p className="text-red-800 text-sm max-w-xl">
                                                If SOS is activated, the Sahal Card monitoring system responds immediately.
                                                For urgent law enforcement assistance, contact the Authority Emergency Line.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Police / Authorities</span>
                                            <div className="bg-white px-6 py-2 rounded-xl shadow-sm border border-red-100 text-3xl font-black text-red-600 tracking-widest">
                                                991
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div >
        </>
    );
};

export default TixraacPage;
