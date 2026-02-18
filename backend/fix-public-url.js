const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

console.log('🔧 Fixing CLOUDFLARE_PUBLIC_URL format...\n');

// The PUBLIC_URL should NOT include the bucket name when using r2.dev
// Because r2.dev subdomain is already mapped to the specific bucket
const accountId = '48e9471ba538dabfb67bfddd3880dcbc';
const correctPublicUrl = `https://pub-${accountId}.r2.dev`;

// Replace the PUBLIC_URL
content = content.replace(
    /CLOUDFLARE_PUBLIC_URL=https:\/\/pub-[^\/]+\.r2\.dev\/[^\s]+/,
    `CLOUDFLARE_PUBLIC_URL=${correctPublicUrl}`
);

// Write back
fs.writeFileSync(envPath, content);

console.log('✅ Fixed CLOUDFLARE_PUBLIC_URL');
console.log(`   Old: https://pub-${accountId}.r2.dev/sahal-card-2025`);
console.log(`   New: ${correctPublicUrl}`);
console.log('\n💡 The bucket name should NOT be in the URL when using r2.dev subdomain');
console.log('   The r2.dev subdomain is already mapped to your bucket!');
console.log('\n🔄 RESTART YOUR BACKEND SERVER NOW:');
console.log('   1. Press Ctrl+C in server terminal');
console.log('   2. Run: npm start');
console.log('\n✨ After restart, images will load correctly!');
