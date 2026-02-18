#!/usr/bin/env node

/**
 * Check Superadmin User Script
 * 
 * This script checks if a superadmin user exists in the database
 * Run with: node scripts/check-superadmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const checkSuperadmin = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...\n');

    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI environment variable is not set');
      console.log('💡 Please set MONGODB_URI in your .env file');
      process.exit(1);
    }

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
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}\n`);

    // Check for superadmin users
    console.log('🔍 Checking for superadmin users...\n');
    
    const superadmins = await User.find({ role: 'superadmin' })
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 });

    if (superadmins.length === 0) {
      console.log('❌ No superadmin users found in the database\n');
      console.log('💡 To create a superadmin, run:');
      console.log('   node scripts/create-superadmin.js\n');
    } else {
      console.log(`✅ Found ${superadmins.length} superadmin user(s):\n`);
      
      superadmins.forEach((admin, index) => {
        console.log(`📋 Superadmin ${index + 1}:`);
        console.log(`   ID: ${admin._id}`);
        console.log(`   Name: ${admin.fullName || 'N/A'}`);
        console.log(`   Phone: ${admin.phone || 'N/A'}`);
        console.log(`   ID Number: ${admin.idNumber || 'N/A'}`);
        console.log(`   Location: ${admin.location || 'N/A'}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Can Login: ${admin.canLogin ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${admin.createdAt || 'N/A'}`);
        console.log(`   Last Login: ${admin.lastLogin || 'Never'}`);
        console.log('');
      });

      // Check for the specific superadmin phone number
      const specificSuperadmin = await User.findOne({ phone: '+252613273911' })
        .select('-password -refreshTokens');
      
      if (specificSuperadmin) {
        console.log('✅ Default superadmin phone (+252613273911) found:');
        console.log(`   Name: ${specificSuperadmin.fullName}`);
        console.log(`   Role: ${specificSuperadmin.role}`);
        console.log(`   Can Login: ${specificSuperadmin.canLogin ? '✅ Yes' : '❌ No'}\n`);
      } else {
        console.log('⚠️  Default superadmin phone (+252613273911) not found\n');
      }
    }

    // Also check total user count
    const totalUsers = await User.countDocuments({});
    const customerCount = await User.countDocuments({ role: 'customer' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    console.log('📊 Database Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Superadmins: ${superadmins.length}\n`);

  } catch (error) {
    console.error('\n❌ Error checking superadmin:');
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
    console.log('🔌 Database connection closed.\n');
  }
};

// Run the script
if (require.main === module) {
  checkSuperadmin();
}

module.exports = checkSuperadmin;

