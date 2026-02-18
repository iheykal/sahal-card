const fs = require('fs');
const path = require('path');

// CORRECT Account ID from Cloudflare dashboard screenshot
const correctAccountId = 'e23ae078a192461585965d945e857d2d';
const bucketName = 'sahal-card-2025';

console.log('🔧 Fixing R2 credentials with CORRECT Account ID...\n');
console.log('Correct Account ID:', correctAccountId);
console.log('Bucket:', bucketName);

// Read .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Update CLOUDFLARE_ACCOUNT_ID
content = content.replace(
    /CLOUDFLARE_ACCOUNT_ID=.*/,
    `CLOUDFLARE_ACCOUNT_ID=${correctAccountId}`
);

// Update CLOUDFLARE_ENDPOINT
content = content.replace(
    /CLOUDFLARE_ENDPOINT=.*/,
    `CLOUDFLARE_ENDPOINT=https://${correctAccountId}.r2.cloudflarestorage.com`
);

// Update CLOUDFLARE_PUBLIC_URL (without bucket name!)
content = content.replace(
    /CLOUDFLARE_PUBLIC_URL=.*/,
    `CLOUDFLARE_PUBLIC_URL=https://pub-${correctAccountId}.r2.dev`
);

// Write back
fs.writeFileSync(envPath, content);

console.log('\n✅ Updated CLOUDFLARE_ACCOUNT_ID');
console.log('✅ Updated CLOUDFLARE_ENDPOINT');
console.log('✅ Updated CLOUDFLARE_PUBLIC_URL');
console.log('\n📋 New Configuration:');
console.log(`   Account ID: ${correctAccountId}`);
console.log(`   Endpoint: https://${correctAccountId}.r2.cloudflarestorage.com`);
console.log(`   Public URL: https://pub-${correctAccountId}.r2.dev`);
console.log('\n🔄 RESTART YOUR BACKEND SERVER NOW!');
console.log('   Press Ctrl+C, then: npm start');
