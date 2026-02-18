#!/usr/bin/env node

/**
 * Check both superadmin accounts for comparison
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkSuperadmins = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas\n');

        // Get all superadmins
        const superadmins = await User.find({ role: 'superadmin' }).select('+password');

        console.log(`Found ${superadmins.length} superadmin(s):\n`);
        console.log('='.repeat(80));

        for (const admin of superadmins) {
            console.log(`\n📋 Account: ${admin.fullName}`);
            console.log('─'.repeat(40));
            console.log(`   _id: ${admin._id}`);
            console.log(`   Phone: ${admin.phone}`);
            console.log(`   Role: ${admin.role}`);
            console.log(`   canLogin: ${admin.canLogin}`);
            console.log(`   idNumber: ${admin.idNumber || 'N/A'}`);
            console.log(`   Password Hash: ${admin.password ? admin.password.substring(0, 20) + '...' : 'MISSING!'}`);
            console.log(`   Created: ${admin.createdAt}`);
            console.log(`   Updated: ${admin.updatedAt}`);

            // Test password
            if (admin.password) {
                const isValid = await admin.comparePassword('maandhise11');
                console.log(`   Password 'maandhise11' Valid: ${isValid ? '✅ Yes' : '❌ No'}`);
            } else {
                console.log(`   Password 'maandhise11' Valid: ❌ No password set!`);
            }

            // Check for any potential issues
            console.log('\n   🔍 Potential Issues:');
            if (!admin.canLogin) {
                console.log('      ❌ canLogin is FALSE - user cannot log in!');
            }
            if (!admin.password) {
                console.log('      ❌ No password set!');
            }
            if (admin.phone && !admin.phone.startsWith('+252')) {
                console.log('      ⚠️ Phone not in +252 format');
            }
        }

        // Check specifically for 613273911
        console.log('\n' + '='.repeat(80));
        console.log('\n🔍 Checking for phone 613273911 variants:');

        const variants = ['+252613273911', '613273911', '252613273911'];
        for (const phone of variants) {
            const user = await User.findOne({ phone }).select('+password');
            if (user) {
                console.log(`\n   Found with phone "${phone}":`);
                console.log(`   - Role: ${user.role}`);
                console.log(`   - canLogin: ${user.canLogin}`);
                console.log(`   - Has Password: ${!!user.password}`);
                if (user.password) {
                    const isValid = await user.comparePassword('maandhise11');
                    console.log(`   - Password Valid: ${isValid ? '✅' : '❌'}`);
                }
            } else {
                console.log(`   ❌ No user found with phone "${phone}"`);
            }
        }

        // Check for 615000000 variants
        console.log('\n🔍 Checking for phone 615000000 variants:');

        const variants2 = ['+252615000000', '615000000', '252615000000'];
        for (const phone of variants2) {
            const user = await User.findOne({ phone }).select('+password');
            if (user) {
                console.log(`\n   Found with phone "${phone}":`);
                console.log(`   - Role: ${user.role}`);
                console.log(`   - canLogin: ${user.canLogin}`);
                console.log(`   - Has Password: ${!!user.password}`);
                if (user.password) {
                    const isValid = await user.comparePassword('maandhise11');
                    console.log(`   - Password Valid: ${isValid ? '✅' : '❌'}`);
                }
            } else {
                console.log(`   ❌ No user found with phone "${phone}"`);
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
};

checkSuperadmins();
