const fs = require('fs');
const path = require('path');

// Read the .env file
const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Replace the two placeholder values
content = content.replace(
    /CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id/,
    'CLOUDFLARE_ACCOUNT_ID=744f24f8a5918e0d996c5ff4009a7adb'
);

content = content.replace(
    /CLOUDFLARE_PUBLIC_URL=https:\/\/pub-your-account-id\.r2\.dev\/your-bucket-name/,
    'CLOUDFLARE_PUBLIC_URL=https://pub-744f24f8a5918e0d996c5ff4009a7adb.r2.dev/maandhise-uploads'
);

// Write back
fs.writeFileSync(envPath, content);

console.log('✅ Fixed CLOUDFLARE_ACCOUNT_ID');
console.log('✅ Fixed CLOUDFLARE_PUBLIC_URL');
console.log('\n✅ All R2 credentials are now configured!');
console.log('\n🔄 RESTART YOUR BACKEND SERVER NOW:');
console.log('   1. Press Ctrl+C in server terminal');
console.log('   2. Run: npm start');
