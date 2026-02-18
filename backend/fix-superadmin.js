const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function fixSuperAdmin() {
    try {
        console.log('🔧 Fixing SuperAdmin role...\n');

        // Use native MongoDB collection to avoid model validation issues
        const db = mongoose.connection;

        // Wait for connection
        await new Promise((resolve) => {
            if (db.readyState === 1) resolve();
            else db.once('open', resolve);
        });

        const usersCollection = db.collection('users');

        // First, delete all existing superadmins (both 'superadmin' and 'SUPER_ADMIN' roles)
        const deleteResult = await usersCollection.deleteMany({
            phone: { $ne: '+252613273911' },
            role: { $in: ['superadmin', 'SUPER_ADMIN'] }
        });
        console.log(`Deleted ${deleteResult.deletedCount} other superadmin(s)`);

        // Check existing user
        const existingUser = await usersCollection.findOne({ phone: '+252613273911' });

        if (existingUser) {
            console.log('Found existing user:');
            console.log(`  ID: ${existingUser._id}`);
            console.log(`  Role: "${existingUser.role}"`);
            console.log(`  canLogin: ${existingUser.canLogin}`);

            // Hash the password
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('maandhise11', 12);

            // Fix the role to lowercase 'superadmin' and reset password
            const updateResult = await usersCollection.updateOne(
                { phone: '+252613273911' },
                {
                    $set: {
                        role: 'superadmin',  // lowercase!
                        canLogin: true,
                        password: hashedPassword
                    }
                }
            );
            console.log(`Updated: ${updateResult.modifiedCount > 0 ? 'Yes' : 'No'}`);

            // Verify
            const updatedUser = await usersCollection.findOne({ phone: '+252613273911' });
            console.log('\nAfter fix:');
            console.log(`  Role: "${updatedUser.role}"`);
            console.log(`  canLogin: ${updatedUser.canLogin}`);
        } else {
            console.log('User not found, creating new one...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('maandhise11', 12);

            await usersCollection.insertOne({
                fullName: 'Super Admin',
                phone: '+252613273911',
                password: hashedPassword,
                role: 'superadmin',  // lowercase!
                canLogin: true,
                isActive: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('New superadmin created!');
        }

        console.log('\n='.repeat(50));
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('='.repeat(50));
        console.log(`   Phone:    +252613273911`);
        console.log(`   Password: maandhise11`);
        console.log('='.repeat(50));
        console.log('\n⚠️  Please clear your browser localStorage and try logging in again!');
        console.log('   Open DevTools > Application > Local Storage > Clear All');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

fixSuperAdmin();
