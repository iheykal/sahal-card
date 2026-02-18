require('dotenv').config();
const mongoose = require('mongoose');

async function investigateUserProfileUrls() {
    try {
        console.log('🔍 Investigating MongoDB Users Collection...\n');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@') : 'Not set');
        console.log('');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Use raw MongoDB driver to query
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Get all users with profilePicUrl
        const users = await usersCollection.find(
            { profilePicUrl: { $exists: true, $ne: null, $ne: '' } },
            { projection: { fullName: 1, profilePicUrl: 1 } }
        ).limit(10).toArray();

        console.log(`📂 Found ${users.length} users with profile pictures:\n`);

        if (users.length === 0) {
            console.log('⚠️  No users have profilePicUrl set');
            console.log('   Users may need to re-upload their profile pictures');
        } else {
            users.forEach((user, i) => {
                console.log(`${i + 1}. ${user.fullName}`);
                console.log(`   URL: ${user.profilePicUrl}`);
                console.log('');
            });

            // Analyze URL patterns
            console.log('📊 URL Pattern Analysis:');
            const patterns = {};
            users.forEach(user => {
                if (user.profilePicUrl) {
                    if (user.profilePicUrl.includes('pub-1cef139ca63a45d2b251968e75747e16')) {
                        patterns['correct-public'] = (patterns['correct-public'] || 0) + 1;
                    } else if (user.profilePicUrl.includes('pub-48e9471ba538dabfb67bfddd3880dcbc')) {
                        patterns['old-public'] = (patterns['old-public'] || 0) + 1;
                    } else if (user.profilePicUrl.includes('r2.cloudflarestorage.com')) {
                        patterns['signed-url'] = (patterns['signed-url'] || 0) + 1;
                    } else {
                        patterns['other'] = (patterns['other'] || 0) + 1;
                    }
                }
            });

            console.log(patterns);
            console.log('');
            console.log('Legend:');
            console.log('  correct-public: Using new public URL (should work)');
            console.log('  old-public: Using old public URL (needs update)');
            console.log('  signed-url: Using signed URLs (expire after time)');
            console.log('  other: Different format');
        }

        // Also check total user count
        const totalUsers = await usersCollection.countDocuments();
        const usersWithPic = await usersCollection.countDocuments({
            profilePicUrl: { $exists: true, $ne: null, $ne: '' }
        });
        const usersWithoutPic = totalUsers - usersWithPic;

        console.log('\n📈 Summary:');
        console.log(`   Total users: ${totalUsers}`);
        console.log(`   With profile pic: ${usersWithPic}`);
        console.log(`   Without profile pic: ${usersWithoutPic}`);

        await mongoose.disconnect();
        console.log('\n✅ Done');

    } catch (error) {
        console.log('❌ Error:', error.message);
        process.exit(1);
    }
}

investigateUserProfileUrls();
