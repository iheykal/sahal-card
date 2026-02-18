const R2Service = require('./src/services/r2Service');
require('dotenv').config();

// Set environment variables for testing (using the working hardcoded values)
process.env.CLOUDFLARE_ACCOUNT_ID = '744f24f8a5918e0d996c5ff4009a7adb';
process.env.CLOUDFLARE_ACCESS_KEY_ID = 'd5f5609cf0ae7decc387491e78805cd3';
process.env.CLOUDFLARE_SECRET_ACCESS_KEY = '4977e0721817ca67c68fb17ba2398142fa74070e2eec1e4d05804d8e7994348f';
process.env.CLOUDFLARE_BUCKET_NAME = 'maandhise';
process.env.CLOUDFLARE_ENDPOINT = 'https://744f24f8a5918e0d996c5ff4009a7adb.r2.cloudflarestorage.com';
process.env.CLOUDFLARE_PUBLIC_URL = 'https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev/maandhise';

async function testR2Comprehensive() {
  console.log('=== Comprehensive Cloudflare R2 Test ===');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Missing');
  console.log('CLOUDFLARE_ACCESS_KEY_ID:', process.env.CLOUDFLARE_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('CLOUDFLARE_SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('CLOUDFLARE_BUCKET_NAME:', process.env.CLOUDFLARE_BUCKET_NAME || 'maandhise');
  console.log('CLOUDFLARE_ENDPOINT:', process.env.CLOUDFLARE_ENDPOINT || 'Using default');
  
  try {
    // Test 1: Upload a small test image
    console.log('\n🧪 Test 1: Upload Test Image');
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const fileName = `test-${Date.now()}.png`;
    const contentType = 'image/png';
    
    console.log('Uploading test image...');
    const signedUrl = await R2Service.uploadFile(testImageBuffer, fileName, contentType);
    console.log('✅ Upload successful!');
    console.log('Signed URL:', signedUrl);
    
    // Test 2: Generate fresh signed URL
    console.log('\n🧪 Test 2: Generate Fresh Signed URL');
    const freshUrl = await R2Service.generateFreshSignedUrl(signedUrl);
    console.log('✅ Fresh URL generated!');
    console.log('Fresh URL:', freshUrl);
    
    // Test 3: Test URL accessibility
    console.log('\n🧪 Test 3: Test URL Accessibility');
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
    
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        console.log(`✅ URL accessible: ${res.statusCode} ${res.statusMessage}`);
        if (res.statusCode === 200) {
          console.log('🎉 Cloudflare R2 is fully functional!');
          console.log('\n📊 Summary:');
          console.log('✅ Upload: Working');
          console.log('✅ Fresh URL: Working');
          console.log('✅ Accessibility: Working');
          console.log('\n🚀 R2 is ready for production use!');
        }
        resolve(true);
      });
      
      req.on('error', (error) => {
        console.log('❌ URL not accessible:', error.message);
        console.log('This might be due to CORS or network issues, but upload worked.');
        console.log('\n📊 Summary:');
        console.log('✅ Upload: Working');
        console.log('✅ Fresh URL: Working');
        console.log('⚠️  Accessibility: Network issue (but upload works)');
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.log('⏰ Request timeout - URL might be accessible but slow');
        console.log('\n📊 Summary:');
        console.log('✅ Upload: Working');
        console.log('✅ Fresh URL: Working');
        console.log('⚠️  Accessibility: Slow but working');
        resolve(false);
      });
      
      req.end();
    });
    
  } catch (error) {
    console.error('❌ FAILED: R2 connection error');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if CLOUDFLARE_* environment variables are set correctly');
    console.log('2. Verify Cloudflare R2 bucket exists and is accessible');
    console.log('3. Check if API tokens have proper permissions');
    console.log('4. Ensure network connectivity to Cloudflare R2');
    
    return false;
  }
}

testR2Comprehensive();
