require('dotenv').config();
const https = require('https');

// Test if R2 public URL is accessible
const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;

console.log('🧪 Testing R2 Public Access...\n');
console.log('Configuration:');
console.log(`  Account ID: ${accountId}`);
console.log(`  Bucket: ${bucketName}`);
console.log(`  Public URL: ${publicUrl}\n`);

// Test URL format
const expectedUrl = `https://pub-${accountId}.r2.dev/${bucketName}`;
console.log('Expected r2.dev URL format:', expectedUrl);

if (publicUrl === expectedUrl) {
    console.log('✅ Public URL format matches r2.dev pattern\n');
} else {
    console.log('⚠️  Public URL format differs from standard r2.dev\n');
}

// Try to access the public URL
console.log('Testing bucket accessibility...');
const testUrl = `${publicUrl}/test.txt`;

https.get(testUrl, (res) => {
    console.log(`\n📡 Response Status: ${res.statusCode}`);

    if (res.statusCode === 200) {
        console.log('✅ Bucket is publicly accessible!');
    } else if (res.statusCode === 403) {
        console.log('❌ FORBIDDEN - Bucket is NOT publicly accessible');
        console.log('\n🔧 Fix: Enable public access in Cloudflare Dashboard:');
        console.log('   1. Go to https://dash.cloudflare.com/');
        console.log(`   2. Navigate to R2 → ${bucketName}`);
        console.log('   3. Settings → Public Access');
        console.log('   4. Enable "Allow Access" or connect a custom domain');
    } else if (res.statusCode === 404) {
        console.log('⚠️  Bucket might be accessible but test file not found (this is OK)');
        console.log('   Try uploading an image and testing with a real file URL');
    } else {
        console.log('⚠️  Unexpected response');
    }
}).on('error', (err) => {
    console.log('\n❌ Connection Error:', err.message);
    console.log('\n🔧 This might indicate:');
    console.log('   - Public URL is not accessible');
    console.log('   - Network/DNS issues');
    console.log('   - Bucket public access not enabled');
});

console.log('\n⏳ Testing...');
