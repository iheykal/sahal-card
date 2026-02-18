const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function checkAndFixSuperAdmin() {
    try {
        console.log('🔍 Checking SuperAdmin user...\n');

        // Find the user
        const user = await User.findOne({ phone: '+252613273911' }).select('+password');

        if (!user) {
            console.log('❌ User not found with phone +252613273911');

            // Create new superadmin
            console.log('Creating new superadmin...');
            const newUser = new User({
                fullName: 'Super Admin',
                phone: '+252613273911',
                password: 'maandhise11',
                role: 'superadmin',
                canLogin: true
            });
            await newUser.save();
            console.log('✅ New superadmin created!');
        } else {
            console.log('✅ User found:');
            console.log(`   ID: ${user._id}`);
            console.log(`   Full Name: ${user.fullName}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Can Login: ${user.canLogin}`);
            console.log(`   Has Password: ${!!user.password}`);
            console.log(`   Password Length: ${user.password ? user.password.length : 0}`);

            // Test password
            console.log('\n🔐 Testing password...');
            const isValid = await user.comparePassword('maandhise11');
            console.log(`   Password 'maandhise11' valid: ${isValid}`);

            // Check and fix issues
            let needsUpdate = false;

            if (user.role !== 'superadmin') {
                console.log('\n⚠️  Role is not superadmin, fixing...');
                user.role = 'superadmin';
                needsUpdate = true;
            }

            if (!user.canLogin) {
                console.log('⚠️  canLogin is false, fixing...');
                user.canLogin = true;
                needsUpdate = true;
            }

            if (!isValid) {
                console.log('⚠️  Password is not correct, resetting...');
                user.password = 'maandhise11';
                needsUpdate = true;
            }

            if (needsUpdate) {
                await user.save();
                console.log('\n✅ User updated successfully!');

                // Verify again
                const updatedUser = await User.findOne({ phone: '+252613273911' }).select('+password');
                const newIsValid = await updatedUser.comparePassword('maandhise11');
                console.log(`   Password verification after update: ${newIsValid}`);
            } else {
                console.log('\n✅ User configuration is correct!');
            }
        }

        console.log('\n='.repeat(50));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(50));
        console.log(`   Phone:    +252613273911`);
        console.log(`   Password: maandhise11`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

checkAndFixSuperAdmin();
