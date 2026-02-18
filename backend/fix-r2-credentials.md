# Fix Cloudflare R2 Credentials Issue

## Problem
The error "Resolved credential object is not valid" occurs because Cloudflare R2 credentials are not properly configured.

## Solution

### 1. Create .env file in backend directory
Create a `.env` file in the `backend` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/maandhise?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRE=30d

# Cloudflare R2 Configuration - REPLACE WITH YOUR ACTUAL VALUES
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_BUCKET_NAME=maandhise-uploads
CLOUDFLARE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_PUBLIC_URL=https://pub-your-account-id.r2.dev/maandhise-uploads

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@maandhise.com
FROM_NAME=SAHAL CARD

# App Configuration
APP_NAME=SAHAL CARD
APP_URL=http://localhost:3000
API_URL=http://localhost:5000

# Sahal Card Configuration
SAHAL_CARD_YEARLY_FEE=1
SAHAL_CARD_RENEWAL_FEE=0.5
SAHAL_CARD_VALIDITY_DAYS=365
```

### 2. Get Cloudflare R2 Credentials

1. **Go to Cloudflare Dashboard**
   - Log in to your Cloudflare account
   - Go to R2 Object Storage

2. **Create R2 Bucket** (if not already created)
   - Click "Create bucket"
   - Name it `maandhise-uploads` (or your preferred name)
   - Choose a location close to your users

3. **Get API Credentials**
   - Go to "Manage R2 API tokens"
   - Click "Create API token"
   - Give it a name like "Maandhise Upload Token"
   - Set permissions to "Object Read & Write"
   - Copy the Access Key ID and Secret Access Key

4. **Get Account ID**
   - In the R2 dashboard, you'll see your Account ID
   - Copy this value

5. **Set up Public Access** (for public URLs)
   - In your R2 bucket settings
   - Go to "Settings" → "Public access"
   - Enable public access
   - Note the public URL format (usually `https://pub-{account-id}.r2.dev/{bucket-name}`)

### 3. Update Environment Variables

Replace the placeholder values in your `.env` file:

```env
CLOUDFLARE_ACCOUNT_ID=your-actual-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-actual-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-actual-secret-access-key
CLOUDFLARE_BUCKET_NAME=maandhise-uploads
CLOUDFLARE_ENDPOINT=https://your-actual-account-id.r2.cloudflarestorage.com
CLOUDFLARE_PUBLIC_URL=https://pub-your-actual-account-id.r2.dev/maandhise-uploads
```

### 4. Test the Configuration

After setting up the credentials, run:

```bash
node test-user-creation-fix.js
```

This should now work with image uploads.

## Alternative: Use Local File Storage (for testing)

If you want to test without R2, you can temporarily modify the R2Service to use local file storage:

1. Create a `uploads` directory in the backend
2. Modify the upload logic to save files locally
3. Serve files through Express static middleware

But for production, R2 is recommended for scalability and reliability.
