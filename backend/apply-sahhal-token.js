const fs = require('fs');
const path = require('path');

// New "sahhal" API token credentials
const newCredentials = {
    CLOUDFLARE_ACCOUNT_ID: '48e9471ba538dabfb67bfddd3880dcbc',
    CLOUDFLARE_ACCESS_KEY_ID: 'f66102844eb73d885627cb30bccb8ade',
    CLOUDFLARE_SECRET_ACCESS_KEY: '4880a30258e863ba43877159aef0423913ed349de068c92e319fef8b0846ed6a',
    CLOUDFLARE_BUCKET_NAME: 'sahal-card',
    CLOUDFLARE_ENDPOINT: 'https://48e9471ba538dabfb67bfddd3880dcbc.r2.cloudflarestorage.com',
    CLOUDFLARE_PUBLIC_URL: 'https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev'
};

console.log('🔧 Applying NEW "sahhal" API token credentials...\n');

const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

Object.entries(newCredentials).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
        console.log(`✅ ${key}`);
    } else {
        content += `\n${key}=${value}`;
        console.log(`➕ ${key}`);
    }
});

fs.writeFileSync(envPath, content);

console.log('\n✅ Credentials updated!\n');
console.log('🧪 Testing upload...\n');
