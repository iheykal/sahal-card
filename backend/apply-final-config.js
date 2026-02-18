const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const targetConfig = {
    PORT: '5001',
    CLOUDFLARE_BUCKET_NAME: 'sahal-card-2025',
    CLOUDFLARE_PUBLIC_URL: 'https://pub-ee2ae070a1924f1585fb694b5e057d2d.r2.dev',
    // Ensure these match too if they weren't set correctly before
    CLOUDFLARE_ACCOUNT_ID: '48e9471ba538dabfb67bfddd3880dcbc',
    CLOUDFLARE_ACCESS_KEY_ID: 'b2e94ed04111897cf6f2a151538c7418',
    CLOUDFLARE_SECRET_ACCESS_KEY: 'a364ed990f2745517e5b781e56e26674ce8b9544bd2ba7c92a42efebff1c7570',
    CLOUDFLARE_ENDPOINT: 'https://48e9471ba538dabfb67bfddd3880dcbc.r2.cloudflarestorage.com'
};

let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
} else {
    console.log('Creating new .env file');
}

let updatedContent = envContent;

Object.entries(targetConfig).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(updatedContent)) {
        updatedContent = updatedContent.replace(regex, `${key}=${value}`);
        console.log(`✅ Updated ${key}`);
    } else {
        updatedContent += `\n${key}=${value}`;
        console.log(`✅ Added ${key}`);
    }
});

// Fix potential trailing slash issues in Public URL if valid
// (The user provided URL doesn't have one, but good strictly)
updatedContent = updatedContent.replace(
    /CLOUDFLARE_PUBLIC_URL=.*\/$/,
    (match) => match.slice(0, -1)
);

fs.writeFileSync(envPath, updatedContent);
console.log('\n🎉 Configuration updated successfully!');
console.log('👉 PLEASE RESTART YOUR BACKEND SERVER NOW.');
