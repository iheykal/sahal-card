const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Try loading .env from multiple locations
const envLocations = [
    '.env',
    '../.env',
    'backend/.env',
    'maandhise-main/backend/.env'
];

console.log('Current directory:', process.cwd());

let loaded = false;
for (const loc of envLocations) {
    const result = dotenv.config({ path: loc });
    if (!result.error) {
        console.log(`Loaded .env from: ${loc}`);
        loaded = true;
        break; // Stop after first success? Maybe load all to be safe? 
        // dotenv doesn't overwrite existing keys by default, so order matters.
    }
}

if (!process.env.MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI not found in any .env file.');
    console.error('Checked locations:', envLocations);
    // process.exit(1); 
    // Don't exit yet, maybe it's already in process.env?
} else {
    console.log('MONGODB_URI found (length):', process.env.MONGODB_URI.length);
}

async function checkUsers() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is undefined');
        }

        let uri = process.env.MONGODB_URI;
        // If it already contains maandhise, don't append it again
        if (!uri.includes('/maandhise')) {
            if (uri.includes('?')) {
                uri = uri.replace('?', 'maandhise?');
            } else if (uri.endsWith('/')) {
                uri += 'maandhise';
            } else {
                uri += '/maandhise';
            }
        }

        console.log('Connecting to Mongo...');
        await mongoose.connect(uri);
        console.log('Connected to DB:', mongoose.connection.name);

        const usersCol = mongoose.connection.db.collection('users');

        // Search for 001 specifically
        const user001 = await usersCol.findOne({ idNumber: "001" });

        if (user001) {
            console.log('\n--- SUCCESS: USER "001" FOUND ---');
            console.log(`Name:  ${user001.fullName}`);
            console.log(`ID:    ${user001.idNumber}`);
            console.log(`Role:  ${user001.role || 'customer'}`);
            console.log(`Phone: ${user001.phone}`);
            console.log('----------------------------------\n');

            if (user001.role === 'superadmin' || user001.role === 'company') {
                console.log('EXPLANATION: This user is hidden from the "Users" list in the Admin panel');
                console.log('because they have an admin/company role. This is done for security.');
            }
        } else {
            console.log('User "001" not found. Listing first 5 users to check ID format:');
            const sample = await usersCol.find({}).limit(5).toArray();
            sample.forEach(u => console.log(` - ID: "${u.idNumber}", Name: "${u.fullName}"`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
