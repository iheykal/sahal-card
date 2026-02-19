const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SahalCard = require('../models/SahalCard');
// Company model no longer needed - companies are independent entities
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

// Normalize phone number - handles different formats
const normalizePhone = (phone) => {
  if (!phone) return null;

  // Remove all whitespace
  let normalized = phone.trim().replace(/\s+/g, '');

  // Remove all non-digit characters except +
  normalized = normalized.replace(/[^\d+]/g, '');

  // Handle different formats
  if (normalized.startsWith('+252')) {
    // Already has +252 prefix
    return normalized;
  } else if (normalized.startsWith('252')) {
    // Has 252 but missing +
    return '+' + normalized;
  } else if (normalized.length === 9 && /^\d{9}$/.test(normalized)) {
    // Just the 9 digits - prepend +252
    return '+252' + normalized;
  } else if (normalized.length === 12 && /^252\d{9}$/.test(normalized)) {
    // Has 252 without + and 9 digits
    return '+' + normalized;
  }

  // Return as is if it doesn't match expected patterns
  return normalized;
};

// Register new user
const register = async (req, res) => {
  try {
    const { fullName, phone, password, role = 'customer' } = req.body;

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if user already exists (try multiple formats)
    let existingUser = await User.findByPhone(normalizedPhone);

    // Try alternative formats if not found
    if (!existingUser) {
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
      existingUser = await User.findOne({ phone: phoneWithoutPlus });
    }

    if (!existingUser && normalizedPhone.startsWith('+252')) {
      const localPhone = normalizedPhone.slice(4);
      existingUser = await User.findOne({ phone: localPhone });
    }
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Check if ID number is already in use
    // Generate sequential ID
    // Start from 7 as requested
    const seqId = await Counter.getNextSequence('userId', 7);
    const idNumber = seqId.toString().padStart(3, '0');

    // Create new user
    // All users can login by default (unless admin creates them)
    const canLogin = true;

    const user = new User({
      fullName,
      phone: normalizedPhone, // Use normalized phone number
      password,
      role,
      idNumber,
      canLogin
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    await user.addRefreshToken(refreshToken);

    // Create welcome notification
    await Notification.createNotification({
      userId: user._id,
      title: 'Welcome to SAHAL CARD!',
      message: `Welcome ${fullName}! Your account has been created successfully. Get your Sahal Card to start saving!`,
      type: 'success',
      category: 'system',
      actionUrl: '/sahal-card/register',
      actionText: 'Get Sahal Card'
    });

    // If customer, create Sahal Card automatically
    if (role === 'customer') {
      try {
        await SahalCard.createCard(user._id, 1.00);

        await Notification.createNotification({
          userId: user._id,
          title: 'Sahal Card Created!',
          message: 'Your Sahal Card has been created automatically. Start saving with our partner businesses!',
          type: 'success',
          category: 'card_expiry',
          actionUrl: '/dashboard/sahal-card',
          actionText: 'View Card'
        });
      } catch (cardError) {
        console.error('Error creating Sahal Card:', cardError);
        // Don't fail registration if card creation fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.profile,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required'
      });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    console.log('[LOGIN] Attempt received:', {
      originalPhone: phone ? phone.replace(/(\+252)(\d{6})(\d{3})/, '$1******$3') : 'missing',
      normalizedPhone: normalizedPhone ? normalizedPhone.replace(/(\+252)(\d{6})(\d{3})/, '$1******$3') : 'missing',
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
      timestamp: new Date().toISOString()
    });

    const Marketer = require('../models/Marketer');

    // First, try to find as Marketer (Prioritize Marketers so they can access their dashboard)
    let marketer = await Marketer.findOne({ phone: normalizedPhone }).select('+password');

    // Try alternative formats for marketer
    if (!marketer && normalizedPhone) {
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
      marketer = await Marketer.findOne({ phone: phoneWithoutPlus }).select('+password');

      if (!marketer && normalizedPhone.startsWith('+252')) {
        const localPhone = normalizedPhone.slice(4);
        marketer = await Marketer.findOne({ phone: localPhone }).select('+password');
      }

      if (!marketer && normalizedPhone.startsWith('+252')) {
        const phoneWith252 = normalizedPhone.slice(1);
        marketer = await Marketer.findOne({ phone: phoneWith252 }).select('+password');
      }
    }

    // If not found as Marketer, try to find as User
    let user = null;

    if (!marketer) {
      // Try to find user with normalized phone number
      user = await User.findOne({ phone: normalizedPhone }).select('+password');

      // If not found, try alternative formats
      if (!user && normalizedPhone) {
        // Try without + prefix
        const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
        user = await User.findOne({ phone: phoneWithoutPlus }).select('+password');

        // Try with just the last 9 digits (local format)
        if (!user && normalizedPhone.startsWith('+252')) {
          const localPhone = normalizedPhone.slice(4); // Remove +252
          user = await User.findOne({ phone: localPhone }).select('+password');
        }

        // Try with 252 prefix (without +)
        if (!user && normalizedPhone.startsWith('+252')) {
          const phoneWith252 = normalizedPhone.slice(1); // Remove +
          user = await User.findOne({ phone: phoneWith252 }).select('+password');
        }
      }
    }

    if (!user && !marketer) {
      console.log('[LOGIN] User/Marketer not found for phone:', normalizedPhone ? normalizedPhone.replace(/(\+252)(\d{6})(\d{3})/, '$1******$3') : 'missing');
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password (User not found)',
        debug: {
          receivedPhone: phone,
          normalized: normalizedPhone,
          userFound: false,
          marketerFound: false
        }
      });
    }

    // Handle marketer login
    if (marketer) {
      console.log('[LOGIN] Marketer found:', {
        marketerId: marketer._id,
        fullName: marketer.fullName,
        phone: marketer.phone.replace(/(\+252)(\d{6})(\d{3})/, '$1******$3')
      });

      // Check if marketer can login
      if (!marketer.canLogin) {
        console.log('[LOGIN] Login disabled for marketer:', marketer._id);
        return res.status(403).json({
          success: false,
          message: 'Login is disabled for this account. Please contact an administrator.'
        });
      }

      // Verify password
      const isPasswordValid = await marketer.comparePassword(password);
      if (!isPasswordValid) {
        console.log('[LOGIN] Password mismatch for marketer:', marketer._id);
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password',
          debug: {
            userFound: true,
            type: 'Marketer',
            userId: marketer._id,
            passwordMatch: false
          }
        });
      }

      console.log('[LOGIN] Password verified successfully for marketer:', marketer._id);

      // Update last login
      Marketer.findByIdAndUpdate(marketer._id, { lastLogin: new Date() }).catch(err => {
        console.error('[LOGIN] Failed to update lastLogin (non-critical):', err.message);
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(marketer._id);

      // Save refresh token
      try {
        await Marketer.findByIdAndUpdate(
          marketer._id,
          { $push: { refreshTokens: { token: refreshToken } } },
          { new: true, runValidators: false }
        );
        console.log('[LOGIN] Refresh token saved successfully');
      } catch (tokenError) {
        console.error('[LOGIN] CRITICAL: Failed to save refresh token:', tokenError);
      }

      console.log('[LOGIN] Login successful for marketer:', marketer._id);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: marketer.profile,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      });
    }

    // Handle user login
    console.log('[LOGIN] User found:', {
      userId: user._id,
      fullName: user.fullName,
      role: user.role,
      canLogin: user.canLogin,
      phone: user.phone.replace(/(\+252)(\d{6})(\d{3})/, '$1******$3')
    });

    // Check if user can login
    if (!user.canLogin) {
      console.log('[LOGIN] Login disabled for user:', user._id);
      return res.status(403).json({
        success: false,
        message: 'Login is disabled for this account. Please contact an administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('[LOGIN] Password mismatch for user:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password',
        debug: {
          userFound: true,
          type: 'User',
          userId: user._id,
          role: user.role,
          passwordMatch: false
        }
      });
    }

    console.log('[LOGIN] Password verified successfully for user:', user._id);

    // Update last login (non-blocking to prevent login failures)
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(err => {
      console.error('[LOGIN] Failed to update lastLogin (non-critical):', err.message);
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token - must succeed for refresh to work later
    try {
      await User.findByIdAndUpdate(
        user._id,
        { $push: { refreshTokens: { token: refreshToken } } },
        { new: true, runValidators: false }
      );
      console.log('[LOGIN] Refresh token saved successfully');
    } catch (tokenError) {
      console.error('[LOGIN] CRITICAL: Failed to save refresh token:', tokenError);
      // If we can't save refresh token, still continue but log it prominently
    }

    console.log('[LOGIN] Login successful for user:', user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.profile,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.some(rt => rt.token === refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Get additional data based on user role
    let additionalData = {};

    if (user.role === 'customer') {
      const sahacard = await SahalCard.findOne({ userId: user._id });
      additionalData.sahalCard = sahacard ? sahacard.getStats() : null;
    }
    // Company role removed - companies are now independent entities

    res.json({
      success: true,
      data: {
        user: user.profile,
        ...additionalData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { fullName, phone, idNumber, location } = req.body;

    // Update allowed fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (location) user.location = location;

    // ID Number update disabled to enforce sequential IDs
    // if (idNumber) ... removed

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.profile
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const userWithPassword = await User.findById(user._id).select('+password');
    const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();

    // Remove all refresh tokens (force re-login)
    userWithPassword.refreshTokens = [];
    await userWithPassword.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.json({
        success: true,
        message: 'If the phone number exists, a password reset link has been sent.'
      });
    }

    // Try to find user with normalized phone number
    let user = await User.findOne({ phone: normalizedPhone });

    // Try alternative formats if not found
    if (!user) {
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
      user = await User.findOne({ phone: phoneWithoutPlus });
    }

    if (!user && normalizedPhone.startsWith('+252')) {
      const localPhone = normalizedPhone.slice(4);
      user = await User.findOne({ phone: localPhone });
    }
    if (!user) {
      // Don't reveal if phone exists or not
      return res.json({
        success: true,
        message: 'If the phone number exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send SMS with reset link
    // For now, just return success
    console.log(`Password reset token for ${phone}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If the phone number exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find user and update password
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    // Remove all refresh tokens
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// Create user (Admin only)
const createUser = async (req, res) => {
  try {
    const { fullName, phone, role = 'customer', profilePicUrl, idCardImageUrl, registrationDate, amount } = req.body;

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if user already exists with same phone (try multiple formats)
    let existingUser = await User.findByPhone(normalizedPhone);

    // Try alternative formats if not found
    if (!existingUser) {
      const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
      existingUser = await User.findOne({ phone: phoneWithoutPlus });
    }

    if (!existingUser && normalizedPhone.startsWith('+252')) {
      const localPhone = normalizedPhone.slice(4);
      existingUser = await User.findOne({ phone: localPhone });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Generate sequential ID
    // Start from 7 as requested
    const seqId = await Counter.getNextSequence('userId', 7);
    const idNumber = seqId.toString().padStart(3, '0');

    // Generate a default password
    const defaultPassword = 'maandhise123';

    // Create new user (admin-created users cannot login)
    // Compute membership months and validUntil
    let membershipMonths = 0;
    let validUntil = null;
    if (amount && Number.isInteger(amount) && amount > 0) {
      membershipMonths = amount;
      const start = registrationDate ? new Date(registrationDate) : new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + membershipMonths);
      validUntil = end;
    }

    const user = new User({
      fullName,
      phone: normalizedPhone, // Use normalized phone number
      password: defaultPassword,
      role,
      idNumber,
      profilePicUrl,
      membershipMonths,
      validUntil,
      canLogin: false
    });

    await user.save();

    // Create welcome notification
    await Notification.createNotification({
      userId: user._id,
      title: 'Welcome to SAHAL CARD!',
      message: `Welcome ${fullName}! Your account has been created by an administrator. Get your Sahal Card to start saving!`,
      type: 'success',
      category: 'system',
      actionUrl: '/sahal-card/register',
      actionText: 'Get Sahal Card'
    });

    // If customer, create Sahal Card automatically
    if (role === 'customer') {
      try {
        await SahalCard.createCard(user._id, 1.00);

        await Notification.createNotification({
          userId: user._id,
          title: 'Sahal Card Created!',
          message: 'Your Sahal Card has been created automatically. Start saving with our partner businesses!',
          type: 'success',
          category: 'card_expiry',
          actionUrl: '/dashboard/sahal-card',
          actionText: 'View Card'
        });
      } catch (cardError) {
        console.error('Error creating Sahal Card:', cardError);
        // Don't fail user creation if card creation fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: user.profile
      }
    });

  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({
      success: false,
      message: 'User creation failed',
      error: error.message
    });
  }
};

// Get all users (Admin only) - excludes superadmin and company users from the list
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const baseQuery = {};

    // Add role filter if specified
    if (role) {
      baseQuery.role = role;
    }

    // Add search filter if specified
    if (search) {
      baseQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const query = baseQuery;

    console.log('🔍 getAllUsers query:', JSON.stringify(query, null, 2));

    // Get users with pagination
    let users = await User.find(query)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await User.countDocuments(query);

    console.log('👥 Found users:', users.length, 'Total:', total);
    console.log('📋 User roles:', users.map(u => ({ name: u.fullName, role: u.role })));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    const currentUser = req.user;

    // Find the user to update
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent updating superadmin accounts (unless current user is superadmin)
    if (userToUpdate.role === 'superadmin' && currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can update superadmin accounts'
      });
    }

    // Update allowed fields
    const allowedFields = ['fullName', 'phone', 'idNumber', 'location', 'profilePicUrl', 'idCardImageUrl', 'validUntil', 'membershipMonths', 'canLogin'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        userToUpdate[field] = updateData[field];
      }
    });

    // If role is being updated, validate it
    if (updateData.role && currentUser.role === 'superadmin') {
      userToUpdate.role = updateData.role;
    }

    await userToUpdate.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: userToUpdate.profile
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Prevent self-deletion
    if (currentUser._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of superadmin accounts (unless current user is superadmin)
    if (userToDelete.role === 'superadmin' && currentUser.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can delete superadmin accounts'
      });
    }

    // Delete related data first
    try {
      // Delete user's Sahal Card
      await SahalCard.deleteMany({ userId: userId });

      // Delete user's notifications
      await Notification.deleteMany({ userId: userId });

      // Delete user's transactions (if any)
      await Transaction.deleteMany({ customerId: userId });

      // Delete user's company (if any)
      // Companies no longer require user accounts, so no company deletion needed

      console.log(`Deleted related data for user: ${userToDelete.fullName}`);
    } catch (relatedDataError) {
      console.error('Error deleting related data:', relatedDataError);
      // Continue with user deletion even if related data deletion fails
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: `User ${userToDelete.fullName} deleted successfully`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Search user by ID number (Public - anyone can search)
const searchUserById = async (req, res) => {
  try {
    const { idNumber } = req.body;

    if (!idNumber || !idNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'ID number is required'
      });
    }

    const trimmedId = idNumber.trim();
    let paddedId = null;
    let unpaddedId = null;

    // Find user by ID number (try multiple formats)
    let user = await User.findOne({ idNumber: trimmedId }).select('-password -refreshTokens');

    // Try padded to 3 digits (e.g. "1" -> "001")
    if (!user) {
      paddedId = trimmedId.padStart(3, '0');
      if (paddedId !== trimmedId) {
        user = await User.findOne({ idNumber: paddedId }).select('-password -refreshTokens');
      }
    }

    // Try unpadded (e.g. "001" -> "1") - just in case old data exists
    if (!user) {
      unpaddedId = trimmedId.replace(/^0+/, '');
      if (unpaddedId !== trimmedId && unpaddedId.length > 0) {
        user = await User.findOne({ idNumber: unpaddedId }).select('-password -refreshTokens');
      }
    }

    // Regex search removed due to 504 Gateway Timeout on large collections.
    // relying on padding/unpadding + debug info.

    if (!user) {
      // DEBUG: Fetch 5 sample IDs to help diagnosis
      let sampleIds = [];
      let dbName = 'unknown';
      try {
        const sampleUsers = await User.find({}, 'idNumber').sort({ _id: -1 }).limit(5);
        sampleIds = sampleUsers.map(u => u.idNumber);
        if (mongoose.connection && mongoose.connection.name) {
          dbName = mongoose.connection.name;
        }
      } catch (e) {
        console.error("Debug stats error", e);
      }

      return res.status(404).json({
        success: false,
        message: 'Macmiilkan ma jiro (User not found)'
      });
    }

    res.json({
      success: true,
      message: 'User found',
      user: user
    });

  } catch (error) {
    console.error('Search user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search user',
      error: error.message
    });
  }
};

// Get next user ID (preview)
const getNextUserId = async (req, res) => {
  try {
    const nextSeq = await Counter.peekNextSequence('userId', 7);
    const nextId = nextSeq.toString().padStart(3, '0');
    res.json({
      success: true,
      nextId
    });
  } catch (error) {
    console.error('Error fetching next user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch next user ID'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  searchUserById,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getNextUserId
};
