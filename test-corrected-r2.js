const R2Service = require('./backend/src/services/r2Service');

async function testCorrectedR2() {
  console.log('=== Testing Corrected R2 Configuration ===');
  
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
    
    const fileName = 'corrected-test.png';
    const contentType = 'image/png';
    
    console.log('Uploading test image with corrected configuration...');
    const publicUrl = await R2Service.uploadFile(testImageBuffer, fileName, contentType);
    
    console.log('✅ Upload successful!');
    console.log('Public URL:', publicUrl);
    
    // Test if the URL is accessible
    console.log('\nTesting URL accessibility...');
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(publicUrl);
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
        console.log('🎉 SUCCESS: Image is accessible and not corrupted!');
        console.log('✅ Profile images should now work correctly!');
      } else if (res.statusCode === 404) {
        console.log('❌ Still getting 404 - there might be a bucket configuration issue');
      } else {
        console.log(`❌ Unexpected status: ${res.statusCode}`);
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ URL not accessible:', error.message);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Request timeout');
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testCorrectedR2();


