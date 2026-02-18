const fs = require('fs');
const path = require('path');

// The PUBLIC URL from Cloudflare dashboard is different from account ID!
// Account ID: 48e9471ba538dabfb67bfddd3880dcbc
// But PUBLIC URL shows: pub-1cef139ca63a45d2b251968e75747e16.r2.dev

const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

console.log('🔧 Fixing PUBLIC_URL to match Cloudflare dashboard...\n');

// Update only the PUBLIC_URL to match what Cloudflare shows
content = content.replace(
    /CLOUDFLARE_PUBLIC_URL=.*/,
    'CLOUDFLARE_PUBLIC_URL=https://pub-1cef139ca63a45d2b251968e75747e16.r2.dev'
);

fs.writeFileSync(envPath, content);

console.log('✅ Updated CLOUDFLARE_PUBLIC_URL');
console.log('');
console.log('Before: https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev');
console.log('After:  https://pub-1cef139ca63a45d2b251968e75747e16.r2.dev');
console.log('');
console.log('🔄 Now restart backend: npm start');
