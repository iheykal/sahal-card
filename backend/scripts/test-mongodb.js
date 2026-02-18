#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * 
 * This script tests the MongoDB Atlas connection and creates sample data
 * Run with: node scripts/test-mongodb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('../src/models/User');
const SahalCard = require('../src/models/SahalCard');
const Company = require('../src/models/Company');
const Transaction = require('../src/models/Transaction');
const Notification = require('../src/models/Notification');

const testMongoDBConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB Atlas connection...\n');

    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI environment variable is not set');
      console.log('💡 Please set MONGODB_URI in your .env file');
      console.log('   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/maandhise');
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
    console.log('✅ Successfully connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}\n`);

    // Test database operations
    console.log('🧪 Testing database operations...\n');

    // 1. Test User creation
    console.log('1. Testing User model...');
    const testUser = new User({
      fullName: 'Test User',
      email: 'test@maandhise.com',
      phone: '+252613273911',
      idNumber: 'TEST123456',
      location: 'Mogadishu, Somalia',
      password: 'testpassword123',
      role: 'customer'
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@maandhise.com' });
    if (existingUser) {
      console.log('   ⚠️  Test user already exists, skipping creation');
    } else {
      await testUser.save();
      console.log('   ✅ Test user created successfully');
    }

    // 2. Test SahalCard creation
    console.log('2. Testing SahalCard model...');
    const userId = existingUser ? existingUser._id : testUser._id;
    
    const existingCard = await SahalCard.findOne({ userId });
    if (existingCard) {
      console.log('   ⚠️  Test Sahal Card already exists, skipping creation');
    } else {
      const testCard = await SahalCard.createCard(userId, 1.00);
      console.log(`   ✅ Test Sahal Card created: ${testCard.cardNumber}`);
    }

    // 3. Test Company creation
    console.log('3. Testing Company model...');
    const existingCompany = await Company.findOne({ businessName: 'Test Company' });
    if (existingCompany) {
      console.log('   ⚠️  Test company already exists, skipping creation');
    } else {
      const testCompany = new Company({
        businessName: 'Test Company',
        contactInfo: {
          email: 'contact@testcompany.com',
          phone: '+252613273912',
          address: 'Test Address, Mogadishu'
        },
        discountRates: {
          general: 10,
          premium: 15
        },
        isActive: true
      });
      await testCompany.save();
      console.log('   ✅ Test company created successfully');
    }

    // 4. Test database queries
    console.log('4. Testing database queries...');
    
    const userCount = await User.countDocuments();
    const cardCount = await SahalCard.countDocuments();
    const companyCount = await Company.countDocuments();
    
    console.log(`   📊 Total users: ${userCount}`);
    console.log(`   📊 Total Sahal Cards: ${cardCount}`);
    console.log(`   📊 Total companies: ${companyCount}`);

    // 5. Test indexes
    console.log('5. Testing database indexes...');
    const userIndexes = await User.collection.getIndexes();
    const cardIndexes = await SahalCard.collection.getIndexes();
    
    console.log(`   📋 User collection indexes: ${Object.keys(userIndexes).length}`);
    console.log(`   📋 SahalCard collection indexes: ${Object.keys(cardIndexes).length}`);

    console.log('\n🎉 All tests passed! MongoDB Atlas is working correctly.');
    console.log('\n📝 Summary:');
    console.log('   ✅ Connection successful');
    console.log('   ✅ Models working');
    console.log('   ✅ Database operations successful');
    console.log('   ✅ Indexes created');
    console.log('\n🚀 Your MongoDB Atlas setup is ready for production!');

  } catch (error) {
    console.error('\n❌ MongoDB Atlas test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n🔐 Authentication failed. Please check:');
      console.error('   - Username and password in connection string');
      console.error('   - Database user permissions');
    } else if (error.message.includes('network')) {
      console.error('\n🌐 Network error. Please check:');
      console.error('   - Internet connection');
      console.error('   - IP address whitelist in Atlas');
      console.error('   - Cluster status');
    } else if (error.message.includes('timeout')) {
      console.error('\n⏰ Connection timeout. Please check:');
      console.error('   - Cluster is running');
      console.error('   - Network connectivity');
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Verify your MONGODB_URI in .env file');
    console.error('   2. Check MongoDB Atlas cluster status');
    console.error('   3. Verify network access settings');
    console.error('   4. Test connection with MongoDB Compass');
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// Run the test
if (require.main === module) {
  testMongoDBConnection();
}

module.exports = testMongoDBConnection;
