require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

console.log('🧪 Testing R2 File Upload...\n');
console.log('Configuration:');
console.log(`  Endpoint: ${process.env.CLOUDFLARE_ENDPOINT}`);
console.log(`  Bucket: ${process.env.CLOUDFLARE_BUCKET_NAME}`);
console.log(`  Public URL: ${process.env.CLOUDFLARE_PUBLIC_URL}`);
console.log('');

async function testUpload() {
    try {
        // Create a simple test file
        const testContent = `R2 Upload Test - ${new Date().toISOString()}`;
        const testFileName = `test-${Date.now()}.txt`;
        const testKey = `uploads/${testFileName}`;

        console.log(`📤 Uploading test file: ${testFileName}`);
        console.log(`   Content: "${testContent}"`);
        console.log('');

        // Upload to R2
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: testKey,
            Body: Buffer.from(testContent),
            ContentType: 'text/plain',
        });

        await s3Client.send(uploadCommand);
        console.log('✅ Upload successful!');

        // Generate public URL
        const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${testKey}`;
        console.log(`\n📍 Public URL: ${publicUrl}`);

        // Try to generate signed URL to verify file exists
        const getCommand = new GetObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: testKey,
        });

        const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        console.log(`\n🔐 Signed URL (expires in 1 hour):`);
        console.log(`   ${signedUrl}`);

        console.log('\n✨ Test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ Upload to R2 works');
        console.log('   ✅ File stored at:', testKey);
        console.log('   ✅ Public URL generated');
        console.log('   ✅ Signed URL generated');

        console.log('\n🌐 Testing public access...');
        console.log('   Try opening this URL in your browser:');
        console.log(`   ${publicUrl}`);
        console.log('');
        console.log('   Expected:');
        console.log('   - If public access enabled: You\'ll see the test content');
        console.log('   - If public access disabled: 401 Unauthorized error');

    } catch (error) {
        console.log('❌ Upload FAILED!');
        console.log(`   Error: ${error.message}`);
        console.log('');

        if (error.message.includes('handshake')) {
            console.log('🔧 SSL Handshake Error - This means:');
            console.log('   → Access keys are INCORRECT');
            console.log('   → Create a NEW R2 API Token in Cloudflare Dashboard');
            console.log('   → Update .env with the new credentials');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            console.log('🔧 403 Forbidden - This means:');
            console.log('   → Bucket name is wrong');
            console.log('   → Or access key doesn\'t have write permissions');
        } else if (error.message.includes('404')) {
            console.log('🔧 404 Not Found - This means:');
            console.log('   → Bucket doesn\'t exist');
            console.log('   → Check bucket name in .env');
        } else {
            console.log('🔧 Unknown error - Check:');
            console.log('   → Bucket name:', process.env.CLOUDFLARE_BUCKET_NAME);
            console.log('   → Endpoint:', process.env.CLOUDFLARE_ENDPOINT);
            console.log('   → Access keys are valid');
        }
    }
}

testUpload();
