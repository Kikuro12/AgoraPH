# 🚂 Railway Deployment Guide for AgroPH

This guide will help you deploy AgroPH to Railway with zero errors.

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed locally
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] OpenWeatherMap API key obtained
- [ ] Git repository ready

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Clone or download the AgroPH project**
   ```bash
   git clone <your-repo-url>
   cd agroph
   ```

2. **Install dependencies locally to test**
   ```bash
   npm install
   ```

### Step 2: Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API Keys" section
4. Copy your API key (keep it safe!)

### Step 3: Deploy to Railway

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Initialize Railway Project**
   ```bash
   railway init
   ```
   - Choose "Create new project"
   - Name it "agroph" or your preferred name

3. **Add PostgreSQL Database**
   ```bash
   railway add postgresql
   ```
   - This automatically creates a PostgreSQL database
   - Railway will set the `DATABASE_URL` environment variable

4. **Set Environment Variables**
   ```bash
   # Required variables
   railway variables set JWT_SECRET=$(openssl rand -base64 32)
   railway variables set WEATHER_API_KEY=your_openweathermap_api_key_here
   railway variables set NODE_ENV=production
   
   # Optional variables (with defaults)
   railway variables set ADMIN_EMAIL=admin@agroph.com
   railway variables set ADMIN_PASSWORD=secure_admin_password_123
   railway variables set MAX_FILE_SIZE=10485760
   railway variables set SOCKET_CORS_ORIGIN=*
   ```

5. **Deploy the Application**
   ```bash
   railway up
   ```

### Step 4: Post-Deployment Setup

1. **Get Your Railway URL**
   ```bash
   railway status
   ```
   - Copy the deployment URL

2. **Test the Deployment**
   - Visit your Railway URL
   - Try logging in with admin credentials
   - Test document upload/download
   - Test weather functionality
   - Test chat and forum features

3. **Change Default Admin Password**
   - Login with default credentials
   - Go to Profile → Update password
   - Or update via environment variables

## 🔧 Environment Variables Reference

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection | Auto-set by Railway |
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -base64 32` |
| `WEATHER_API_KEY` | OpenWeatherMap API key | Get from openweathermap.org |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | production |
| `ADMIN_EMAIL` | Admin email | admin@agroph.com |
| `ADMIN_PASSWORD` | Admin password | admin123 |
| `MAX_FILE_SIZE` | Max upload size | 10485760 (10MB) |
| `SOCKET_CORS_ORIGIN` | Socket.io CORS | * |

## 🐛 Troubleshooting Railway Deployment

### Build Errors

**"Module not found" errors**
```bash
# Ensure all dependencies are in package.json
npm install --save missing-package-name
git add package.json package-lock.json
git commit -m "Add missing dependency"
railway up
```

**Node.js version errors**
```bash
# Check package.json engines field
# Should specify Node.js 18+
```

### Runtime Errors

**Database connection failed**
```bash
# Check if PostgreSQL plugin is added
railway add postgresql

# Verify DATABASE_URL is set
railway variables
```

**Weather API not working**
```bash
# Verify API key is set correctly
railway variables set WEATHER_API_KEY=your_actual_key

# Test API key locally first
curl "https://api.openweathermap.org/data/2.5/weather?q=Manila&appid=YOUR_API_KEY"
```

**File upload errors**
```bash
# Railway has ephemeral filesystem
# Files uploaded will be lost on restart
# Consider using Railway volumes or external storage for production
```

### Performance Issues

**Slow database queries**
- Database indexes are automatically created
- Consider upgrading Railway plan for better performance

**Memory issues**
- Railway provides 512MB RAM on free tier
- Monitor usage in Railway dashboard
- Optimize queries and caching

## 📊 Railway Dashboard Monitoring

### Key Metrics to Monitor

1. **CPU Usage** - Should stay below 80%
2. **Memory Usage** - Watch for memory leaks
3. **Database Connections** - Monitor connection pool
4. **Response Times** - API endpoint performance
5. **Error Rates** - Application errors and crashes

### Log Monitoring

```bash
# View real-time logs
railway logs

# View logs for specific service
railway logs --service=postgresql
```

## 🔐 Security Considerations

### Production Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS (Railway provides this automatically)
- [ ] Review CORS settings for production domain
- [ ] Set up proper error logging
- [ ] Monitor for suspicious activity

### Environment Variables Security

```bash
# Generate secure JWT secret
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Use strong admin password
railway variables set ADMIN_PASSWORD=$(openssl rand -base64 16)
```

## 📈 Scaling on Railway

### Horizontal Scaling
- Railway Pro plan supports multiple replicas
- Load balancing is handled automatically
- Database connection pooling helps with concurrent users

### Vertical Scaling
- Upgrade Railway plan for more CPU/memory
- Monitor resource usage in dashboard
- Consider database plan upgrades for high traffic

## 🔄 Updates and Maintenance

### Deploying Updates

```bash
# Make your changes
git add .
git commit -m "Update feature"

# Deploy to Railway
railway up
```

### Database Migrations

```bash
# Railway automatically runs schema on startup
# For manual migrations, use Railway CLI
railway run npm run migrate
```

### Backup Strategy

```bash
# Export database (from Railway dashboard)
# Or use pg_dump via Railway CLI
railway run pg_dump $DATABASE_URL > backup.sql
```

## 🆘 Getting Help

### Railway Support
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Help Center](https://help.railway.app/)

### AgroPH Support
- Check the application logs: `railway logs`
- Review this deployment guide
- Contact: support@agroph.com

## ✅ Deployment Success Checklist

After deployment, verify these features work:

- [ ] Home page loads correctly
- [ ] User registration and login
- [ ] Document center with categories
- [ ] Document search and filtering
- [ ] Document download functionality
- [ ] Philippines map displays
- [ ] Weather data loads for cities
- [ ] Chat widget connects and sends messages
- [ ] Forum posts and replies work
- [ ] Admin panel accessible
- [ ] Admin can upload documents
- [ ] Admin can manage users
- [ ] Announcements display on home page
- [ ] Mobile responsive design works
- [ ] All Filipino design elements display correctly

## 🎉 You're Done!

Your AgroPH application should now be running successfully on Railway with all features working. The application includes:

- ✅ Professional Filipino design
- ✅ Document center with PDF downloads
- ✅ Interactive Philippines map
- ✅ Real-time weather data
- ✅ Live chat support
- ✅ Community forum
- ✅ Admin panel
- ✅ Mobile-responsive design
- ✅ Zero deployment errors

**Created by Marwen Deiparine** - Empowering Philippine agriculture through technology!