# 🚀 SAHAL CARD - Deployment Guide

This guide will help you deploy the SAHAL CARD application to production.

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 7.0+
- Docker and Docker Compose (optional)
- Cloudflare R2 account (for image storage)
- Domain name and SSL certificate

## 🛠️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd maandhise

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

```bash
# Backend environment
cp backend/env.example backend/.env
# Edit backend/.env with your configuration

# Frontend environment
cp frontend/env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 3. Database Setup

```bash
# Start MongoDB (if using local installation)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 4. Start Development Servers

```bash
# From root directory
npm run dev

# Or start individually
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

## 🐳 Docker Deployment

### 1. Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Individual Docker Builds

```bash
# Build backend
cd backend
docker build -t maandhise-backend .

# Build frontend
cd ../frontend
docker build -t maandhise-frontend .
```

## ☁️ Production Deployment

### 1. Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Set environment variables in Vercel dashboard
```

### 2. Railway (Backend)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up
```

### 3. MongoDB Atlas

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

### 4. Cloudflare R2 Setup

1. Create R2 bucket in Cloudflare dashboard
2. Generate API tokens
3. Update environment variables:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_ACCESS_KEY_ID`
   - `CLOUDFLARE_SECRET_ACCESS_KEY`
   - `CLOUDFLARE_BUCKET_NAME`
   - `CLOUDFLARE_PUBLIC_URL`

## 🔧 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/maandhise

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRE=30d

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=maandhise-uploads
CLOUDFLARE_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@maandhise.com
FROM_NAME=SAHAL CARD

# App Configuration
APP_NAME=SAHAL CARD
APP_URL=https://your-domain.com
API_URL=https://api.your-domain.com
```

### Frontend (.env)

```env
REACT_APP_API_URL=https://api.your-domain.com/api
REACT_APP_APP_NAME=SAHAL CARD
REACT_APP_APP_URL=https://your-domain.com
REACT_APP_CLOUDFLARE_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

## 🔒 Security Configuration

### 1. SSL Certificate

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 2. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Analytics

### 1. Health Checks

```bash
# Backend health check
curl https://api.your-domain.com/health

# Frontend health check
curl https://your-domain.com/health
```

### 2. Log Monitoring

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2 logs (if using PM2)
pm2 logs maandhise-backend
pm2 logs maandhise-frontend
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend
        run: |
          cd backend
          # Deploy to Railway
          railway up
          
      - name: Deploy Frontend
        run: |
          cd frontend
          # Deploy to Vercel
          vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check connection string
   - Verify network access in MongoDB Atlas
   - Ensure database user has proper permissions

2. **CORS Issues**
   - Update CORS configuration in backend
   - Check frontend API URL configuration

3. **File Upload Issues**
   - Verify Cloudflare R2 credentials
   - Check bucket permissions
   - Ensure proper CORS configuration on R2

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Performance Optimization

1. **Database Indexing**
   ```javascript
   // Add indexes for better performance
   db.users.createIndex({ email: 1 })
   db.sahacards.createIndex({ cardNumber: 1 })
   db.companies.createIndex({ businessName: "text" })
   ```

2. **Caching**
   - Implement Redis for session storage
   - Use CDN for static assets
   - Enable browser caching

3. **Monitoring**
   - Set up application monitoring (New Relic, DataDog)
   - Configure error tracking (Sentry)
   - Monitor database performance

## 📞 Support

For deployment issues or questions:
- Check the logs first
- Review environment variables
- Verify service dependencies
- Contact the development team

## 🎉 Success!

Once deployed, your SAHAL CARD application will be available at:
- Frontend: https://your-domain.com
- Backend API: https://api.your-domain.com
- Admin Panel: https://your-domain.com/admin

Remember to:
- Set up monitoring and alerts
- Configure backups
- Update DNS records
- Test all functionality
- Monitor performance
