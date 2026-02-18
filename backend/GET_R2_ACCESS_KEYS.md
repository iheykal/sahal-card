# 🔑 How to Get Correct R2 Access Keys

## Problem
Your R2 uploads are failing with 500 error because the **Access Keys are incorrect**.

Error: `SSL alert handshake failure` - This means Cloudflare rejected your credentials.

## ✅ What's Already Correct
- Account ID: `e23ae078a192461585965d945e857d2d` ✅
- Bucket Name: `sahal-card-2025` ✅  
- Public URL: `https://pub-e23ae078a192461585965d945e857d2d.r2.dev` ✅

## ❌ What's Wrong
- **CLOUDFLARE_ACCESS_KEY_ID**: Currently in .env is `b2e94ed04111897cf6f2a151538c7418` ❌
- **CLOUDFLARE_SECRET_ACCESS_KEY**: Currently in .env is wrong ❌

---

## 📋 Steps to Get Correct Access Keys:

### 1. Go to Cloudflare R2 Dashboard
- URL: https://dash.cloudflare.com/
- Click **R2** in left sidebar

### 2. Manage R2 API Tokens
- Click **"Manage R2 API Tokens"** button (usually top right)
- OR go to: R2 → Settings → API Tokens

### 3. Create New API Token (OR find existing one)
- Click **"Create API Token"**
- Give it a name: `maandhise-backend`
- **Permissions:** 
  - ✅ Object Read & Write
  - ✅ Apply to specific bucket: `sahal-card-2025`
- Click **"Create API Token"**

### 4. Copy the Credentials
Cloudflare will show you:
- **Access Key ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Secret Access Key**: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`

⚠️ **IMPORTANT**: Copy these NOW! The Secret Key is only shown ONCE.

###5. Update Your .env File

Run this command from the `backend` folder:

```powershell
# Replace YOUR_ACCESS_KEY_ID and YOUR_SECRET_KEY with actual values
node -e "const fs=require('fs');let c=fs.readFileSync('.env','utf8');c=c.replace(/CLOUDFLARE_ACCESS_KEY_ID=.*/,'CLOUDFLARE_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID');c=c.replace(/CLOUDFLARE_SECRET_ACCESS_KEY=.*/,'CLOUDFLARE_SECRET_ACCESS_KEY=YOUR_SECRET_KEY');fs.writeFileSync('.env',c);console.log('✅ Updated access keys!');"
```

OR manually edit `.env` file and update:
```
CLOUDFLARE_ACCESS_KEY_ID=<your-new-access-key-id>
CLOUDFLARE_SECRET_ACCESS_KEY=<your-new-secret-access-key>
```

### 6. Restart Backend Server
```bash
# Press Ctrl+C in backend terminal
npm start
```

### 7. Test
```bash
node test-r2-connection.js
```

Should show: ✅ SUCCESS! R2 connection works!

---

## 🎯 After This:
- New uploads will work
- Images will save to R2 correctly
- Images will display (no more `founder.jpeg` fallback)
