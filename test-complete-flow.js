const R2Service = require('./backend/src/services/r2Service');
const https = require('https');

async function testCompleteFlow() {
  console.log('=== Testing Complete Image Upload and Access Flow ===\n');
  
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
    
    const fileName = 'complete-flow-test.png';
    const contentType = 'image/png';
    
    console.log('1. Uploading test image...');
    const signedUrl = await R2Service.uploadFile(testImageBuffer, fileName, contentType);
    
    console.log('✅ Upload successful!');
    console.log('Signed URL:', signedUrl);
    
    // Test if the signed URL is accessible
    console.log('\n2. Testing signed URL accessibility...');
    const url = require('url');
    const parsedUrl = url.parse(signedUrl);
    
    const testAccess = () => {
      return new Promise((resolve) => {
        const options = {
          hostname: parsedUrl.hostname,
          port: 443,
          path: parsedUrl.path,
          method: 'GET',
          timeout: 10000
        };
        
        const req = https.request(options, (res) => {
          console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
          
          if (res.statusCode === 200) {
            console.log('   ✅ Signed URL is accessible!');
            
            // Check content type
            const contentType = res.headers['content-type'];
            console.log(`   Content-Type: ${contentType}`);
            
            if (contentType && contentType.startsWith('image/')) {
              console.log('   ✅ Correct image content type!');
            } else {
              console.log('   ❌ Wrong content type - might be corrupted!');
            }
            
            // Check content length
            const contentLength = res.headers['content-length'];
            console.log(`   Content-Length: ${contentLength} bytes`);
            
            if (contentLength && parseInt(contentLength) === 68) {
              console.log('   ✅ Correct file size!');
            } else {
              console.log('   ❌ Wrong file size - might be corrupted!');
            }
            
            resolve(true);
          } else if (res.statusCode === 403) {
            console.log('   ❌ Access forbidden - signed URL might be invalid');
            resolve(false);
          } else if (res.statusCode === 404) {
            console.log('   ❌ File not found - upload might have failed');
            resolve(false);
          } else {
            console.log(`   ❌ Unexpected status: ${res.statusCode}`);
            resolve(false);
          }
        });
        
        req.on('error', (error) => {
          console.log('   ❌ Signed URL not accessible:', error.message);
          resolve(false);
        });
        
        req.on('timeout', () => {
          console.log('   ⏰ Request timeout');
          resolve(false);
        });
        
        req.end();
      });
    };
    
    const isAccessible = await testAccess();
    
    if (isAccessible) {
      console.log('\n3. Testing image data integrity...');
      
      // Download the image and compare with original
      const downloadImage = () => {
        return new Promise((resolve) => {
          const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.path,
            method: 'GET',
            timeout: 10000
          };
          
          const req = https.request(options, (res) => {
            let data = Buffer.alloc(0);
            
            res.on('data', (chunk) => {
              data = Buffer.concat([data, chunk]);
            });
            
            res.on('end', () => {
              console.log(`   Downloaded ${data.length} bytes`);
              
              // Compare with original
              if (data.equals(testImageBuffer)) {
                console.log('   ✅ Image data is identical to original!');
                console.log('   ✅ No corruption detected!');
              } else {
                console.log('   ❌ Image data differs from original!');
                console.log('   ❌ Corruption detected!');
                
                // Show first few bytes for comparison
                console.log('   Original first 16 bytes:', testImageBuffer.slice(0, 16));
                console.log('   Downloaded first 16 bytes:', data.slice(0, 16));
              }
              
              resolve();
            });
          });
          
          req.on('error', (error) => {
            console.log('   ❌ Download failed:', error.message);
            resolve();
          });
          
          req.end();
        });
      };
      
      await downloadImage();
    }
    
    console.log('\n=== COMPLETE FLOW TEST FINISHED ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();


