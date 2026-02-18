import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    UserPlus,
    Search,
    Briefcase
} from 'lucide-react';
import { marketerService, type Marketer } from '../../services/marketerService.ts';
import { useTheme } from '../../contexts/ThemeContext.tsx';
import MarketerCard from '../../components/MarketerCard.tsx';

interface MarketerTabProps {
    onShowAddForm: () => void;
}

const MarketerTab: React.FC<MarketerTabProps> = ({ onShowAddForm }) => {
    const { language } = useTheme();
    const [marketers, setMarketers] = useState<Marketer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Load marketers
    const loadMarketers = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await marketerService.getAllMarketers({ limit: 100 });
            setMarketers(response.marketers);
        } catch (error) {
            console.error('Error loading marketers:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMarketers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle delete
    const handleDelete = async (marketer: Marketer) => {
        if (!window.confirm(language === 'en'
            ? `Are you sure you want to delete ${marketer.fullName}?`
            : `Ma hubtaa inaad tirtirto ${marketer.fullName}?`)) {
            return;
        }

        try {
            await marketerService.deleteMarketer(marketer._id);
            await loadMarketers();
        } catch (error) {
            console.error('Error deleting marketer:', error);
            alert(language === 'en' ? 'Failed to delete marketer' : 'Tirtirka waa guuldaraysatay');
        }
    };

    // Filter marketers
    const filteredMarketers = marketers.filter(m =>
        !searchQuery ||
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone.includes(searchQuery)
    );

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                            <Briefcase className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {language === 'en' ? 'Marketers Management' : 'Maamulka Suuq-geeyayaasha'}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {language === 'en'
                                    ? `${marketers.length} marketer${marketers.length !== 1 ? 's' : ''} registered`
                                    : `${marketers.length} suuq-geeye ayaa diiwaangashan`
                                }
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onShowAddForm}
                        className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span className="font-medium">
                            {language === 'en' ? 'Add Marketer' : 'Ku Dar Suuq-geeye'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={language === 'en'
                            ? 'Search marketers by name or phone...'
                            : 'Raadi suuq-geeyayaasha magaca ama telefoonka...'
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-gray-50 focus:bg-white"
                    />
                </div>
            </div>

            {/* Marketers Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                {isLoading ? (
                    <div className="text-center py-16">
                        <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Briefcase className="w-8 h-8 text-white" />
                        </motion.div>
                        <p className="text-gray-600 font-medium">
                            {language === 'en' ? 'Loading marketers...' : 'Waa la soo gelayaa...'}
                        </p>
                    </div>
                ) : filteredMarketers.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-12 h-12 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">
                            {language === 'en' ? 'No Marketers Found' : 'Ma Jiraan Suuq-geeyayaal'}
                        </h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            {language === 'en'
                                ? 'No marketers have been added yet. Click "Add Marketer" to get started.'
                                : 'Weli ma la dhinin suuq-geeyayaal. Guji "Ku Dar Suuq-geeye" si aad u bilowdo.'
                            }
                        </p>
                        <button
                            onClick={onShowAddForm}
                            className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>{language === 'en' ? 'Add First Marketer' : 'Ku Dar Suuq-geeye Hordhac'}</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMarketers.map((marketer, index) => (
                            <motion.div
                                key={marketer._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <MarketerCard
                                    marketer={marketer}
                                    language={language}
                                    onDelete={handleDelete}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MarketerTab;
