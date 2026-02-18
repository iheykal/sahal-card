const fs = require('fs');
const path = require('path');

// CORRECT credentials from Cloudflare R2 API Token
const correctConfig = {
  CLOUDFLARE_ACCOUNT_ID: '48e9471ba538dabfb67bfddd3880dcbc',
  CLOUDFLARE_ACCESS_KEY_ID: 'b2e94ed04111897cf6f2a151538c7418',
  CLOUDFLARE_SECRET_ACCESS_KEY: 'a364ed990f2745517e5b781e56e26674ce8b9544bd2ba7c92a42efebff1c7570',
  CLOUDFLARE_BUCKET_NAME: 'sahal-card-2025',
  CLOUDFLARE_ENDPOINT: 'https://48e9471ba538dabfb67bfddd3880dcbc.eu.r2.cloudflarestorage.com',
  CLOUDFLARE_PUBLIC_URL: 'https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev'
};

console.log('🔧 Updating .env with CORRECT R2 credentials...\n');
console.log('⚠️  Important: Using EU jurisdiction endpoint (.eu)\n');

// Read .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Update all Cloudflare settings
Object.entries(correctConfig).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
    console.log(`✅ Updated ${key}`);
  } else {
    console.log(`⚠️  ${key} not found, adding it`);
    content += `\n${key}=${value}`;
  }
});

// Write back
fs.writeFileSync(envPath, content);

console.log('\n✅ All R2 credentials updated!');
console.log('\n📋 Configuration Summary:');
console.log(`   Account ID: ${correctConfig.CLOUDFLARE_ACCOUNT_ID}`);
console.log(`   Bucket: ${correctConfig.CLOUDFLARE_BUCKET_NAME}`);
console.log(`   Endpoint: ${correctConfig.CLOUDFLARE_ENDPOINT}`);
console.log(`   Public URL: ${correctConfig.CLOUDFLARE_PUBLIC_URL}`);
console.log('\n🔄 RESTART YOUR BACKEND SERVER NOW:');
console.log('   1. Press Ctrl+C in backend terminal');
console.log('   2. Run: npm start');
console.log('\n🧪 Then test the connection:');
console.log('   node test-r2-connection.js');
