
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Marketer = require('./src/models/Marketer');
const PendingCustomer = require('./src/models/PendingCustomer');
const User = require('./src/models/User');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const runVerification = async () => {
    await connectDB();

    try {
        // 1. Create a Test Marketer
        console.log('\n--- 1. Creating Test Marketer ---');
        const testPhone = '+252615000999';
        await Marketer.deleteOne({ phone: testPhone }); // Cleanup

        const marketer = await Marketer.create({
            fullName: 'Test Marketer',
            phone: testPhone,
            password: 'password123',
            governmentIdUrl: 'http://example.com/id.jpg',
            createdBy: new mongoose.Types.ObjectId() // Mock ID
        });
        console.log('✅ Marketer created:', marketer.phone);

        // 2. Generate Token
        const token = jwt.sign({
            id: marketer._id,
            role: 'marketer'
        }, JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ Token generated');

        // 3. Simulate "Create Pending Customer" (Validation Logic)
        console.log('\n--- 2. Simulating Create Pending Customer ---');
        const customerPhone = '+252615000888';
        await PendingCustomer.deleteMany({ phone: customerPhone });
        await User.deleteMany({ phone: customerPhone });

        const pendingCustomerData = {
            fullName: 'Test Customer',
            phone: customerPhone,
            idNumber: '12345',
            location: 'Mogadishu',
            registrationDate: new Date(),
            amount: 1,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            createdBy: marketer._id,
            status: 'pending'
        };

        const pendingCustomer = await PendingCustomer.create(pendingCustomerData);
        console.log('✅ Pending Customer created in DB:', pendingCustomer.phone);
        console.log('   Linked to Marketer:', pendingCustomer.createdBy.toString() === marketer._id.toString());

        // 4. Verify Super Admin Fetch
        console.log('\n--- 3. Verifying Super Admin Fetch ---');
        const foundCustomers = await PendingCustomer.find({ status: 'pending' }).populate('createdBy', 'fullName phone');
        const ourCustomer = foundCustomers.find(c => c.phone === customerPhone);

        if (ourCustomer) {
            console.log('✅ Found customer in pending list');
            console.log('   Submitted By:', ourCustomer.createdBy.fullName);
        } else {
            console.error('❌ Could not find customer in pending list');
        }

        // Cleanup
        await Marketer.deleteOne({ _id: marketer._id });
        await PendingCustomer.deleteOne({ _id: pendingCustomer._id });
        console.log('\n✅ Cleanup completed');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
