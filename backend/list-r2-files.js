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

console.log('📦 Checking R2 Bucket Contents...\n');
console.log('Current Configuration:');
console.log(`  Bucket: ${process.env.CLOUDFLARE_BUCKET_NAME}`);
console.log(`  Endpoint: ${process.env.CLOUDFLARE_ENDPOINT}`);
console.log(`  Public URL: ${process.env.CLOUDFLARE_PUBLIC_URL}`);
console.log('');

async function listBucketContents() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Prefix: 'uploads/',
            MaxKeys: 50
        });

        const response = await s3Client.send(command);

        if (response.KeyCount === 0) {
            console.log('⚠️  No files found in uploads/ folder');
            console.log('');
            console.log('This means:');
            console.log('1. Your old images were stored in a DIFFERENT bucket/account');
            console.log('2. New images uploaded after fixing R2 config should work');
            console.log('');
            console.log('Options:');
            console.log('A) Check your OLD Cloudflare account/bucket for the images');
            console.log('B) Re-upload profile pictures for existing users');
        } else {
            console.log(`✅ Found ${response.KeyCount} files in bucket:\n`);
            response.Contents.forEach((obj, i) => {
                const sizeKB = (obj.Size / 1024).toFixed(1);
                const date = obj.LastModified.toISOString().split('T')[0];
                console.log(`${i + 1}. ${obj.Key}`);
                console.log(`   Size: ${sizeKB} KB | Date: ${date}`);
            });

            console.log('');
            console.log('These files are available. If you\'re still seeing errors,');
            console.log('the URLs in your MongoDB database may be pointing to OLD bucket.');
        }

    } catch (error) {
        console.log('❌ Error listing bucket:', error.message);
    }
}

listBucketContents();
