const mongoose = require('mongoose');
require('dotenv').config();

const investigateUser = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected\n');

        const db = mongoose.connection.db;
        const users = db.collection('users');

        // Check for 615216774
        console.log('🔍 Checking for +252615216774...');
        const user = await users.findOne({ phone: '+252615216774' });

        if (user) {
            console.log('User Found:');
            console.log(`   _id: ${user._id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   canLogin: ${user.canLogin} (Type: ${typeof user.canLogin})`);
            console.log(`   Password Exists: ${!!user.password}`);
            console.log(`   Updated At: ${user.updatedAt}`);
        } else {
            console.log('❌ User not found with +252615216774');
        }

        // Check for 615216774 without +252 just in case
        const userRaw = await users.findOne({ phone: '615216774' });
        if (userRaw) {
            console.log('\nFound with raw phone 615216774:');
            console.log(`   _id: ${userRaw._id}`);
            console.log(`   Role: ${userRaw.role}`);
            console.log(`   canLogin: ${userRaw.canLogin}`);
        }


        // Check for Marketer with same phone
        console.log('\n🔍 Checking Marketers collection for +252615216774...');
        const marketers = db.collection('marketers');
        let marketer = await marketers.findOne({ phone: '+252615216774' });

        if (marketer) {
            console.log('⚠️ Marketer Found with +252 format:');
            console.log(`   _id: ${marketer._id}`);
            console.log(`   canLogin: ${marketer.canLogin}`);
        }

        // Check for Marketer with local format (615...)
        console.log('\n🔍 Checking Marketers collection for 615216774...');
        marketer = await marketers.findOne({ phone: '615216774' });

        if (marketer) {
            console.log('⚠️ Marketer Found with local format (BLOCKING LOGIN):');
            console.log(`   _id: ${marketer._id}`);
            console.log(`   canLogin: ${marketer.canLogin}`);
            console.log(`   Status: ${marketer.status}`);
        } else {
            console.log('✅ No Marketer found with local format.');
        }

        // Check for Marketer with 252 format (252615...)
        console.log('\n🔍 Checking Marketers collection for 252615216774...');
        marketer = await marketers.findOne({ phone: '252615216774' });

        if (marketer) {
            console.log('⚠️ Marketer Found with 252 format (BLOCKING LOGIN):');
            console.log(`   _id: ${marketer._id}`);
            console.log(`   canLogin: ${marketer.canLogin}`);
            console.log(`   Status: ${marketer.status}`);
        } else {
            console.log('✅ No Marketer found with 252 format.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Done');
    }
};

investigateUser();
