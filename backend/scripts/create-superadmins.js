const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const createSuperAdmins = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const admins = [
            { phone: '615216774', password: 'maandhise11', fullName: 'Super Admin 1' },
            { phone: '613273911', password: 'maandhise11', fullName: 'Super Admin 2' }
        ];

        for (const admin of admins) {
            console.log(`Processing ${admin.phone}...`);

            // Check if user exists (try various phone formats)
            let user = await User.findOne({
                $or: [
                    { phone: admin.phone },
                    { phone: `+252${admin.phone}` },
                    { phone: `252${admin.phone}` }
                ]
            });

            if (user) {
                console.log(`Found existing user: ${user.fullName} (${user.phone})`);
                user.password = admin.password;
                user.role = 'superadmin';
                user.canLogin = true;
                // Ensure phone is normalized if needed, but keeping existing is safer for now
                // user.phone = admin.phone; 
                await user.save();
                console.log('✅ Updated to SuperAdmin with new password.');
            } else {
                console.log('User not found. Creating new SuperAdmin...');
                user = await User.create({
                    fullName: admin.fullName,
                    phone: admin.phone,
                    password: admin.password,
                    role: 'superadmin',
                    canLogin: true,
                    // Add required fields
                    email: `admin${admin.phone}@example.com`, // Dummy email if required
                    idNumber: `SA${admin.phone.slice(-4)}` // Dummy ID
                });
                console.log('✅ Created new SuperAdmin.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
};

createSuperAdmins();
