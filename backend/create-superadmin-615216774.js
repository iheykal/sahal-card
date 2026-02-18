#!/usr/bin/env node

/**
 * Create SuperAdmin: 615216774 / maandhise11
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createSuperadmin = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        const phoneNumber = '+252615216774';
        const password = 'maandhise11';

        // Check if user exists
        const existing = await usersCollection.findOne({ phone: phoneNumber });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        if (existing) {
            console.log('⚠️ User exists, updating to superadmin...');
            await usersCollection.updateOne(
                { phone: phoneNumber },
                {
                    $set: {
                        password: hashedPassword,
                        role: 'superadmin',
                        canLogin: true,
                        refreshTokens: []
                    }
                }
            );
            console.log('✅ Updated to superadmin!');
        } else {
            console.log('🔄 Creating new superadmin...');
            await usersCollection.insertOne({
                fullName: 'Super Admin',
                phone: phoneNumber,
                password: hashedPassword,
                role: 'superadmin',
                canLogin: true,
                refreshTokens: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log('✅ Superadmin created!');
        }

        // Verify
        const user = await usersCollection.findOne({ phone: phoneNumber });
        const isValid = await bcrypt.compare(password, user.password);

        console.log('\n📋 SuperAdmin Details:');
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password Valid: ${isValid ? '✅' : '❌'}`);

        console.log('\n🔐 Login Credentials:');
        console.log('   Phone: 615216774');
        console.log('   Password: maandhise11');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Done.');
    }
};

createSuperadmin();
