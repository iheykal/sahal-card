const fs = require('fs');
const path = require('path');

// New R2 credentials from user
const newCredentials = {
    CLOUDFLARE_ACCESS_KEY_ID: 'd5f5609cf0ae7decc387491e78805cd3',
    CLOUDFLARE_SECRET_ACCESS_KEY: '4977e0721817ca67c68fb17ba2398142fa74070e2eec1e4d05804d8e7994348f',
    CLOUDFLARE_ENDPOINT: 'https://744f24f8a5918e0d996c5ff4009a7adb.r2.cloudflarestorage.com'
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

// Update the credentials in the .env content
let updatedContent = envContent;

Object.entries(newCredentials).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(regex, `${key}=${value}`);
        console.log(`✅ Updated ${key}`);
    } else {
        console.log(`⚠️ ${key} not found in .env file`);
    }
});

// Write the updated content back to .env
fs.writeFileSync(envPath, updatedContent);
console.log('\n🎉 R2 credentials updated successfully!');
console.log('\nNew credentials:');
console.log(`CLOUDFLARE_ACCESS_KEY_ID=${newCredentials.CLOUDFLARE_ACCESS_KEY_ID}`);
console.log(`CLOUDFLARE_SECRET_ACCESS_KEY=${newCredentials.CLOUDFLARE_SECRET_ACCESS_KEY.substring(0, 20)}...`);
console.log(`CLOUDFLARE_ENDPOINT=${newCredentials.CLOUDFLARE_ENDPOINT}`);
console.log('\n⚠️ Please restart your backend server for changes to take effect!');
