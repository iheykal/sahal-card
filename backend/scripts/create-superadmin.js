#!/usr/bin/env node

/**
 * Create Superadmin User Script
 * 
 * This script creates a superadmin user with the specified credentials
 * Run with: node scripts/create-superadmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const createSuperadmin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');

    // Connect to MongoDB Atlas
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ Connected to MongoDB Atlas');

    // Normalize phone number - user can login with 613273911, but we store as +252613273911
    const phoneNumber = '+252613273911';
    const loginPhone = '613273911'; // User can login with this
    
    // Check if superadmin already exists (try multiple phone formats)
    let existingSuperadmin = await User.findOne({ phone: phoneNumber });
    
    // Try alternative formats
    if (!existingSuperadmin) {
      existingSuperadmin = await User.findOne({ phone: '252613273911' });
    }
    if (!existingSuperadmin) {
      existingSuperadmin = await User.findOne({ phone: loginPhone });
    }
    // Also check by role if no phone match
    if (!existingSuperadmin) {
      existingSuperadmin = await User.findOne({ role: 'superadmin' });
    }

    if (existingSuperadmin) {
      console.log('⚠️  Superadmin already exists:');
      console.log(`   Phone: ${existingSuperadmin.phone}`);
      console.log(`   Role: ${existingSuperadmin.role}`);
      console.log(`   Name: ${existingSuperadmin.fullName}`);
      console.log(`   Can Login: ${existingSuperadmin.canLogin ? 'Yes' : 'No'}`);
      
      // Update password, role, and ensure login is enabled
      console.log('\n🔄 Updating superadmin information...');
      existingSuperadmin.fullName = existingSuperadmin.fullName || 'Super Admin';
      existingSuperadmin.phone = phoneNumber; // Normalize to +252 format
      // Only set idNumber if it doesn't exist or is empty
      if (!existingSuperadmin.idNumber) {
        // Check if '001' is available
        const idNumberExists = await User.findOne({ idNumber: '001', _id: { $ne: existingSuperadmin._id } });
        existingSuperadmin.idNumber = idNumberExists ? null : '001';
      }
      existingSuperadmin.location = existingSuperadmin.location || 'Mogadishu';
      existingSuperadmin.password = 'maandhise11';
      existingSuperadmin.role = 'superadmin';
      existingSuperadmin.canLogin = true; // Ensure login is enabled
      await existingSuperadmin.save();
      console.log('✅ Superadmin information updated successfully');
    } else {
      // Create new superadmin
      console.log('🔄 Creating superadmin user...');
      
      // Check if idNumber '001' is available
      const idNumberExists = await User.findOne({ idNumber: '001' });
      const idNumberToUse = idNumberExists ? null : '001'; // Use null if '001' is taken
      
      const superadmin = new User({
        fullName: 'Super Admin',
        phone: phoneNumber, // Store as +252613273911
        idNumber: idNumberToUse, // Use null if '001' is taken
        location: 'Mogadishu',
        password: 'maandhise11',
        role: 'superadmin',
        canLogin: true // Enable login
      });

      await superadmin.save();
      console.log('✅ Superadmin created successfully');
    }

    // Display superadmin details
    let superadmin = await User.findOne({ phone: phoneNumber }).select('+password');
    if (!superadmin) {
      // Try to find by alternative format
      superadmin = await User.findOne({ phone: '252613273911' }).select('+password');
    }
    if (!superadmin) {
      superadmin = await User.findOne({ phone: loginPhone }).select('+password');
    }
    
    if (!superadmin) {
      console.log('❌ Could not find superadmin after creation/update');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('\n📋 Superadmin Details:');
    console.log(`   Name: ${superadmin.fullName}`);
    console.log(`   Phone (stored): ${superadmin.phone}`);
    console.log(`   ID Number: ${superadmin.idNumber || 'N/A'}`);
    console.log(`   Location: ${superadmin.location || 'N/A'}`);
    console.log(`   Role: ${superadmin.role}`);
    console.log(`   Can Login: ${superadmin.canLogin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Created: ${superadmin.createdAt}`);

    // Test password
    console.log('\n🔐 Testing password...');
    const isPasswordValid = await superadmin.comparePassword('maandhise11');
    console.log(`   Password Test: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

    console.log('\n🎉 Superadmin setup completed successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Phone: 613273911 (or +252613273911)');
    console.log('   Password: maandhise11');
    console.log('\n💡 Note: You can login with phone "613273911" - the system will automatically add +252 prefix');

  } catch (error) {
    console.error('\n❌ Error creating superadmin:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔐 Authentication failed. Please check:');
      console.error('   - MongoDB connection string in .env file');
      console.error('   - Database user permissions');
    } else if (error.message.includes('network')) {
      console.error('\n🌐 Network error. Please check:');
      console.error('   - Internet connection');
      console.error('   - MongoDB Atlas cluster status');
    }
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// Run the script
if (require.main === module) {
  createSuperadmin();
}

module.exports = createSuperadmin;
