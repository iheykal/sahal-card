import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Plus, X, Upload, Building2, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { companyService, CreateCompanyData } from '../services/companyService.ts';
import { uploadService } from '../services/uploadService.ts';
import { useNavigate } from 'react-router-dom';

const CompanyManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useTheme();
  const navigate = useNavigate();

  // Check if user is superadmin
  React.useEffect(() => {
    if (!user || user.role !== 'superadmin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [deletingCompany, setDeletingCompany] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateCompanyData>({
    businessName: '',
    businessType: 'supermarket',
    description: '',
    discountRate: '' as any,
    logo: '',
    operatingHours: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '08:00', close: '22:00', isOpen: false }
    }
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true);
      setCompaniesError(null);
      console.log('[CompanyManagementPage] Loading companies...');
      const response = await companyService.getAllCompanies({ limit: 100 });
      console.log('[CompanyManagementPage] Response:', response);
      console.log('[CompanyManagementPage] Companies count:', response.companies?.length || 0);
      console.log('[CompanyManagementPage] Companies:', response.companies);

      if (response && response.companies) {
        setCompanies(response.companies);
        console.log('[CompanyManagementPage] Successfully loaded', response.companies.length, 'companies');
      } else {
        console.warn('[CompanyManagementPage] No companies in response:', response);
        setCompanies([]);
      }
    } catch (error: any) {
      console.error('[CompanyManagementPage] Failed to load companies:', error);
      console.error('[CompanyManagementPage] Error response:', error.response?.data);
      console.error('[CompanyManagementPage] Error status:', error.response?.status);
      console.error('[CompanyManagementPage] Error message:', error.message);

      let errorMessage = language === 'en' ? 'Failed to load companies.' : 'Waxay ku fashilantay in la soo saaro shirkadaha.';

      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = language === 'en'
          ? 'You do not have permission to view companies. Please login as superadmin.'
          : 'Ma hayso idan soo bandhigidda shirkadaha. Fadlan soo gal sida superadmin.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setCompaniesError(errorMessage);
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discountRate' ? (value === '' ? '' : parseFloat(value) || '') : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = formData.logo;

      // Upload logo if file is selected
      if (logoFile) {
        console.log('Uploading logo file:', logoFile.name, logoFile.size, logoFile.type);
        try {
          const uploadResponse = await uploadService.uploadFile(logoFile);
          console.log('Logo upload response:', uploadResponse);

          // Extract URL from response structure: { success, message, data: { url, ... } }
          if (uploadResponse.data && uploadResponse.data.url) {
            logoUrl = uploadResponse.data.url;
          } else if (uploadResponse.url) {
            logoUrl = uploadResponse.url;
          } else {
            console.error('Unexpected upload response structure:', uploadResponse);
            throw new Error('Invalid upload response structure');
          }

          console.log('Logo URL extracted:', logoUrl);
          console.log('Logo URL will be saved to company:', logoUrl);

          if (!logoUrl || logoUrl.trim() === '') {
            throw new Error('No URL returned from upload service');
          }
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          alert(language === 'en'
            ? 'Failed to upload logo. Please try again.'
            : 'Waxay ku fashilantay in la soo geliyo astaanta. Fadlan mar kale isku day.');
          setLoading(false);
          return;
        }
      }

      // Create company
      const companyData: CreateCompanyData = {
        ...formData,
        discountRate: typeof formData.discountRate === 'string' ? parseFloat(formData.discountRate) || 0 : formData.discountRate || 0,
        logo: logoUrl || ''
      };

      console.log('Creating company with data:', { ...companyData, logo: logoUrl ? '***URL***' : 'none' });
      const createdCompany = await companyService.createCompany(companyData);
      console.log('Company created:', createdCompany);

      // Reset form
      setFormData({
        businessName: '',
        businessType: 'supermarket',
        description: '',
        discountRate: '' as any,
        logo: '',
        operatingHours: {
          monday: { open: '08:00', close: '22:00', isOpen: true },
          tuesday: { open: '08:00', close: '22:00', isOpen: true },
          wednesday: { open: '08:00', close: '22:00', isOpen: true },
          thursday: { open: '08:00', close: '22:00', isOpen: true },
          friday: { open: '08:00', close: '22:00', isOpen: true },
          saturday: { open: '08:00', close: '22:00', isOpen: true },
          sunday: { open: '08:00', close: '22:00', isOpen: false }
        }
      });
      setLogoFile(null);
      setLogoPreview('');
      setShowAddForm(false);

      // Reload companies
      await loadCompanies();

      alert(language === 'en' ? 'Company created successfully!' : 'Shirkadda waa la sameeyay!');
    } catch (error: any) {
      console.error('Create company error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });

      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message ||
        (language === 'en' ? 'Failed to create company. Please check the console for details.' : 'Waxay ku fashilantay in la sameeyo shirkadda. Fadlan hubi console-ka.');

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: any) => {
    setEditingCompany(company);
    setFormData({
      businessName: company.businessName || '',
      businessType: company.businessType || 'supermarket',
      description: company.description || '',
      discountRate: company.discountRate || '' as any,
      logo: company.logo || '',
      operatingHours: company.operatingHours || {
        monday: { open: '08:00', close: '22:00', isOpen: true },
        tuesday: { open: '08:00', close: '22:00', isOpen: true },
        wednesday: { open: '08:00', close: '22:00', isOpen: true },
        thursday: { open: '08:00', close: '22:00', isOpen: true },
        friday: { open: '08:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '22:00', isOpen: true },
        sunday: { open: '08:00', close: '22:00', isOpen: false }
      }
    });
    setLogoPreview(company.logo || '');
    setLogoFile(null);
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setLoading(true);

    try {
      let logoUrl = formData.logo;

      // Upload logo if new file is selected
      if (logoFile) {
        console.log('Uploading new logo file:', logoFile.name, logoFile.size, logoFile.type);
        try {
          const uploadResponse = await uploadService.uploadFile(logoFile);
          console.log('Logo upload response:', uploadResponse);

          if (uploadResponse.data && uploadResponse.data.url) {
            logoUrl = uploadResponse.data.url;
          } else if (uploadResponse.url) {
            logoUrl = uploadResponse.url;
          } else {
            console.error('Unexpected upload response structure:', uploadResponse);
            throw new Error('Invalid upload response structure');
          }

          console.log('New logo URL:', logoUrl);
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
          alert(language === 'en'
            ? 'Failed to upload logo. Please try again.'
            : 'Waxay ku fashilantay in la soo geliyo astaanta. Fadlan mar kale isku day.');
          setLoading(false);
          return;
        }
      }

      // Update company
      const companyData: CreateCompanyData = {
        ...formData,
        discountRate: typeof formData.discountRate === 'string' ? parseFloat(formData.discountRate) || editingCompany.discountRate : formData.discountRate || editingCompany.discountRate,
        logo: logoUrl || editingCompany.logo || ''
      };

      console.log('Updating company with data:', { ...companyData, logo: logoUrl ? '***URL***' : 'none' });
      await companyService.updateCompany(editingCompany._id, companyData);
      console.log('Company updated successfully');

      // Reset form
      setFormData({
        businessName: '',
        businessType: 'supermarket',
        description: '',
        discountRate: '' as any,
        logo: '',
        operatingHours: {
          monday: { open: '08:00', close: '22:00', isOpen: true },
          tuesday: { open: '08:00', close: '22:00', isOpen: true },
          wednesday: { open: '08:00', close: '22:00', isOpen: true },
          thursday: { open: '08:00', close: '22:00', isOpen: true },
          friday: { open: '08:00', close: '22:00', isOpen: true },
          saturday: { open: '08:00', close: '22:00', isOpen: true },
          sunday: { open: '08:00', close: '22:00', isOpen: false }
        }
      });
      setLogoFile(null);
      setLogoPreview('');
      setEditingCompany(null);
      setShowEditForm(false);

      // Reload companies
      loadCompanies();

      alert(language === 'en' ? 'Company updated successfully!' : 'Shirkadda waa la cusbooneysiiyay!');
    } catch (error: any) {
      console.error('Update company error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message ||
        (language === 'en' ? 'Failed to update company. Please check the console for details.' : 'Waxay ku fashilantay in la cusbooneysiiyo shirkadda. Fadlan hubi console-ka.');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (company: any) => {
    setDeletingCompany(company);
  };

  const confirmDelete = async () => {
    if (!deletingCompany) return;

    setLoading(true);
    try {
      await companyService.deleteCompany(deletingCompany._id);
      loadCompanies();
      alert(language === 'en' ? 'Company deleted successfully!' : 'Shirkadda waa la tirtiray!');
      setDeletingCompany(null);
    } catch (error: any) {
      console.error('Delete company error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message ||
        (language === 'en' ? 'Failed to delete company.' : 'Waxay ku fashilantay in la tirtiro shirkadda.');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Get card colors based on business type
  const getCardColors = (businessType: string) => {
    const colorMap: { [key: string]: { from: string; to: string } } = {
      supermarket: { from: 'from-green-500', to: 'to-green-600' },
      pharmacy: { from: 'from-blue-500', to: 'to-blue-600' },
      restaurant: { from: 'from-red-500', to: 'to-red-600' },
      clothing: { from: 'from-purple-500', to: 'to-purple-600' },
      electronics: { from: 'from-indigo-500', to: 'to-indigo-600' },
      beauty: { from: 'from-pink-500', to: 'to-pink-600' },
      healthcare: { from: 'from-teal-500', to: 'to-teal-600' },
      automotive: { from: 'from-orange-500', to: 'to-orange-600' },
      education: { from: 'from-cyan-500', to: 'to-cyan-600' },
      services: { from: 'from-amber-500', to: 'to-amber-600' },
      furniture: { from: 'from-yellow-600', to: 'to-yellow-700' },
      telecommunication: { from: 'from-violet-500', to: 'to-violet-600' },
      other: { from: 'from-gray-500', to: 'to-gray-600' }
    };

    return colorMap[businessType] || { from: 'from-green-500', to: 'to-green-600' };
  };

  if (!user || user.role !== 'superadmin') {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{language === 'en' ? 'Company Management' : 'Maamulka Shirkadaha'} | SAHAL CARD</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {language === 'en' ? 'Company Management' : 'Maamulka Shirkadaha'}
            </h1>
            <p className="text-gray-600">
              {language === 'en' ? 'Manage partner companies and discounts' : 'Maamul shirkadaha iyo dhimistaada'}
            </p>
          </div>

          {/* Add Company Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              {language === 'en' ? 'Add New Company' : 'Ku Dar Shirkad Cusub'}
            </button>
          </div>

          {/* Add Company Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {language === 'en' ? 'Add New Company' : 'Ku Dar Shirkad Cusub'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setLogoPreview('');
                      setLogoFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Business Name' : 'Magaca Shirkadda'} *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Business Type' : 'Nooca Ganacsiga'} *
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="supermarket">{language === 'en' ? 'Supermarket' : 'Suuqa Weyn'}</option>
                      <option value="pharmacy">{language === 'en' ? 'Pharmacy' : 'Farmashii'}</option>
                      <option value="restaurant">{language === 'en' ? 'Restaurant' : 'Meydka'}</option>
                      <option value="clothing">{language === 'en' ? 'Clothing' : 'Dharada'}</option>
                      <option value="electronics">{language === 'en' ? 'Electronics' : 'Elektroonigga'}</option>
                      <option value="beauty">{language === 'en' ? 'Beauty' : 'Quruxda'}</option>
                      <option value="healthcare">{language === 'en' ? 'Healthcare' : 'Caafimaadka'}</option>
                      <option value="automotive">{language === 'en' ? 'Automotive' : 'Baabuurta'}</option>
                      <option value="education">{language === 'en' ? 'Education' : 'Waxbarashada'}</option>
                      <option value="services">{language === 'en' ? 'Services' : 'Adeegyada'}</option>
                      <option value="telecommunication">{language === 'en' ? 'Telecommunication' : 'Isgaadhsiinta'}</option>
                      <option value="travelagency">{language === 'en' ? 'Cargo & Travel Agency' : 'Cargo iyo Wakaalada Safarka'}</option>
                      <option value="other">{language === 'en' ? 'Other' : 'Kale'}</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Description' : 'Sharaxaadda'}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Discount Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Discount Rate (%)' : 'Heerka Dhimista (%)'} *
                    </label>
                    <input
                      type="number"
                      name="discountRate"
                      value={formData.discountRate || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      placeholder={language === 'en' ? 'Enter discount rate (1-100%)' : 'Geli heerka dhimista (1-100%)'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Logo' : 'Astaan'}
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Upload className="w-5 h-5" />
                        {language === 'en' ? 'Upload Logo' : 'Soo geli Astaan'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-lg border border-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? (language === 'en' ? 'Creating...' : 'La sameeyayaa...') : (language === 'en' ? 'Create Company' : 'Samee Shirkadda')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setLogoPreview('');
                        setLogoFile(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      {language === 'en' ? 'Cancel' : 'Jooji'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Edit Company Form Modal */}
          {showEditForm && editingCompany && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {language === 'en' ? 'Edit Company' : 'Wax ka beddel Shirkadda'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingCompany(null);
                      setLogoPreview('');
                      setLogoFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Business Name' : 'Magaca Shirkadda'} *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Business Type' : 'Nooca Ganacsiga'} *
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="supermarket">{language === 'en' ? 'Supermarket' : 'Suuqa Weyn'}</option>
                      <option value="pharmacy">{language === 'en' ? 'Pharmacy' : 'Farmashii'}</option>
                      <option value="restaurant">{language === 'en' ? 'Restaurant' : 'Meydka'}</option>
                      <option value="clothing">{language === 'en' ? 'Clothing' : 'Dharada'}</option>
                      <option value="electronics">{language === 'en' ? 'Electronics' : 'Elektroonigga'}</option>
                      <option value="beauty">{language === 'en' ? 'Beauty' : 'Quruxda'}</option>
                      <option value="healthcare">{language === 'en' ? 'Healthcare' : 'Caafimaadka'}</option>
                      <option value="automotive">{language === 'en' ? 'Automotive' : 'Baabuurta'}</option>
                      <option value="education">{language === 'en' ? 'Education' : 'Waxbarashada'}</option>
                      <option value="services">{language === 'en' ? 'Services' : 'Adeegyada'}</option>
                      <option value="furniture">{language === 'en' ? 'Furniture' : 'Alaabta Guriga'}</option>
                      <option value="telecommunication">{language === 'en' ? 'Telecommunication' : 'Isgaadhsiinta'}</option>
                      <option value="travelagency">{language === 'en' ? 'Cargo & Travel Agency' : 'Cargo iyo Wakaalada Safarka'}</option>
                      <option value="other">{language === 'en' ? 'Other' : 'Kale'}</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Description' : 'Sharaxaadda'}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Discount Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Discount Rate (%)' : 'Heerka Dhimista (%)'} *
                    </label>
                    <input
                      type="number"
                      name="discountRate"
                      value={formData.discountRate || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      required
                      placeholder={language === 'en' ? 'Enter discount rate (1-100%)' : 'Geli heerka dhimista (1-100%)'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'en' ? 'Logo' : 'Astaan'}
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        <Upload className="w-5 h-5" />
                        {language === 'en' ? 'Upload New Logo' : 'Soo geli Astaan Cusub'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo preview" className="w-20 h-20 object-contain rounded-lg border border-gray-300" />
                      )}
                      {!logoPreview && editingCompany.logo && (
                        <img src={editingCompany.logo} alt="Current logo" className="w-20 h-20 object-contain rounded-lg border border-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {loading ? (language === 'en' ? 'Updating...' : 'La cusbooneysiinayaa...') : (language === 'en' ? 'Update Company' : 'Cusbooneysii Shirkadda')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingCompany(null);
                        setLogoPreview('');
                        setLogoFile(null);
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                      {language === 'en' ? 'Cancel' : 'Jooji'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingCompany && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {language === 'en' ? 'Delete Company' : 'Tirtir Shirkadda'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {language === 'en'
                    ? `Are you sure you want to delete "${deletingCompany.businessName}"? This action cannot be undone.`
                    : `Ma hubtaa inaad tirtirto "${deletingCompany.businessName}"? Tallaabaddan lama dib u soo celin karo.`}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (language === 'en' ? 'Deleting...' : 'La tirtirayaa...') : (language === 'en' ? 'Delete' : 'Tirtir')}
                  </button>
                  <button
                    onClick={() => setDeletingCompany(null)}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    {language === 'en' ? 'Cancel' : 'Jooji'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Loading State */}
          {companiesLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">
                {language === 'en' ? 'Loading companies...' : 'Shirkadaha la socdayo...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {!companiesLoading && companiesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <p className="text-red-800 font-medium mb-2">
                {language === 'en' ? 'Error loading companies' : 'Qalad soo saarista shirkadaha'}
              </p>
              <p className="text-red-600 text-sm">{companiesError}</p>
              <button
                onClick={loadCompanies}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                {language === 'en' ? 'Try Again' : 'Mar kale isku day'}
              </button>
            </div>
          )}

          {/* Companies List */}
          {!companiesLoading && !companiesError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <motion.div
                  key={company._id}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${getCardColors(company.businessType).from} ${getCardColors(company.businessType).to} shadow-xl hover:shadow-2xl transition-all duration-300`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="relative p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-36 h-36 flex items-center justify-center relative">
                        {company.logo && company.logo.trim() !== '' ? (
                          <img
                            src={company.logo}
                            alt={`${company.businessName} logo`}
                            className="w-full h-full object-contain"
                            style={{
                              backgroundColor: 'transparent',
                              imageRendering: 'auto',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                              mixBlendMode: 'normal'
                            }}
                            onLoad={(e) => {
                              console.log('Logo image loaded successfully:', company.logo);
                              const img = e.currentTarget;
                              img.style.backgroundColor = 'transparent';
                              img.style.display = 'block';
                            }}
                            onError={(e) => {
                              console.error('Logo image failed to load:', company.logo);
                              // Hide broken image
                              e.currentTarget.style.display = 'none';
                              // Show fallback icon
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                icon.innerHTML = '<svg class="w-24 h-24 text-white/80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <Building2 className="w-24 h-24 text-white/80" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{company.discountRate}%</div>
                        <div className="text-sm opacity-90">{language === 'en' ? 'OFF' : 'DHIMIS'}</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{company.businessName}</h3>
                    <p className="text-white/90 text-sm mb-4">{company.description}</p>
                    <div className="flex items-center justify-between text-xs opacity-80 mb-4">
                      <span>📍 {company.branches?.[0]?.address || company.location || 'Mogadishu'}</span>
                    </div>
                    {/* Edit and Delete Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                      <button
                        onClick={() => handleEdit(company)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        {language === 'en' ? 'Edit' : 'Wax ka beddel'}
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        {language === 'en' ? 'Delete' : 'Tirtir'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!companiesLoading && !companiesError && companies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {language === 'en' ? 'No companies found. Add your first company!' : 'Shirkado lama helo. Ku dar shirkaddaada ugu horeysa!'}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CompanyManagementPage;

