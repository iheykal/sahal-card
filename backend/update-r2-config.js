const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Configuration
const BUCKET_NAME = 'sahal-card-2025';
const ENV_PATH = path.join(__dirname, '.env');

console.log('=== Update R2 Configuration ===');
console.log(`Target Bucket Name: ${BUCKET_NAME}`);

// 1. Read existing .env
let envContent = '';
try {
    if (fs.existsSync(ENV_PATH)) {
        envContent = fs.readFileSync(ENV_PATH, 'utf8');
        console.log('✅ Loaded existing .env file');
    } else {
        console.log('⚠️ .env file not found, creating new one');
    }
} catch (err) {
    console.error('❌ Error reading .env:', err);
    process.exit(1);
}

// 2. Helper to update/add key
const updateEnvKey = (key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`Updated ${key}`);
    } else {
        envContent += `\n${key}=${value}`;
        console.log(`Added ${key}`);
    }
};

// 3. Update Bucket Name (Automatic)
updateEnvKey('CLOUDFLARE_BUCKET_NAME', BUCKET_NAME);

// 4. Prompt for Public URL
console.log('\n❓ We need your R2 Public Bucket URL.');
console.log('   Go to Cloudflare Dashboard > R2 > sahal-card-2025 > Settings > Public Access');
console.log('   Copy the "Public Bucket URL" (e.g., https://pub-12345abcdef.r2.dev)');

rl.question('Paste Public URL here: ', (publicUrl) => {
    let cleanUrl = publicUrl.trim();

    // Auto-fix if they pasted a file path
    if (cleanUrl.match(/\.[a-zA-Z0-9]{3,4}$/)) {
        cleanUrl = path.dirname(cleanUrl);
    }
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '');

    if (!cleanUrl.startsWith('http')) {
        console.error('❌ Invalid URL. Must start with https://');
        process.exit(1);
    }

    updateEnvKey('CLOUDFLARE_PUBLIC_URL', cleanUrl);

    // Write back to file
    try {
        fs.writeFileSync(ENV_PATH, envContent);
        console.log('\n✅ .env file updated successfully!');
        console.log('👉 Please restart your backend server now.');
    } catch (err) {
        console.error('❌ Error writing .env:', err);
    }

    rl.close();
});
