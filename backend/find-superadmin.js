const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./src/models/User');
const Marketer = require('./src/models/Marketer');

async function findSuperAdmin() {
    try {
        console.log('🔍 Searching for SuperAdmin users...\n');

        // Find all superadmin users
        const superAdmins = await User.find({ role: 'superadmin' }).select('+password');

        if (superAdmins.length === 0) {
            console.log('❌ No SuperAdmin users found in database!');
            console.log('   You may need to create one.\n');
        } else {
            console.log(`✅ Found ${superAdmins.length} SuperAdmin user(s):\n`);

            superAdmins.forEach((admin, index) => {
                console.log(`--- SuperAdmin ${index + 1} ---`);
                console.log(`Full Name: ${admin.fullName}`);
                console.log(`Phone: ${admin.phone}`);
                console.log(`Can Login: ${admin.canLogin}`);
                console.log(`Has Password: ${admin.password ? 'Yes ✓' : 'No ✗'}`);
                console.log(`Created At: ${admin.createdAt}`);
                console.log(`ID: ${admin._id}`);
                console.log('');
            });
        }

        // Also check for any marketers
        console.log('\n🔍 Checking for Marketers...\n');
        const marketers = await Marketer.find().select('+password').limit(5);

        if (marketers.length > 0) {
            console.log(`Found ${marketers.length} marketer(s) (showing first 5):\n`);
            marketers.forEach((marketer, index) => {
                console.log(`--- Marketer ${index + 1} ---`);
                console.log(`Full Name: ${marketer.fullName}`);
                console.log(`Phone: ${marketer.phone}`);
                console.log(`Can Login: ${marketer.canLogin}`);
                console.log(`Has Password: ${marketer.password ? 'Yes ✓' : 'No ✗'}`);
                console.log('');
            });
        }

        // Check total users
        const totalUsers = await User.countDocuments();
        console.log(`\n📊 Total users in database: ${totalUsers}`);

        // Show role breakdown
        const roles = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('\nRole breakdown:');
        roles.forEach(role => {
            console.log(`  ${role._id}: ${role.count}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

findSuperAdmin();
