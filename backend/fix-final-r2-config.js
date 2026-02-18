const fs = require('fs');
const path = require('path');

// CORRECT configuration based on public URL
// The account ID in the public URL is the correct one!
const correctConfig = {
    CLOUDFLARE_ACCOUNT_ID: '1cef139ca63a45d2b251968e75747e16',
    CLOUDFLARE_ACCESS_KEY_ID: 'b1d17cbb154dd1e5d4188fab6d0b7802',
    CLOUDFLARE_SECRET_ACCESS_KEY: '2f2827ce965acd530c9e9f7b374a4cd83beb1ec8f3cae8f83005927d352c71d2',
    CLOUDFLARE_BUCKET_NAME: 'sahal-card',
    CLOUDFLARE_ENDPOINT: 'https://1cef139ca63a45d2b251968e75747e16.r2.cloudflarestorage.com',
    CLOUDFLARE_PUBLIC_URL: 'https://pub-1cef139ca63a45d2b251968e75747e16.r2.dev'
};

console.log('🔧 Fixing R2 configuration with CORRECT Account ID from Public URL...\n');
console.log('⚠️  The account ID in your Public URL is different from what you stated!');
console.log('   Using account ID from Public URL: 1cef139ca63a45d2b251968e75747e16\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Update all Cloudflare settings
Object.entries(correctConfig).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
        console.log(`✅ Updated ${key}`);
    } else {
        console.log(`⚠️  ${key} not found, adding it`);
        content += `\n${key}=${value}`;
    }
});

// Write back
fs.writeFileSync(envPath, content);

console.log('\n✅ All R2 credentials updated with CORRECT values!');
console.log('\n📋 Final Configuration:');
console.log(`   Account ID: ${correctConfig.CLOUDFLARE_ACCOUNT_ID}`);
console.log(`   Bucket: ${correctConfig.CLOUDFLARE_BUCKET_NAME}`);
console.log(`   Endpoint: ${correctConfig.CLOUDFLARE_ENDPOINT}`);
console.log(`   Public URL: ${correctConfig.CLOUDFLARE_PUBLIC_URL}`);
console.log('\n🔄 RESTART BACKEND SERVER:');
console.log('   1. Press Ctrl+C');
console.log('   2. npm start');
console.log('\n🧪 Then test:');
console.log('   node test-r2-connection.js');
