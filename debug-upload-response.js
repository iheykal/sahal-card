const R2Service = require('./backend/src/services/r2Service');

async function debugUploadResponse() {
  console.log('=== Debugging Upload Response Format ===\n');
  
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
    
    const fileName = 'debug-response-test.png';
    const contentType = 'image/png';
    
    console.log('1. Testing R2 upload directly...');
    const signedUrl = await R2Service.uploadFile(testImageBuffer, fileName, contentType);
    
    console.log('✅ R2 upload successful!');
    console.log('Direct R2 response (signed URL):', signedUrl);
    
    // Now let's simulate what the upload controller returns
    console.log('\n2. Simulating upload controller response...');
    
    const uploadControllerResponse = {
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: signedUrl,  // This is what the frontend receives
        fileName: fileName,
        originalName: fileName,
        size: testImageBuffer.length,
        type: contentType
      }
    };
    
    console.log('Upload controller response:', JSON.stringify(uploadControllerResponse, null, 2));
    
    // Simulate what the frontend does
    console.log('\n3. Simulating frontend processing...');
    const frontendReceivedUrl = uploadControllerResponse.data.url;
    console.log('Frontend receives URL:', frontendReceivedUrl);
    
    // Simulate user creation data
    const userCreationData = {
      fullName: 'Test User',
      phone: '+252612345678',
      role: 'customer',
      idNumber: '12345',
      profilePicUrl: frontendReceivedUrl
    };
    
    console.log('User creation data:', JSON.stringify(userCreationData, null, 2));
    
    // Test if the URL is accessible
    console.log('\n4. Testing URL accessibility...');
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = url.parse(frontendReceivedUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'GET',
      timeout: 10000
    };
    
    const req = https.request(options, (res) => {
      console.log(`URL Status: ${res.statusCode} ${res.statusMessage}`);
      
      if (res.statusCode === 200) {
        console.log('✅ URL is accessible!');
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Content-Length:', res.headers['content-length']);
        
        // Check if it's actually an image
        const contentType = res.headers['content-type'];
        if (contentType && contentType.startsWith('image/')) {
          console.log('✅ URL returns valid image content!');
          console.log('🎉 The profile image should work correctly!');
        } else {
          console.log('❌ URL does not return image content!');
          console.log('This might be why images appear corrupted.');
        }
      } else {
        console.log('❌ URL is not accessible!');
        console.log('This is why images appear corrupted.');
      }
    });
    
    req.on('error', (error) => {
      console.log('❌ URL test failed:', error.message);
    });
    
    req.on('timeout', () => {
      console.log('⏰ URL test timeout');
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugUploadResponse();


