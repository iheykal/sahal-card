# R2 Migration Guide: Keeping Old Images Accessible

## Overview
You're migrating from an old R2 bucket to the new `sahal-card-2025` bucket. This guide explains how to maintain access to existing images while using the new bucket for future uploads.

## New Credentials Summary
- **Account ID**: `48e9471ba538dabfb67bfddd3880dcbc`
- **Bucket Name**: `sahal-card-2025`
- **Endpoint**: `https://48e9471ba538dabfb67bfddd3880dcbc.r2.cloudflarestorage.com`

## How Backward Compatibility Works

### ✅ Good News: No Migration Required!
Your existing images will continue to work because:

1. **Old images use their full URLs** - They're stored in your MongoDB database with complete URLs like:
   ```
   https://pub-{old-account-id}.r2.dev/{old-bucket}/uploads/image.jpg
   ```

2. **New uploads will use new bucket** - After updating credentials, new images will be stored at:
   ```
   https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev/sahal-card-2025/uploads/image.jpg
   ```

3. **Both work simultaneously** - The old bucket continues to serve existing images, while new uploads go to the new bucket.

## Migration Steps

### Step 1: Update R2 Credentials
```bash
cd c:\Users\ILYAAS ABDIRAHMAN\Desktop\maandhise\backend
node update-to-sahal-card-2025.js
```

This updates your `.env` file with:
- New Access Key ID
- New Secret Access Key  
- New Endpoint
- New Bucket Name
- New Public URL

### Step 2: Enable Public Access on New Bucket

> **CRITICAL**: Without this, new images won't be accessible!

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** → **sahal-card-2025**
3. Click **Settings** → **Public Access**
4. Click **Allow Access** or **Connect Domain**
5. Note the public R2.dev URL (should be: `https://pub-48e9471ba538dabfb67bfddd3880dcbc.r2.dev/sahal-card-2025`)

### Step 3: Restart Backend Server
```bash
# Stop the current server (Ctrl+C)
npm start
```

### Step 4: Test Upload Functionality
1. Log into your admin dashboard
2. Try creating a new customer with an image
3. Verify the image uploads successfully
4. Check the image URL starts with the new public URL

## Keeping Old Bucket Active

### Option A: Keep Both Buckets (Recommended)
- **Pros**: Zero downtime, no migration work, old links never break
- **Cons**: Managing two buckets, slight cost for storing in both

**Steps:**
1. ✅ Keep your old R2 bucket active
2. ✅ Ensure public access is still enabled on old bucket
3. ✅ Old images continue working at their existing URLs
4. ✅ New images go to new bucket automatically

### Option B: Migrate Old Images (Advanced)
If you want everything in one bucket, you can migrate:

1. **Copy old images to new bucket** - Use R2 API or rclone
2. **Update database URLs** - Run a script to update all image URLs in MongoDB
3. **Delete old bucket** - After verification

> ⚠️ **Not recommended** unless you have a specific reason. Option A is simpler and safer.

## Verification Checklist

After migration, verify:

- [ ] Backend server starts without errors
- [ ] R2 service logs show new bucket name
- [ ] New image uploads work correctly
- [ ] New images are publicly accessible
- [ ] Old images still display correctly (check existing customers)
- [ ] Image URLs in database are correct

## Troubleshooting

### Issue: New images return 404
**Solution**: Enable public access on `sahal-card-2025` bucket

### Issue: Old images return 404
**Solution**: Keep old bucket active and ensure public access is enabled

### Issue: Upload fails with "Access Denied"
**Solution**: Verify Access Key ID and Secret Access Key are correct

### Issue: Wrong bucket being used
**Solution**: Restart backend server to load new environment variables

## Rollback Plan

If something goes wrong, you can rollback:

1. Stop the backend server
2. Restore old credentials in `.env` file
3. Restart backend server
4. All functionality returns to previous state

## Cost Considerations

- R2 charges per GB stored and per operation
- Keeping both buckets active means:
  - Storage cost for old bucket (existing images)
  - Storage cost for new bucket (new images)
  - Minimal operation costs (GET requests are free up to 10M/month)

## Questions?

**Q: Will users see broken images during migration?**
A: No. Old images continue working at their existing URLs.

**Q: Do I need to update any frontend code?**
A: No. The frontend uses whatever URL is returned from the backend.

**Q: Can I delete the old bucket later?**
A: Yes, but only after migrating all image URLs in your database to point to new bucket.

**Q: What if I get new credentials for the old bucket?**
A: The old bucket's public URL won't change, so images will still work.
