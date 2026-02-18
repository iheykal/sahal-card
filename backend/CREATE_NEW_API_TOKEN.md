# How to Create New R2 API Token

## Current Status
❌ **Upload test failed** - Access keys are incorrect (SSL handshake failure)

## Account Information
- **Account ID:** `1cef139ca63a45d2b251968e75747e16`
- **Bucket Name:** `sahal-card`
- **Public URL:** `https://pub-1cef139ca63a45d2b251968e75747e16.r2.dev`

## Steps to Create New API Token

### 1. Open Cloudflare Dashboard
Go to: https://dash.cloudflare.com/

### 2. Navigate to R2
- Click **R2** in the left sidebar
- Verify you see the `sahal-card` bucket

### 3. Create API Token
- Click **"Manage R2 API Tokens"** (top right)
- Click **"Create API Token"**

### 4. Configure Token
- **Name:** `sahal-backend-upload`
- **Permissions:** Object Read & Write
- **Apply to:** `sahal-card` bucket (or All R2 buckets)
- Click **"Create API Token"**

### 5. Copy Credentials
Cloudflare will show (ONLY ONCE):
```
Access Key ID: [copy this]
Secret Access Key: [copy this]
```

### 6. Share with Me
Provide:
- Access Key ID
- Secret Access Key

I will then:
1. Update `.env` file
2. Run `node test-r2-upload.js` to verify
3. Restart backend server
4. Test image upload from UI

## Why This Is Needed
The current access keys in `.env` were created for a different account. The account ID in your public URL (`1cef139ca63a45d2b251968e75747e16`) doesn't match the old configuration.
