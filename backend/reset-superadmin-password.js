const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./src/models/User');

// New password to set
const NEW_PASSWORD = 'admin123';

async function resetSuperAdminPassword() {
    try {
        console.log('🔐 Resetting SuperAdmin Password...\n');

        // Get the first superadmin user
        const superAdmin = await User.findOne({ role: 'superadmin' }).select('+password');

        if (!superAdmin) {
            console.log('❌ No SuperAdmin user found!');
            process.exit(1);
        }

        console.log(`Found SuperAdmin: ${superAdmin.fullName}`);
        console.log(`Phone: ${superAdmin.phone}`);
        console.log(`Current canLogin: ${superAdmin.canLogin}\n`);

        // Set new password (will be automatically hashed by the model's pre-save hook)
        superAdmin.password = NEW_PASSWORD;
        superAdmin.canLogin = true; // Ensure login is enabled

        await superAdmin.save();

        console.log('✅ Password reset successfully!\n');
        console.log('📋 Login Credentials:');
        console.log(`   Phone: ${superAdmin.phone}`);
        console.log(`   Password: ${NEW_PASSWORD}`);
        console.log(`   Can Login: ${superAdmin.canLogin}`);
        console.log('\n🎉 You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

resetSuperAdminPassword();
