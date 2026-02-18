require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const updateIdNumber = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Find user with current ID number
    const currentIdNumber = '001';
    const newIdNumber = '786768768';

    const user = await User.findOne({ idNumber: currentIdNumber });
    
    if (!user) {
      console.log(`❌ User with ID number "${currentIdNumber}" not found`);
      
      // Try to find by other methods
      console.log('\n📋 Searching for user...');
      const allUsers = await User.find({}).select('fullName phone idNumber');
      console.log('All users with ID numbers:');
      allUsers.forEach(u => {
        console.log(`  - ${u.fullName || 'Unknown'}: ${u.idNumber || 'No ID'} (Phone: ${u.phone || 'N/A'})`);
      });
      
      process.exit(1);
    }

    // Check if new ID number already exists
    const existingUser = await User.findOne({ idNumber: newIdNumber });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      console.error(`❌ ID number "${newIdNumber}" already exists for user: ${existingUser.fullName}`);
      process.exit(1);
    }

    // Update ID number
    const oldIdNumber = user.idNumber;
    user.idNumber = newIdNumber;
    await user.save();

    console.log(`✅ Successfully updated ID number`);
    console.log(`   User: ${user.fullName}`);
    console.log(`   Old ID: ${oldIdNumber}`);
    console.log(`   New ID: ${newIdNumber}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating ID number:', error);
    process.exit(1);
  }
};

updateIdNumber();

