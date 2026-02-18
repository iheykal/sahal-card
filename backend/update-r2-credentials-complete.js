const fs = require('fs');
const path = require('path');

// Complete R2 credentials from user - extracting account ID from endpoint
const accountId = '744f24f8a5918e0d996c5ff4009a7adb'; // From the endpoint URL
const bucketName = 'maandhise-uploads';

const completeCredentials = {
    CLOUDFLARE_ACCOUNT_ID: accountId,
    CLOUDFLARE_ACCESS_KEY_ID: 'd5f5609cf0ae7decc387491e78805cd3',
    CLOUDFLARE_SECRET_ACCESS_KEY: '4977e0721817ca67c68fb17ba2398142fa74070e2eec1e4d05804d8e7994348f',
    CLOUDFLARE_BUCKET_NAME: bucketName,
    CLOUDFLARE_ENDPOINT: `https://${accountId}.r2.cloudflarestorage.com`,
    CLOUDFLARE_PUBLIC_URL: `https://pub-${accountId}.r2.dev/${bucketName}`
};

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
} else {
    console.log('❌ .env file not found');
    process.exit(1);
}

// Update ALL credentials in the .env content
let updatedContent = envContent;

Object.entries(completeCredentials).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(regex, `${key}=${value}`);
        console.log(`✅ Updated ${key}=${value}`);
    } else {
        console.log(`⚠️ ${key} not found in .env file - adding it`);
        updatedContent += `\n${key}=${value}`;
    }
});

// Write the updated content back to .env
fs.writeFileSync(envPath, updatedContent);
console.log('\n🎉 All R2 credentials updated successfully!');
console.log('\n📋 Configuration Summary:');
console.log(`   Account ID: ${accountId}`);
console.log(`   Bucket: ${bucketName}`);
console.log(`   Endpoint: ${completeCredentials.CLOUDFLARE_ENDPOINT}`);
console.log(`   Public URL: ${completeCredentials.CLOUDFLARE_PUBLIC_URL}`);
console.log('\n⚠️ IMPORTANT: Restart your backend server now!');
console.log('   Press Ctrl+C in the server terminal, then run: npm start');
