const fs = require('fs');
const path = require('path');

/**
 * Update R2 credentials to new sahal-card-2025 bucket
 * Old images will remain accessible via their existing URLs
 */

// New R2 credentials for sahal-card-2025
const newCredentials = {
    CLOUDFLARE_ACCOUNT_ID: '48e9471ba538dabfb67bfddd3880dcbc',
    CLOUDFLARE_ACCESS_KEY_ID: 'b2e94ed04111897cf6f2a151538c7418',
    CLOUDFLARE_SECRET_ACCESS_KEY: 'a364ed990f2745517e5b781e56e26674ce8b9544bd2ba7c92a42efebff1c7570',
    CLOUDFLARE_ENDPOINT: 'https://48e9471ba538dabfb67bfddd3880dcbc.r2.cloudflarestorage.com',
    CLOUDFLARE_BUCKET_NAME: 'sahal-card-2025',
    CLOUDFLARE_PUBLIC_URL: 'https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev/sahal-card-2025'
};

console.log('🔧 Updating R2 credentials to sahal-card-2025 bucket...\n');

// Read current .env file
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found at:', envPath);
    console.log('💡 Creating new .env file...');

    // Create new .env with credentials
    const envContent = Object.entries(newCredentials)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    fs.writeFileSync(envPath, envContent + '\n');
    console.log('✅ Created new .env file with R2 credentials');
} else {
    // Update existing .env
    let envContent = fs.readFileSync(envPath, 'utf8');

    Object.entries(newCredentials).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');

        if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
            console.log(`✅ Updated ${key}`);
        } else {
            // Add new line if doesn't exist
            envContent += `\n${key}=${value}`;
            console.log(`✅ Added ${key}`);
        }
    });

    // Write updated content
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file updated successfully!');
}

console.log('\n📝 New R2 Configuration:');
console.log('─────────────────────────────────────────────');
console.log(`Account ID: ${newCredentials.CLOUDFLARE_ACCOUNT_ID}`);
console.log(`Bucket: ${newCredentials.CLOUDFLARE_BUCKET_NAME}`);
console.log(`Endpoint: ${newCredentials.CLOUDFLARE_ENDPOINT}`);
console.log(`Public URL: ${newCredentials.CLOUDFLARE_PUBLIC_URL}`);
console.log('─────────────────────────────────────────────');

console.log('\n🎯 What happens next:');
console.log('1. ✅ New uploads will go to: sahal-card-2025 bucket');
console.log('2. ✅ Old images remain accessible at their existing URLs');
console.log('3. ✅ No data migration needed - both buckets work simultaneously');

console.log('\n⚠️  IMPORTANT NEXT STEPS:');
console.log('1. Restart your backend server for changes to take effect');
console.log('2. Make sure the sahal-card-2025 bucket has public access enabled');
console.log('3. Test upload functionality to verify new bucket is working');

console.log('\n💡 To enable public access for sahal-card-2025:');
console.log('   1. Go to Cloudflare Dashboard → R2 → sahal-card-2025');
console.log('   2. Settings → Public Access → Allow Access');
console.log('   3. Note the public R2.dev subdomain');
