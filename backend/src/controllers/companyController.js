const Company = require('../models/Company');
// User model no longer needed - companies are independent entities

// Create company (Superadmin only)
const createCompany = async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      description,
      discountRate,
      logo,
      location,
      operatingHours,
      phone,
      email
    } = req.body;

    // Companies are now independent entities and do not require user accounts
    // No user account will be created for companies

    // Create company record - add location to first branch address
    const companyData = {
      userId: null, // Companies no longer require user accounts
      businessName,
      businessType,
      description,
      discountRate,
      logo: logo || null,
      operatingHours: operatingHours || {
        monday: { open: '08:00', close: '22:00', isOpen: true },
        tuesday: { open: '08:00', close: '22:00', isOpen: true },
        wednesday: { open: '08:00', close: '22:00', isOpen: true },
        thursday: { open: '08:00', close: '22:00', isOpen: true },
        friday: { open: '08:00', close: '22:00', isOpen: true },
        saturday: { open: '08:00', close: '22:00', isOpen: true },
        sunday: { open: '08:00', close: '22:00', isOpen: false }
      },
      contactInfo: {
        email: email || 'contact@company.com',
        phone: phone || null // Optional phone if provided
      },
      isVerified: true, // Auto-verified when created by superadmin
      verificationStatus: 'verified',
      branches: req.body.branches || [{
        name: 'Main Branch',
        address: location || 'Mogadishu',
        phone: phone || null, // Optional phone if provided
        isActive: true
      }],
      isActive: true
    };

    console.log('[createCompany] Company data to be saved:', {
      businessName,
      isActive: companyData.isActive,
      isVerified: companyData.isVerified,
      verificationStatus: companyData.verificationStatus
    });

    // Add location as a custom field if needed (store in description or branches)
    // For now, we'll store it in the first branch address
    if (location && companyData.branches.length > 0) {
      companyData.branches[0].address = location;
    }

    const company = new Company(companyData);

    await company.save();

    // Verify company was saved correctly
    const savedCompany = await Company.findById(company._id);
    console.log('[createCompany] Saved company verification:', {
      _id: savedCompany._id,
      businessName: savedCompany.businessName,
      isActive: savedCompany.isActive,
      isVerified: savedCompany.isVerified,
      verificationStatus: savedCompany.verificationStatus
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company
      }
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
};

// Get all companies (Superadmin only)
const getAllCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 50, businessType, search } = req.query;

    // Build query
    const query = {};

    if (businessType) {
      query.businessType = businessType;
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get companies with pagination
    // No need to populate userId since companies no longer require user accounts
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get companies',
      error: error.message
    });
  }
};

// Get public companies (no authentication required) - for display everywhere
const getPublicCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 100, businessType, search } = req.query;

    // Build query - temporarily show ALL companies for debugging
    // TODO: Restore filtering after debugging
    const query = {};

    if (businessType) {
      query.businessType = businessType;
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('[getPublicCompanies] Query:', JSON.stringify(query, null, 2));

    // First, check all companies to debug
    const allCompanies = await Company.find({});
    console.log('[getPublicCompanies] Total companies in DB:', allCompanies.length);
    console.log('[getPublicCompanies] All companies status:', allCompanies.map(c => ({
      name: c.businessName,
      isActive: c.isActive,
      isVerified: c.isVerified,
      verificationStatus: c.verificationStatus
    })));

    // Get companies with pagination - only return public fields
    const companies = await Company.find(query)
      .select('businessName businessType description discountRate logo branches contactInfo operatingHours createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('[getPublicCompanies] Matching companies:', companies.length);
    console.log('[getPublicCompanies] Companies:', companies.map(c => ({
      name: c.businessName,
      isActive: c.isActive,
      isVerified: c.isVerified
    })));

    // Get total count
    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get public companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get companies',
      error: error.message
    });
  }
};

// Get single company
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // No need to populate userId since companies no longer require user accounts
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: { company }
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company',
      error: error.message
    });
  }
};

// Update company (Superadmin only)
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // No need to populate userId since companies no longer require user accounts
    const company = await Company.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error.message
    });
  }
};

// Delete company (Superadmin only)
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('[deleteCompany] Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format'
      });
    }

    console.log('[deleteCompany] Attempting to delete company with ID:', id);

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Companies no longer require user accounts, so no user deletion needed
    // Delete company only
    await Company.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getPublicCompanies,
  getCompany,
  updateCompany,
  deleteCompany
};

