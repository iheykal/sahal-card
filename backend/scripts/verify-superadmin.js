const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

const verifySuperAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Searching for users with role "superadmin" or "admin"...');
        const admins = await User.find({ role: { $in: ['superadmin', 'admin'] } }).select('+password');

        if (admins.length === 0) {
            console.log('❌ No superadmin or admin found!');
        } else {
            console.log(`✅ Found ${admins.length} admin(s):`);
            admins.forEach(admin => {
                console.log('------------------------------------------------');
                console.log(`ID: ${admin._id}`);
                console.log(`Name: ${admin.fullName}`);
                console.log(`Phone: ${admin.phone}`);
                console.log(`Role: ${admin.role}`);
                console.log(`Can Login: ${admin.canLogin}`);
                console.log(`Password Hash Length: ${admin.password ? admin.password.length : 'MISSING'}`);
                console.log('------------------------------------------------');
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
};

verifySuperAdmin();
