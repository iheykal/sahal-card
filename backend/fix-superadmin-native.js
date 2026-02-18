#!/usr/bin/env node

/**
 * Fix the superadmin 613273911 using native MongoDB only
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const fixSuperadminNative = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Hash the password
        console.log('🔧 Hashing password...');
        const hashedPassword = await bcrypt.hash('maandhise11', 12);
        console.log('   Password hashed successfully');

        // Update the superadmin using native MongoDB
        console.log('\n🔧 Updating SuperAdmin 613273911...');
        const updateResult = await usersCollection.updateOne(
            { phone: '+252613273911' },
            {
                $set: {
                    refreshTokens: [],
                    canLogin: true,
                    password: hashedPassword,
                    role: 'superadmin'
                },
                $unset: { __v: "" }  // Remove version key to avoid conflicts
            }
        );

        console.log(`   Matched: ${updateResult.matchedCount}`);
        console.log(`   Modified: ${updateResult.modifiedCount}`);

        // Verify
        const user = await usersCollection.findOne({ phone: '+252613273911' });
        if (user) {
            console.log('\n📋 Updated SuperAdmin Details:');
            console.log(`   _id: ${user._id}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   canLogin: ${user.canLogin}`);
            console.log(`   Refresh Tokens Count: ${user.refreshTokens ? user.refreshTokens.length : 0}`);
            console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'MISSING'}`);

            // Verify password
            const isValid = await bcrypt.compare('maandhise11', user.password);
            console.log(`   Password 'maandhise11' Valid: ${isValid ? '✅ Yes' : '❌ No'}`);
        }

        console.log('\n🎉 SuperAdmin 613273911 has been fixed!');
        console.log('\n🔐 Login Credentials:');
        console.log('   Phone: 613273911');
        console.log('   Password: maandhise11');
        console.log('\n💡 Please clear your browser localStorage and try logging in again!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
};

fixSuperadminNative();
