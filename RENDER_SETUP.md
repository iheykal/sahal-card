# 🚀 Render Deployment Setup for SAHAL CARD

## Current Issue
Your Render service is only serving the backend API because:
- Root Directory is set to `backend`
- Only the backend is being built and deployed

## Solution: Update Render Configuration

### Option 1: Using Docker (Recommended)

1. **Go to your Render service settings**
2. **Update these settings:**

   **Root Directory**: Leave empty (remove `backend`)
   
   **Dockerfile Path**: `./Dockerfile` (use the new root-level Dockerfile)
   
   **Docker Build Context Directory**: `.` (root directory)

3. **Environment Variables** (add these if not already set):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRE=30d
   CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
   CLOUDFLARE_ACCESS_KEY_ID=your-access-key
   CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
   CLOUDFLARE_BUCKET_NAME=your-bucket-name
   CLOUDFLARE_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=noreply@maandhise.com
   FROM_NAME=SAHAL CARD
   APP_NAME=SAHAL CARD
   APP_URL=https://sahalcard.com
   API_URL=https://sahalcard.com
   REACT_APP_API_URL=https://sahalcard.com/api
   REACT_APP_APP_URL=https://sahalcard.com
   SAHAL_CARD_YEARLY_FEE=1
   SAHAL_CARD_RENEWAL_FEE=0.5
   SAHAL_CARD_VALIDITY_DAYS=365
   ```

### Option 2: Using Build Commands (Alternative)

If you prefer not to use Docker:

1. **Root Directory**: Leave empty
2. **Build Command**: 
   ```bash
   cd backend && npm install && cd ../frontend && npm install && npm run build
   ```
3. **Start Command**: 
   ```bash
   cd backend && npm start
   ```

## What This Will Do

✅ **Frontend**: React app will be built and served as static files
✅ **Backend**: API will handle all `/api/*` routes
✅ **Routing**: All non-API routes will serve the React app
✅ **Full App**: You'll see the complete web application instead of just JSON

## After Deployment

1. **Visit**: `https://sahalcard.com` (or your custom domain)
2. **You should see**: The full SAHAL CARD web application
3. **API endpoints**: Still available at `/api/*` routes

## Troubleshooting

If you still see JSON response:
1. Check that Root Directory is empty
2. Verify the Dockerfile is being used
3. Check the build logs in Render dashboard
4. Ensure all environment variables are set

## Next Steps

1. Update your Render service settings
2. Trigger a manual deploy
3. Test the full application
4. Set up custom domain if needed
