#!/usr/bin/env node

/**
 * Create New Superadmin User Script
 * Phone: 615000000 (stored as +252615000000)
 * Password: maandhise11
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createNewSuperadmin = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log('✅ Connected to MongoDB Atlas');

        // Phone number configuration
        const phoneNumber = '+252615000000';
        const loginPhone = '615000000';
        const password = 'maandhise11';

        // Check if user already exists with this phone
        let existingUser = await User.findOne({ phone: phoneNumber });
        if (!existingUser) {
            existingUser = await User.findOne({ phone: loginPhone });
        }
        if (!existingUser) {
            existingUser = await User.findOne({ phone: '252615000000' });
        }

        if (existingUser) {
            console.log('⚠️  User with this phone already exists:');
            console.log(`   Phone: ${existingUser.phone}`);
            console.log(`   Role: ${existingUser.role}`);
            console.log(`   Name: ${existingUser.fullName}`);

            // Update to superadmin
            console.log('\n🔄 Updating user to superadmin...');
            existingUser.password = password;
            existingUser.role = 'superadmin';
            existingUser.canLogin = true;
            existingUser.phone = phoneNumber;
            await existingUser.save();
            console.log('✅ User updated to superadmin successfully');
        } else {
            // Create new superadmin
            console.log('🔄 Creating new superadmin user...');

            const superadmin = new User({
                fullName: 'Super Admin 2',
                phone: phoneNumber,
                password: password,
                role: 'superadmin',
                canLogin: true,
                location: 'Mogadishu'
            });

            await superadmin.save();
            console.log('✅ Superadmin created successfully');
        }

        // Verify the superadmin
        const superadmin = await User.findOne({ phone: phoneNumber }).select('+password');

        if (!superadmin) {
            console.log('❌ Could not find superadmin after creation');
            process.exit(1);
        }

        console.log('\n📋 Superadmin Details:');
        console.log(`   Name: ${superadmin.fullName}`);
        console.log(`   Phone (stored): ${superadmin.phone}`);
        console.log(`   Role: ${superadmin.role}`);
        console.log(`   Can Login: ${superadmin.canLogin ? '✅ Yes' : '❌ No'}`);

        // Test password
        console.log('\n🔐 Testing password...');
        const isPasswordValid = await superadmin.comparePassword(password);
        console.log(`   Password Test: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);

        console.log('\n🎉 Superadmin setup completed successfully!');
        console.log('\n🔐 Login Credentials:');
        console.log(`   Phone: ${loginPhone} (or ${phoneNumber})`);
        console.log(`   Password: ${password}`);

    } catch (error) {
        console.error('\n❌ Error creating superadmin:');
        console.error(`   Error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
};

createNewSuperadmin();
