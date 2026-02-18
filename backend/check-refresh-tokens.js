#!/usr/bin/env node

/**
 * Check refresh tokens for both superadmins
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkRefreshTokens = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas\n');

        // Get both superadmins with their refresh tokens
        const superadmin1 = await User.findOne({ phone: '+252613273911' });
        const superadmin2 = await User.findOne({ phone: '+252615000000' });

        console.log('='.repeat(80));
        console.log('SuperAdmin 1 (613273911):');
        console.log('─'.repeat(40));
        if (superadmin1) {
            console.log(`   _id: ${superadmin1._id}`);
            console.log(`   Refresh Tokens Count: ${superadmin1.refreshTokens ? superadmin1.refreshTokens.length : 0}`);
            if (superadmin1.refreshTokens && superadmin1.refreshTokens.length > 0) {
                console.log('   Tokens:');
                superadmin1.refreshTokens.forEach((rt, i) => {
                    console.log(`     [${i}] Created: ${rt.createdAt}, Token: ${rt.token ? rt.token.substring(0, 30) + '...' : 'EMPTY'}`);
                });
            }
        } else {
            console.log('   ❌ Not found!');
        }

        console.log('\n' + '='.repeat(80));
        console.log('SuperAdmin 2 (615000000):');
        console.log('─'.repeat(40));
        if (superadmin2) {
            console.log(`   _id: ${superadmin2._id}`);
            console.log(`   Refresh Tokens Count: ${superadmin2.refreshTokens ? superadmin2.refreshTokens.length : 0}`);
            if (superadmin2.refreshTokens && superadmin2.refreshTokens.length > 0) {
                console.log('   Tokens:');
                superadmin2.refreshTokens.forEach((rt, i) => {
                    console.log(`     [${i}] Created: ${rt.createdAt}, Token: ${rt.token ? rt.token.substring(0, 30) + '...' : 'EMPTY'}`);
                });
            }
        } else {
            console.log('   ❌ Not found!');
        }

        // Clear all refresh tokens for superadmin 1 and test again
        console.log('\n' + '='.repeat(80));
        console.log('\n🔧 Clearing stale refresh tokens for SuperAdmin 1...');
        if (superadmin1) {
            superadmin1.refreshTokens = [];
            await superadmin1.save();
            console.log('   ✅ Refresh tokens cleared!');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
};

checkRefreshTokens();
