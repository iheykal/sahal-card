import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone,
    DollarSign,
    Users,
    Calendar,
    Eye,
    X,
    User,
    Trash2,
    Briefcase,
    MapPin,
    CreditCard,
    Clock
} from 'lucide-react';
import { marketerService, type Marketer, type RegisteredUser } from '../services/marketerService.ts';

interface MarketerCardProps {
    marketer: Marketer;
    language: string;
    onDelete: (marketer: Marketer) => void;
}

const MarketerCard: React.FC<MarketerCardProps> = ({ marketer, language, onDelete }) => {
    const [showDetail, setShowDetail] = useState(false);
    const [showGovId, setShowGovId] = useState(false);
    const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Fetch registered users when modal opens
    useEffect(() => {
        if (showDetail) {
            const fetchRegisteredUsers = async () => {
                try {
                    setLoadingUsers(true);
                    const data = await marketerService.getMarketerRegisteredUsers(marketer._id);
                    setRegisteredUsers(data.registeredUsers);
                } catch (error) {
                    console.error('Error loading registered users:', error);
                } finally {
                    setLoadingUsers(false);
                }
            };
            fetchRegisteredUsers();
        }
    }, [showDetail, marketer._id]);

    return (
        <>
            {/* Card */}
            <motion.div
                onClick={() => setShowDetail(true)}
                className="group relative rounded-3xl shadow-lg hover:shadow-2xl border overflow-hidden transition-all cursor-pointer bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 border-purple-100 hover:border-purple-300"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
            >
                {/* Gradient Header */}
                <div className="h-24 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

                    {/* View Indicator */}
                    <div className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        <Eye className="w-4 h-4 text-white" />
                    </div>
                </div>

                {/* Profile Picture */}
                <div className="relative -mt-14 flex justify-center mb-4 px-4">
                    {marketer.profilePicUrl ? (
                        <img
                            src={marketer.profilePicUrl}
                            alt={marketer.fullName}
                            className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-xl group-hover:ring-purple-200 transition-all"
                            onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiM4YjVjZjYiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjQ1IiByPSIyNSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTTEwNCAxMTVjMC0yMi4xLTE3LjktNDAtNDAtNDBzLTQwIDE3LjktNDAgNDBoMTZjMC0xMy4zIDEwLjctMjQgMjQtMjRzMjQgMTAuNyAyNCAyNGgxNnoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOCIvPjwvc3ZnPg==';
                            }}
                        />
                    ) : (
                        <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center ring-4 ring-white shadow-xl group-hover:ring-purple-200 transition-all">
                            <User className="w-14 h-14 text-white" />
                        </div>
                    )}

                    {/* Online Badge */}
                    <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-1">
                        <div className="w-5 h-5 bg-green-500 rounded-full ring-2 ring-white shadow-lg flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Marketer Info */}
                <div className="px-5 pb-5 text-center">
                    <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">
                        {marketer.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3" />
                        {marketer.phone}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center justify-center gap-1 mb-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-2xl font-bold text-green-700">${marketer.totalEarnings.toFixed(2)}</p>
                            <p className="text-xs font-medium text-green-600/80">
                                {language === 'en' ? 'Earnings' : 'Dakhliga'}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center justify-center gap-1 mb-2">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-bold text-blue-700">{marketer.approvedCustomers}</p>
                            <p className="text-xs font-medium text-blue-600/80">
                                {language === 'en' ? 'Customers' : 'Macaamiil'}
                            </p>
                        </div>
                    </div>

                    {/* Join Date */}
                    <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {language === 'en' ? 'Joined' : 'Ku biiray'}: {new Date(marketer.createdAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>

            {/* Detail Modal */}
            <AnimatePresence>
                {showDetail && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                        onClick={() => setShowDetail(false)}
                    >
                        <motion.div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header with Gradient */}
                            <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 rounded-t-3xl text-center overflow-hidden">
                                {/* Background decorations */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16" />

                                {/* Close button */}
                                <button
                                    onClick={() => setShowDetail(false)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>

                                {/* Profile Picture */}
                                <div className="relative inline-block mb-4">
                                    {marketer.profilePicUrl ? (
                                        <img
                                            src={marketer.profilePicUrl}
                                            alt={marketer.fullName}
                                            className="w-32 h-32 rounded-full object-cover ring-4 ring-white/50 shadow-2xl mx-auto"
                                            onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiM4YjVjZjYiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjQ1IiByPSIyNSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC44Ii8+PHBhdGggZD0iTTEwNCAxMTVjMC0yMi4xLTE3LjktNDAtNDAtNDBzLTQwIDE3LjktNDAgNDBoMTZjMC0xMy4zIDEwLjctMjQgMjQtMjRzMjQgMTAuNyAyNCAyNGgxNnoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuOCIvPjwvc3ZnPg==';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto ring-4 ring-white/50 shadow-2xl">
                                            <User className="w-16 h-16 text-white" />
                                        </div>
                                    )}
                                    {/* Role Badge */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-full shadow-lg">
                                        <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            {language === 'en' ? 'Marketer' : 'Suuq-geeye'}
                                        </span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-white mt-4">{marketer.fullName}</h2>
                                <p className="text-purple-100 flex items-center justify-center gap-1 mt-1">
                                    <Phone className="w-4 h-4" />
                                    {marketer.phone}
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="p-6 grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-5 text-center shadow-sm">
                                    <div className="w-12 h-12 bg-green-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-green-700">${marketer.totalEarnings.toFixed(2)}</p>
                                    <p className="text-sm text-green-600/80 mt-1">
                                        {language === 'en' ? 'Total Earnings' : 'Wadarta Dakhliga'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-5 text-center shadow-sm">
                                    <div className="w-12 h-12 bg-blue-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-blue-700">{marketer.approvedCustomers}</p>
                                    <p className="text-sm text-blue-600/80 mt-1">
                                        {language === 'en' ? 'Approved Customers' : 'Macaamiisha La Ogolaaday'}
                                    </p>
                                </div>
                            </div>

                            {/* Government ID Section */}
                            {marketer.governmentIdUrl && (
                                <div className="px-6 pb-4">
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-red-600" />
                                        {language === 'en' ? 'Government ID' : 'Aqoonsiga Dawladda'}
                                    </h3>
                                    <div
                                        className="relative cursor-pointer group/id rounded-xl overflow-hidden border border-gray-200 shadow-sm h-48 bg-gray-50 flex items-center justify-center"
                                        onClick={() => setShowGovId(true)}
                                    >
                                        <img
                                            src={marketer.governmentIdUrl}
                                            alt="Government ID"
                                            className="w-full h-full object-contain group-hover/id:scale-105 transition-transform"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-100');
                                                // Create a placeholder element
                                                if (!e.currentTarget.parentElement?.querySelector('.fallback-id')) {
                                                    const div = document.createElement('div');
                                                    div.className = 'fallback-id text-center p-4';
                                                    div.innerHTML = `
                                                        <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                                            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                                        </div>
                                                        <span class="text-sm text-gray-500 font-medium">No Image Loaded</span>
                                                    `;
                                                    e.currentTarget.parentElement?.appendChild(div);
                                                }
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/id:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="px-4 py-2 bg-white/90 rounded-lg flex items-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {language === 'en' ? 'Click to View Full Size' : 'Guji si aad u aragto'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Details */}
                            <div className="px-6 pb-4">
                                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {language === 'en' ? 'Member Since' : 'Xubin Tan Iyo'}
                                        </p>
                                        <p className="font-semibold text-gray-800">
                                            {new Date(marketer.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Registered Users Section */}
                            <div className="px-6 pb-4">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    {language === 'en' ? 'Registered Users' : 'Isticmaalayaasha uu diiwaangeliyay'}
                                    <span className="ml-auto text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                        {registeredUsers.length}
                                    </span>
                                </h3>

                                {loadingUsers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : registeredUsers.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                                        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">
                                            {language === 'en' ? 'No registered users yet' : 'Wali ma jiraan isticmaalayaal la diiwaangeliyay'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                                        {registeredUsers.map((user) => (
                                            <div
                                                key={user._id}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                            >
                                                {user.profilePicUrl ? (
                                                    <img
                                                        src={user.profilePicUrl}
                                                        alt={user.fullName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNlNWU3ZWIiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjE1IiByPSI4IiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0iTTM1IDQwYzAtMTEtNi43LTE1LTE1LTE1cy0xNSA0LTE1IDE1aDMweiIgZmlsbD0iIzljYTNhZiIvPjwvc3ZnPg==';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phone}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    {user.location && (
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {user.location}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => setShowDetail(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    {language === 'en' ? 'Close' : 'Xir'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetail(false);
                                        onDelete(marketer);
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {language === 'en' ? 'Delete Marketer' : 'Tirtir'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Government ID Full View Modal */}
            <AnimatePresence>
                {showGovId && marketer.governmentIdUrl && (
                    <div
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-[99999] p-4"
                        onClick={() => setShowGovId(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative max-w-4xl max-h-[90vh]"
                        >
                            <button
                                onClick={() => setShowGovId(false)}
                                className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                            <img
                                src={marketer.governmentIdUrl}
                                alt="Government ID"
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default MarketerCard;
