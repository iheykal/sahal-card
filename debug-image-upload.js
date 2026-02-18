const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('=== DEBUGGING IMAGE UPLOAD PROCESS ===\n');

// Test 1: Check if backend server is running
console.log('1. Testing backend server connection...');
const testBackend = () => {
  return new Promise((resolve) => {
    const req = https.request('https://192.168.100.32:5000/api/upload/file', (res) => {
      console.log(`   Backend status: ${res.statusCode}`);
      if (res.statusCode === 404) {
        console.log('   ✅ Backend is running (404 expected for GET request)');
      } else if (res.statusCode === 405) {
        console.log('   ✅ Backend is running (405 Method Not Allowed expected)');
      } else {
        console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
      }
      resolve();
    });
    
    req.on('error', (error) => {
      console.log('   ❌ Backend connection failed:', error.message);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log('   ⏰ Backend connection timeout');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
};

// Test 2: Check R2 service configuration
console.log('\n2. Checking R2 service configuration...');
const R2Service = require('./backend/src/services/r2Service');

console.log('   R2 Service loaded:', !!R2Service);
console.log('   Upload method exists:', typeof R2Service.uploadFile === 'function');

// Test 3: Test file validation
console.log('\n3. Testing file validation...');
const testFile = {
  name: 'test-image.png',
  mimetype: 'image/png',
  size: 1024
};

console.log('   Test file:', testFile);
console.log('   Is valid image type:', R2Service.isValidImageType(testFile.mimetype));

// Test 4: Test filename generation
console.log('\n4. Testing filename generation...');
const uniqueFileName = R2Service.generateUniqueFileName('test-image.png');
console.log('   Generated filename:', uniqueFileName);

// Test 5: Check if we can create a test image buffer
console.log('\n5. Testing image buffer creation...');
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
  0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

console.log('   Test buffer created:', Buffer.isBuffer(testImageBuffer));
console.log('   Buffer size:', testImageBuffer.length);

// Test 6: Test R2 upload (if credentials are working)
console.log('\n6. Testing R2 upload...');
const testR2Upload = async () => {
  try {
    console.log('   Attempting R2 upload...');
    const publicUrl = await R2Service.uploadFile(testImageBuffer, 'debug-test.png', 'image/png');
    console.log('   ✅ R2 upload successful!');
    console.log('   Public URL:', publicUrl);
    
    // Test if the URL is accessible
    console.log('\n7. Testing uploaded image accessibility...');
    const url = require('url');
    const parsedUrl = url.parse(publicUrl);
    
    const req = https.request({
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'GET',
      timeout: 10000
    }, (res) => {
      console.log(`   Image accessibility: ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode === 200) {
        console.log('   ✅ Image is accessible and not corrupted!');
      } else {
        console.log('   ❌ Image is not accessible or corrupted');
      }
    });
    
    req.on('error', (error) => {
      console.log('   ❌ Image accessibility test failed:', error.message);
    });
    
    req.end();
    
  } catch (error) {
    console.log('   ❌ R2 upload failed:', error.message);
  }
};

// Run all tests
const runTests = async () => {
  await testBackend();
  await testR2Upload();
  
  console.log('\n=== DEBUG COMPLETE ===');
  console.log('\nPossible issues with corrupted images:');
  console.log('1. File upload process corrupted the image buffer');
  console.log('2. R2 upload process corrupted the image');
  console.log('3. Public URL is not accessible');
  console.log('4. Frontend is not handling the image URL correctly');
  console.log('5. Browser cache issues');
};

runTests();


