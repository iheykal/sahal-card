// Script to delete specific companies from the database
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/maandhise';

const companySchema = new mongoose.Schema({
    businessName: String,
    businessType: String,
}, { strict: false });

const Company = mongoose.model('Company', companySchema);

async function deleteCompanies() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        // Companies to delete (including variations)
        const namesToDelete = [
            'Test Company',
            'Sphagetti House',
            'Somali sudenese',
            'somali sudanese'
        ];

        console.log('Companies to delete:', namesToDelete);
        console.log('---');

        for (const name of namesToDelete) {
            // Try case-insensitive match
            const companies = await Company.find({
                businessName: { $regex: new RegExp(`^${name}$`, 'i') }
            });

            if (companies.length > 0) {
                for (const company of companies) {
                    console.log(`Found: "${company.businessName}" (ID: ${company._id})`);
                    await Company.findByIdAndDelete(company._id);
                    console.log(`✅ Deleted: "${company.businessName}"`);
                }
            } else {
                console.log(`❌ Not found: "${name}"`);
            }
            console.log('---');
        }

        // Show remaining companies
        const remaining = await Company.find({}).select('businessName businessType');
        console.log('\nRemaining companies:', remaining.length);
        remaining.forEach(c => console.log(`  - ${c.businessName} (${c.businessType})`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

deleteCompanies();
