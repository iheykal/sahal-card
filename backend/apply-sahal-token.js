const fs = require('fs');
const path = require('path');

// Using credentials from the "sahal" API token
// Important: Account ID from endpoint is 48e9471ba538dabfb67bfddd3880dcbc
const correctConfig = {
  CLOUDFLARE_ACCOUNT_ID: '48e9471ba538dabfb67bfddd3880dcbc',
  CLOUDFLARE_ACCESS_KEY_ID: 'b1d17cbb154dd1e5d4188fab6d0b7802',
  CLOUDFLARE_SECRET_ACCESS_KEY: '2f2827ce965acd530c9e9f7b374a4cd83beb1ec8f3cae8f83005927d352c71d2',
  CLOUDFLARE_BUCKET_NAME: 'sahal-card',
  CLOUDFLARE_ENDPOINT: 'https://48e9471ba538dabfb67bfddd3880dcbc.r2.cloudflarestorage.com',
  CLOUDFLARE_PUBLIC_URL: 'https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev'
};

console.log('🔧 Updating .env with credentials from "sahal" API token...\n');

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
console.log('\n📋 Configuration:');
console.log(`   Account ID: ${correctConfig.CLOUDFLARE_ACCOUNT_ID}`);
console.log(`   Bucket: ${correctConfig.CLOUDFLARE_BUCKET_NAME}`);
console.log(`   Endpoint: ${correctConfig.CLOUDFLARE_ENDPOINT}`);
console.log(`   Public URL: ${correctConfig.CLOUDFLARE_PUBLIC_URL}`);
console.log('\n🧪 Testing upload...');
