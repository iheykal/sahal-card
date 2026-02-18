
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Config
const API_URL = 'http://localhost:5001/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Models (Need to import to create test data)
const Marketer = require('./src/models/Marketer');
const User = require('./src/models/User'); // Use User model for Super Admin

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};

const runRepro = async () => {
    await connectDB();

    try {
        console.log('--- Setting up Test Data ---');

        // 1. Create unique test Marketer
        const uniqueSuffix = Date.now().toString().slice(-6);
        const marketerPhone = `+252615${uniqueSuffix}`;
        const marketer = await Marketer.create({
            fullName: `Debug Marketer ${uniqueSuffix}`,
            phone: marketerPhone,
            password: 'password123',
            governmentIdUrl: 'http://example.com/id.jpg',
            createdBy: new mongoose.Types.ObjectId()
        });
        console.log(`✅ Created Marketer: ${marketer.fullName} (${marketer.phone})`);

        // 2. Generate Marketer Token
        const marketerToken = jwt.sign({ userId: marketer._id, role: 'marketer' }, JWT_SECRET, { expiresIn: '1h' });

        // 3. Create Super Admin (or mock token)
        // We'll just create a dummy superadmin token using a fake user ID but with role 'superadmin'
        // Ideally we should have a real superadmin user in DB, but for JWT verification, if we use the same secret, it might pass if auth middleware trusts role in token
        // Wait, auth middleware fetches User/Marketer from DB by ID. So we need a real user in DB.
        const superAdminUser = await User.create({
            fullName: 'Super Admin Debug',
            phone: `+252617${uniqueSuffix}`,
            password: 'password123',
            role: 'superadmin'
        });
        const adminToken = jwt.sign({ userId: superAdminUser._id, role: 'superadmin' }, JWT_SECRET, { expiresIn: '1h' });
        console.log(`✅ Created Super Admin: ${superAdminUser.fullName}`);

        // --- PHASE 1: MARKETER API CALL ---
        console.log('\n--- PHASE 1: Marketer creating Pending Customer (API) ---');
        console.log(`Target: ${API_URL}/pending-customers/create`);

        const customerData = {
            fullName: `Pending Customer ${uniqueSuffix}`,
            phone: `+252618${uniqueSuffix}`,
            idNumber: '12345678',
            location: 'Mogadishu Debug',
            registrationDate: new Date().toISOString(),
            amount: 12
        };

        try {
            const createRes = await axios.post(`${API_URL}/pending-customers/create`, customerData, {
                headers: { Authorization: `Bearer ${marketerToken}` }
            });
            console.log('✅ Marketer API success:', createRes.data.success);
            console.log('   Response Data:', createRes.data.data.fullName);
        } catch (err) {
            console.error('❌ Marketer API Failed:', err.response ? err.response.data : err.message);
            throw err;
        }

        // --- PHASE 2: SUPER ADMIN API CALL ---
        console.log('\n--- PHASE 2: Super Admin fetching Pending Customers (API) ---');
        console.log(`Target: ${API_URL}/pending-customers?status=pending`);

        try {
            const fetchRes = await axios.get(`${API_URL}/pending-customers?status=pending`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            const customers = fetchRes.data.data.pendingCustomers;
            console.log(`✅ Admin Fetch success. Count: ${customers.length}`);

            const found = customers.find(c => c.phone === customerData.phone);
            if (found) {
                console.log('✅ NEW CUSTOMER FOUND IN LIST!');
                console.log('   Created By (Populate Check):', found.createdBy);
                if (found.createdBy && found.createdBy.fullName) {
                    console.log('   ✅ createdBy.fullName is PRESENT:', found.createdBy.fullName);
                } else {
                    console.error('   ❌ createdBy.fullName is MISSING! This will crash the frontend.');
                    console.log('   Actual createdBy field:', JSON.stringify(found.createdBy, null, 2));
                }
            } else {
                console.error('❌ NEW CUSTOMER NOT FOUND IN ADMIN LIST!');
            }

        } catch (err) {
            console.error('❌ Admin Fetch Failed:', err.response ? err.response.data : err.message);
        }

        // Cleanup
        await Marketer.deleteOne({ _id: marketer._id });
        await User.deleteOne({ _id: superAdminUser._id });
        console.log('\n✅ Cleanup done');

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runRepro();
