# MongoDB Atlas Setup Guide for SAHAL CARD

This guide will help you set up MongoDB Atlas for your SAHAL CARD application.

## 🚀 Quick Start

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Choose the **FREE** tier (M0 Sandbox)

### 2. Create a Cluster
1. Click **"Build a Database"**
2. Choose **"FREE"** tier
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to your users
5. Name your cluster (e.g., "maandhise-cluster")
6. Click **"Create"**

### 3. Set Up Database Access
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username and strong password
5. Set privileges to **"Read and write to any database"**
6. Click **"Add User"**

### 4. Configure Network Access
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production: Add your specific IP addresses
5. Click **"Confirm"**

### 5. Get Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. Copy the connection string

### 6. Configure Your Application

#### Update Environment Variables
1. Copy `backend/env.example` to `backend/.env`
2. Replace the MongoDB URI with your Atlas connection string:

```env
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://your-username:your-password@maandhise-cluster.xxxxx.mongodb.net/maandhise?retryWrites=true&w=majority
```

#### Example Connection String Format:
```
mongodb+srv://maandhise_user:your_secure_password@maandhise-cluster.abc123.mongodb.net/maandhise?retryWrites=true&w=majority
```

## 📊 Database Collections

Your MongoDB Atlas database will contain these collections:

### Users Collection
- **Purpose**: Store user accounts and profiles
- **Indexes**: email (unique), idNumber (unique), role
- **Fields**: fullName, email, phone, idNumber, photo, location, role, password, etc.

### SahalCards Collection
- **Purpose**: Store Sahal Card information
- **Indexes**: cardNumber (unique), userId, validUntil, status
- **Fields**: userId, cardNumber, qrCode, isActive, validUntil, membershipFee, etc.

### Companies Collection
- **Purpose**: Store partner company information
- **Indexes**: businessName (text search)
- **Fields**: businessName, contactInfo, discountRates, etc.

### Transactions Collection
- **Purpose**: Store transaction history
- **Indexes**: customerId, createdAt (compound)
- **Fields**: customerId, companyId, amount, discount, timestamp, etc.

### Notifications Collection
- **Purpose**: Store user notifications
- **Indexes**: userId, createdAt (compound)
- **Fields**: userId, type, message, read, timestamp, etc.

## 🔧 Testing Your Connection

### 1. Start Your Backend Server
```bash
cd backend
npm run dev
```

### 2. Check Connection Logs
You should see:
```
🔄 Connecting to MongoDB Atlas...
✅ MongoDB Atlas connected successfully
📊 Database: maandhise
🌐 Host: maandhise-cluster-shard-00-00.abc123.mongodb.net
✅ Database indexes created successfully
```

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Should return:
{
  "success": true,
  "message": "SAHAL CARD API is running",
  "timestamp": "2025-01-12T...",
  "environment": "development"
}
```

## 🛡️ Security Best Practices

### 1. Database User Security
- Use strong passwords (12+ characters)
- Create separate users for different environments
- Use least privilege principle

### 2. Network Security
- **Development**: Allow access from anywhere (0.0.0.0/0)
- **Production**: Whitelist specific IP addresses only
- Use VPC peering for production applications

### 3. Connection String Security
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate passwords regularly

### 4. Data Encryption
- MongoDB Atlas encrypts data at rest by default
- Use TLS/SSL for data in transit (enabled by default)

## 📈 Monitoring and Maintenance

### 1. Atlas Monitoring
- Monitor cluster performance in Atlas dashboard
- Set up alerts for high CPU/memory usage
- Track connection count and query performance

### 2. Database Maintenance
- Regular backups (automated in Atlas)
- Monitor index usage and performance
- Clean up old data periodically

### 3. Scaling
- **M0 (Free)**: 512MB storage, shared RAM
- **M2/M5**: Dedicated resources for production
- **M10+**: Auto-scaling and advanced features

## 🚨 Troubleshooting

### Common Issues:

#### 1. Authentication Failed
```
❌ MongoDB Atlas connection error: authentication failed
```
**Solution**: Check username and password in connection string

#### 2. Network Timeout
```
❌ MongoDB Atlas connection error: timeout
```
**Solution**: Check network access settings and IP whitelist

#### 3. Connection Refused
```
❌ MongoDB Atlas connection error: connection refused
```
**Solution**: Verify cluster is running and accessible

### Debug Steps:
1. Verify connection string format
2. Check database user permissions
3. Confirm network access settings
4. Test with MongoDB Compass
5. Check Atlas cluster status

## 📞 Support

- **MongoDB Atlas Documentation**: https://docs.atlas.mongodb.com/
- **MongoDB Community**: https://community.mongodb.com/
- **Atlas Support**: Available in Atlas dashboard

## 🎯 Next Steps

1. ✅ Set up MongoDB Atlas cluster
2. ✅ Configure environment variables
3. ✅ Test database connection
4. 🔄 Deploy to production
5. 🔄 Set up monitoring and alerts
6. 🔄 Implement backup strategies

Your MongoDB Atlas setup is now ready for the SAHAL CARD application! 🎉
