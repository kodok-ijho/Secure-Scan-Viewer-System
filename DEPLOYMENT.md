# 🚀 Deployment Guide - Secure Scanner Viewer

This guide provides step-by-step instructions for deploying the Secure Scanner Viewer to production environments.

## 📋 Pre-Deployment Checklist

### Security Checklist
- [ ] Change default admin password from `Admin@123`
- [ ] Generate strong JWT secret (minimum 32 characters)
- [ ] Configure proper CORS origins for production domains
- [ ] Set `NODE_ENV=production` in backend environment
- [ ] Enable HTTPS for both frontend and backend
- [ ] Review and update file permissions
- [ ] Set up proper backup procedures

### Configuration Checklist
- [ ] Update API URLs in frontend environment variables
- [ ] Configure source folder paths for production
- [ ] Set appropriate file retention policies
- [ ] Test file access permissions
- [ ] Verify storage directory permissions
- [ ] Configure proper logging levels

## 🌐 Frontend Deployment

### Option 1: Netlify Deployment

1. **Prepare the build**:
   ```bash
   cd web
   npm run build
   ```

2. **Deploy via Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Or deploy via Git**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Set base directory: `web`

4. **Environment Variables** (Netlify Dashboard):
   ```
   VITE_API_BASE_URL=https://your-backend-server.herokuapp.com/api
   VITE_APP_NAME=Secure Scanner Viewer
   VITE_APP_VERSION=1.0.0
   ```

### Option 2: Vercel Deployment

1. **Deploy via Vercel CLI**:
   ```bash
   cd web
   npm install -g vercel
   vercel --prod
   ```

2. **Or deploy via Git**:
   - Connect your GitHub repository to Vercel
   - Vercel will auto-detect Vite configuration

3. **Environment Variables** (Vercel Dashboard):
   ```
   VITE_API_BASE_URL=https://your-backend-server.railway.app/api
   ```

### Option 3: Static Hosting (AWS S3, DigitalOcean Spaces, etc.)

1. **Build the application**:
   ```bash
   cd web
   npm run build
   ```

2. **Upload dist/ folder** to your static hosting service

3. **Configure redirects** for SPA routing:
   - All routes should redirect to `index.html`

## 🖥️ Backend Deployment

### Option 1: Heroku Deployment

1. **Create Heroku app**:
   ```bash
   heroku create your-scanner-viewer-api
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
   heroku config:set CORS_ORIGIN=https://your-frontend.netlify.app
   heroku config:set LOCAL_STORAGE_PATH=./storage
   heroku config:set DEFAULT_SOURCE_FOLDER=./source-files
   heroku config:set DEFAULT_RETENTION_DAYS=7
   heroku config:set ADMIN_USERNAME=admin
   heroku config:set ADMIN_PASSWORD=YourSecurePassword123!
   ```

3. **Create Procfile**:
   ```
   web: node server.js
   ```

4. **Deploy**:
   ```bash
   git add .
   git commit -m "Production deployment"
   git push heroku main
   ```

### Option 2: Railway Deployment

1. **Connect GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Railway will auto-deploy** on git push

### Option 3: DigitalOcean Droplet/AWS EC2/VPS

1. **Setup server**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy application**:
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/secure-scanner-viewer.git
   cd secure-scanner-viewer
   
   # Install dependencies
   npm install
   
   # Create production environment file
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Configure environment** (`.env`):
   ```bash
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
   CORS_ORIGIN=https://your-frontend-domain.com
   LOCAL_STORAGE_PATH=/var/www/scanner-viewer/storage
   DEFAULT_SOURCE_FOLDER=/mnt/network-share/scanned-files
   DEFAULT_RETENTION_DAYS=30
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=YourSecurePassword123!
   ```

4. **Start with PM2**:
   ```bash
   pm2 start server.js --name "scanner-viewer"
   pm2 startup
   pm2 save
   ```

5. **Setup Nginx reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name your-api-domain.com;
       
       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-api-domain.com
   ```

## 🔧 Post-Deployment Configuration

### 1. Test the Deployment

1. **Test frontend**:
   - Visit your frontend URL
   - Verify login page loads
   - Test login with admin credentials

2. **Test backend**:
   - Test health endpoint: `GET https://your-api.com/health`
   - Test login endpoint: `POST https://your-api.com/api/auth/login`

3. **Test file operations**:
   - Upload test files to source folder
   - Run indexing operation
   - Verify file access control

### 2. Configure Source Folder

1. **For network shares**:
   ```bash
   # Mount network share (Linux)
   sudo mount -t cifs //server/share /mnt/network-share -o username=user,password=pass
   
   # Add to /etc/fstab for permanent mounting
   //server/share /mnt/network-share cifs username=user,password=pass,uid=1000,gid=1000 0 0
   ```

2. **Set folder permissions**:
   ```bash
   sudo chown -R www-data:www-data /path/to/source/folder
   sudo chmod -R 755 /path/to/source/folder
   ```

### 3. Setup Monitoring

1. **Application monitoring**:
   ```bash
   # Monitor with PM2
   pm2 monit
   
   # View logs
   pm2 logs scanner-viewer
   ```

2. **System monitoring**:
   - Setup disk space monitoring for storage directory
   - Monitor memory and CPU usage
   - Setup log rotation

### 4. Backup Strategy

1. **Database backup** (if using external database):
   ```bash
   # Setup automated backups
   crontab -e
   # Add: 0 2 * * * /path/to/backup-script.sh
   ```

2. **File storage backup**:
   ```bash
   # Backup storage directory
   rsync -av /var/www/scanner-viewer/storage/ /backup/storage/
   ```

## 🔒 Security Hardening

### 1. Server Security

1. **Firewall configuration**:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Fail2ban for SSH protection**:
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

### 2. Application Security

1. **Environment variables**:
   - Never commit `.env` files to git
   - Use strong, unique passwords
   - Rotate JWT secrets regularly

2. **File permissions**:
   ```bash
   # Secure application files
   sudo chown -R www-data:www-data /var/www/scanner-viewer
   sudo chmod -R 644 /var/www/scanner-viewer
   sudo chmod +x /var/www/scanner-viewer/server.js
   ```

## 📊 Monitoring & Maintenance

### 1. Log Management

1. **Application logs**:
   ```bash
   # View PM2 logs
   pm2 logs scanner-viewer --lines 100
   
   # Setup log rotation
   pm2 install pm2-logrotate
   ```

2. **System logs**:
   ```bash
   # Monitor system logs
   sudo journalctl -u nginx -f
   ```

### 2. Performance Monitoring

1. **Monitor disk usage**:
   ```bash
   df -h
   du -sh /var/www/scanner-viewer/storage
   ```

2. **Monitor memory usage**:
   ```bash
   free -h
   pm2 monit
   ```

### 3. Regular Maintenance

1. **Update dependencies**:
   ```bash
   npm audit
   npm update
   ```

2. **Clean up old files**:
   - Monitor retention policy effectiveness
   - Clean up log files regularly
   - Monitor storage usage

## 🆘 Troubleshooting

### Common Issues

1. **CORS errors**:
   - Verify CORS_ORIGIN environment variable
   - Check frontend API URL configuration

2. **File access issues**:
   - Check file permissions
   - Verify source folder accessibility
   - Test network share connectivity

3. **Authentication issues**:
   - Verify JWT secret configuration
   - Check token expiration settings
   - Validate user credentials

### Emergency Procedures

1. **Rollback deployment**:
   ```bash
   git revert HEAD
   pm2 restart scanner-viewer
   ```

2. **Reset admin password**:
   - Update ADMIN_PASSWORD environment variable
   - Restart application

3. **Clear storage**:
   ```bash
   # Backup first!
   cp -r storage storage-backup
   rm -rf storage/*
   ```

---

**Remember**: Always test deployments in a staging environment before deploying to production!
