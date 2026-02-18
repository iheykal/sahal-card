require('dotenv').config();
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

console.log('🧪 Testing R2 Connection with current credentials...\n');
console.log('Configuration:');
console.log(`  Endpoint: ${process.env.CLOUDFLARE_ENDPOINT}`);
console.log(`  Bucket: ${process.env.CLOUDFLARE_BUCKET_NAME}`);
console.log(`  Has Access Key: ${!!process.env.CLOUDFLARE_ACCESS_KEY_ID}`);
console.log(`  Has Secret Key: ${!!process.env.CLOUDFLARE_SECRET_ACCESS_KEY}`);
console.log('\nTesting connection...\n');

async function testConnection() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      MaxKeys: 1
    });

    const response = await s3Client.send(command);
    console.log('✅ SUCCESS! R2 connection works!');
    console.log(`   Bucket is accessible`);
    console.log(`   Objects in bucket: ${response.KeyCount || 0} (showing first 1)`);
    console.log('\n✨ R2 credentials are VALID and working!');
    console.log('\n🔄 If uploads are still failing with 500 error:');
    console.log('   → Backend server needs to be RESTARTED');
    console.log('   → Press Ctrl+C in backend terminal');
    console.log('   → Run: npm start');
  } catch (error) {
    console.log('❌ FAILED! R2 connection error:');
    console.log(`   Error: ${error.message}`);
    console.log('\n🔧 Possible issues:');
    console.log('   1. Access keys are incorrect');
    console.log('   2. Bucket name is wrong');
    console.log('   3. Endpoint URL is incorrect');
    console.log('\n💡 Check your Cloudflare R2 dashboard for correct:');
    console.log('   - Access Key ID');
    console.log('   - Secret Access Key');
    console.log('   - Bucket name');
  }
}

testConnection();