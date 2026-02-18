const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const User = require('./src/models/User');

async function setupSuperAdmin() {
    try {
        console.log('🔧 Setting up SuperAdmin...\n');

        // Step 1: Delete all superadmins except the target phone
        await User.deleteMany({
            role: 'superadmin',
            phone: { $ne: '+252613273911' }
        });
        console.log('✅ Cleaned up other superadmin users\n');

        // Step 2: Hash the password
        const hashedPassword = await bcrypt.hash('maandhise11', 12);

        // Step 3: Update existing user or create new one using updateOne with upsert
        const result = await User.updateOne(
            { phone: '+252613273911' },
            {
                $set: {
                    fullName: 'Super Admin',
                    phone: '+252613273911',
                    password: hashedPassword,
                    role: 'superadmin',
                    canLogin: true
                }
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log('✅ New SuperAdmin created successfully!\n');
        } else {
            console.log('✅ Existing user updated to SuperAdmin!\n');
        }

        console.log('='.repeat(50));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(50));
        console.log(`   Phone:    +252613273911`);
        console.log(`   Password: maandhise11`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

setupSuperAdmin();
