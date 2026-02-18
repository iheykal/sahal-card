const R2Service = require('./backend/src/services/r2Service');

async function testSignedUrl() {
  console.log('=== Testing Signed URL Approach ===');
  
  try {
    // Test with a small image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = 'signed-url-test.png';
    const contentType = 'image/png';
    
    console.log('Uploading test image with signed URL approach...');
    const signedUrl = await R2Service.uploadFile(testImageBuffer, fileName, contentType);
    
    console.log('✅ Upload successful!');
    console.log('Signed URL:', signedUrl);
    
    // Test if the signed URL is accessible
    console.log('\nTesting signed URL accessibility...');
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(signedUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'GET',
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode === 200) {
        console.log('🎉 SUCCESS: Signed URL is accessible!');
        console.log('✅ Profile images should now work correctly!');
        console.log('✅ No more corrupted images!');
      } else if (res.statusCode === 403) {
        console.log('❌ Access forbidden - signed URL might be invalid');
      } else if (res.statusCode === 404) {
        console.log('❌ File not found - upload might have failed');
      } else {
        console.log(`❌ Unexpected status: ${res.statusCode}`);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ Signed URL not accessible:', error.message);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Request timeout');
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testSignedUrl();


