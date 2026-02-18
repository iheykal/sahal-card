const fs = require('fs');
const path = require('path');

// Credentials from user's Cloudflare R2 Token
const credentials = {
  CLOUDFLARE_ACCOUNT_ID: '48e9471ba538dabfb67bfddd3880dcbc',
  CLOUDFLARE_ACCESS_KEY_ID: 'b2e94ed04111897cf6f2a151538c7418',
  CLOUDFLARE_SECRET_ACCESS_KEY: 'a364ed990f2745517e5b781e56e26674ce8b9544bd2ba7c92a42efebff1c7570',
  CLOUDFLARE_BUCKET_NAME: 'sahal-card-2025',
  CLOUDFLARE_ENDPOINT: 'https://48e9471ba538dabfb67bfddd3880dcbc.r2.cloudflarestorage.com',
  CLOUDFLARE_PUBLIC_URL: 'https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev'
};

console.log('🔧 Updating .env with CORRECT R2 credentials...\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Update each credential
Object.entries(credentials).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
    console.log(`✅ Updated ${key}`);
  } else {
    content += `\n${key}=${value}`;
    console.log(`✅ Added ${key}`);
  }
});

// Write back
fs.writeFileSync(envPath, content);

console.log('\n📋 Complete R2 Configuration:');
console.log(`   Account ID: ${credentials.CLOUDFLARE_ACCOUNT_ID}`);
console.log(`   Bucket: ${credentials.CLOUDFLARE_BUCKET_NAME}`);
console.log(`   Endpoint: ${credentials.CLOUDFLARE_ENDPOINT}`);
console.log(`   Public URL: ${credentials.CLOUDFLARE_PUBLIC_URL}`);
console.log(`   Access Key: ${credentials.CLOUDFLARE_ACCESS_KEY_ID.substring(0, 8)}...`);
console.log('\n🎉 All credentials updated successfully!');
console.log('\n🔄 NEXT STEPS:');
console.log('   1. RESTART your backend server (Ctrl+C, then npm start)');
console.log('   2. Run: node test-r2-connection.js');
console.log('   3. Upload a test image - it should work now!');
