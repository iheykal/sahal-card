#!/usr/bin/env node

/**
 * Test Superadmin Login Script
 * 
 * This script tests the superadmin login functionality
 * Run with: node scripts/test-superadmin-login.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const testSuperadminLogin = async () => {
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

    // Find superadmin user
    console.log('\n🔍 Looking for superadmin user...');
    const superadmin = await User.findOne({ phone: '+252613273911' }).select('+password');
    
    if (!superadmin) {
      console.log('❌ Superadmin user not found!');
      return;
    }

    console.log('✅ Superadmin user found:');
    console.log(`   Name: ${superadmin.fullName}`);
    console.log(`   Phone: ${superadmin.phone}`);
    console.log(`   Role: ${superadmin.role}`);
    console.log(`   Has Password: ${superadmin.password ? 'Yes' : 'No'}`);

    // Test password comparison
    console.log('\n🔐 Testing password comparison...');
    const testPassword = 'maandhise11';
    const isPasswordValid = await superadmin.comparePassword(testPassword);
    
    console.log(`   Test Password: ${testPassword}`);
    console.log(`   Password Valid: ${isPasswordValid ? '✅ Yes' : '❌ No'}`);

    if (isPasswordValid) {
      console.log('\n🎉 Superadmin login test PASSED!');
      console.log('   The superadmin can log in successfully.');
    } else {
      console.log('\n❌ Superadmin login test FAILED!');
      console.log('   Password comparison failed.');
      
      // Try to reset the password
      console.log('\n🔄 Resetting password...');
      superadmin.password = 'maandhise11';
      await superadmin.save();
      console.log('✅ Password reset completed');
      
      // Test again
      const isPasswordValidAfterReset = await superadmin.comparePassword(testPassword);
      console.log(`   Password Valid After Reset: ${isPasswordValidAfterReset ? '✅ Yes' : '❌ No'}`);
    }

  } catch (error) {
    console.error('\n❌ Error testing superadmin login:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// Run the script
if (require.main === module) {
  testSuperadminLogin();
}

module.exports = testSuperadminLogin;












