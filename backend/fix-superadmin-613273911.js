#!/usr/bin/env node

/**
 * Fix the superadmin 613273911 by clearing refresh tokens and ensuring clean state
 */

require('dotenv').config();
const mongoose = require('mongoose');

const fixSuperadmin = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find the superadmin
        const superadmin = await usersCollection.findOne({ phone: '+252613273911' });

        if (!superadmin) {
            console.log('❌ SuperAdmin 613273911 not found!');
            return;
        }

        console.log('Found SuperAdmin:');
        console.log(`   _id: ${superadmin._id}`);
        console.log(`   Phone: ${superadmin.phone}`);
        console.log(`   Role: ${superadmin.role}`);
        console.log(`   canLogin: ${superadmin.canLogin}`);
        console.log(`   Refresh Tokens Count: ${superadmin.refreshTokens ? superadmin.refreshTokens.length : 0}`);

        // Clear all refresh tokens using direct MongoDB update
        console.log('\n🔧 Clearing stale refresh tokens...');
        const updateResult = await usersCollection.updateOne(
            { _id: superadmin._id },
            {
                $set: {
                    refreshTokens: [],
                    canLogin: true
                }
            }
        );

        console.log(`   Modified: ${updateResult.modifiedCount}`);

        // Now reset the password using the User Model (to ensure proper hashing)
        console.log('\n🔧 Resetting password to maandhise11...');
        const User = require('./src/models/User');
        const user = await User.findOne({ phone: '+252613273911' });

        if (user) {
            user.password = 'maandhise11';
            user.canLogin = true;
            await user.save({ validateBeforeSave: false });
            console.log('   ✅ Password reset successfully!');

            // Verify password
            const isValid = await user.comparePassword('maandhise11');
            console.log(`   Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        } else {
            console.log('   ❌ Could not find user to reset password');
        }

        console.log('\n🎉 SuperAdmin 613273911 has been fixed!');
        console.log('\n🔐 Login Credentials:');
        console.log('   Phone: 613273911');
        console.log('   Password: maandhise11');
        console.log('\n💡 Please clear your browser localStorage and try logging in again:');
        console.log('   1. Open DevTools (F12)');
        console.log('   2. Go to Application > Local Storage');
        console.log('   3. Clear all data');
        console.log('   4. Refresh the page and login');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
};

fixSuperadmin();
