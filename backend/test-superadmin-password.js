const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./src/models/User');

// Common test passwords to try
const testPasswords = [
    'maandhise123',  // Default admin password
    'admin123',
    'password',
    'Admin@123',
    'superadmin',
];

async function testLogin() {
    try {
        console.log('🔐 Testing SuperAdmin Login Credentials...\n');

        // Get the superadmin users
        const superAdmins = await User.find({ role: 'superadmin' }).select('+password');

        if (superAdmins.length === 0) {
            console.log('❌ No SuperAdmin users found!');
            process.exit(1);
        }

        for (const admin of superAdmins) {
            console.log(`\n--- Testing: ${admin.fullName} (${admin.phone}) ---`);

            let foundPassword = false;

            for (const password of testPasswords) {
                try {
                    const isValid = await admin.comparePassword(password);
                    if (isValid) {
                        console.log(`✅ SUCCESS! Password found: "${password}"`);
                        console.log(`   Phone: ${admin.phone}`);
                        console.log(`   Password: ${password}`);
                        console.log(`   \n   You can now login with these credentials.`);
                        foundPassword = true;
                        break;
                    }
                } catch (error) {
                    // Skip this password
                }
            }

            if (!foundPassword) {
                console.log(`❌ None of the test passwords worked for this user.`);
                console.log(`   Phone: ${admin.phone}`);
                console.log(`   Tested passwords: ${testPasswords.join(', ')}`);
                console.log(`   \n   ⚠️  You may need to reset the password for this user.`);
            }
        }

        console.log('\n\n📋 Summary:');
        console.log(`Total SuperAdmin users: ${superAdmins.length}`);
        console.log(`Test passwords tried: ${testPasswords.join(', ')}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

testLogin();
