const https = require('https');

console.log('🧪 Testing NEW Image URL Format...\n');

// Test the new correctly formatted URL
const testUrl = 'https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev/uploads/1765141481572-Screenshot%202025-11-08%20110014-1765141481572-7k7h5r.png';

console.log('Testing URL:', testUrl);
console.log('Expected: 200 OK (file exists) or 404 (file not found, but bucket accessible)');
console.log('Getting 401: Bucket public access NOT enabled\n');
console.log('Testing...\n');

https.get(testUrl, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    if (res.statusCode === 401) {
        console.log('\n❌ 401 UNAUTHORIZED - Public access is NOT enabled!');
        console.log('\n🔧 TO FIX:');
        console.log('1. Go to: https://dash.cloudflare.com/');
        console.log('2. Click "R2" in left sidebar');
        console.log('3. Click your bucket: "sahal-card-2025"');
        console.log('4. Click "Settings" tab at the top');
        console.log('5. Scroll to "Public access" section');
        console.log('6. Look for: "R2.dev subdomain"');
        console.log('7. Click "Allow Access" button');
        console.log('\n⚠️  IMPORTANT: The button might say:');
        console.log('   - "Allow Access"');
        console.log('   - "Enable public access"');
        console.log('   - "Connect a custom domain"');
        console.log('\nAfter enabling, wait 1-2 minutes for propagation.');
    } else if (res.statusCode === 200) {
        console.log('\n✅ Image loaded successfully! Bucket is publicly accessible.');
    } else if (res.statusCode === 404) {
        console.log('\n✅ Bucket is accessible (404 = file not found, which is fine for test)');
    } else if (res.statusCode === 403) {
        console.log('\n❌ 403 FORBIDDEN - Check bucket permissions');
    }
}).on('error', (err) => {
    console.log('\n❌ Connection Error:', err.message);
});
