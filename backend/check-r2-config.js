require('dotenv').config();

console.log('🔍 Checking if backend is using CORRECT R2 credentials...\n');

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
const endpoint = process.env.CLOUDFLARE_ENDPOINT;

console.log('Current R2 Configuration:');
console.log(`  Account ID: ${accountId}`);
console.log(`  Endpoint: ${endpoint}`);
console.log(`  Public URL: ${publicUrl}`);
console.log('');

const correctAccountId = 'e23ae078a192461585965d945e857d2d';

if (accountId === correctAccountId) {
    console.log('✅ Account ID is CORRECT!');
} else {
    console.log('❌ Account ID is WRONG!');
    console.log(`   Expected: ${correctAccountId}`);
    console.log(`   Got: ${accountId}`);
    console.log('\n⚠️  Backend server needs to be RESTARTED!');
    console.log('   The .env file is correct, but the running server');
    console.log('   is still using old cached values.');
    console.log('\n🔄 TO FIX:');
    console.log('   1. Go to your backend terminal');
    console.log('   2. Press Ctrl+C to stop the server');
    console.log('   3. Run: npm start');
}

if (publicUrl === `https://pub-${correctAccountId}.r2.dev`) {
    console.log('✅ Public URL is CORRECT!');
} else {
    console.log('❌ Public URL needs attention');
    console.log(`   Expected: https://pub-${correctAccountId}.r2.dev`);
    console.log(`   Got: ${publicUrl}`);
}
