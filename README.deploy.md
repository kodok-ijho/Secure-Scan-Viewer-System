# 🚀 Quick Deploy - Secure Scanner Viewer

Deploy the Secure Scanner Viewer System to production with near "one-click" deployment using Railway (backend) and Netlify (frontend).

## 📋 Prerequisites

- GitHub account with this repository
- Railway account (free tier available)
- Netlify account (free tier available)

## 🎯 Two-Click Deployment Flow

### 1) Backend → Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.app/template/secure-scanner-viewer)

**Railway template provisions**:
- ✅ Service root directory: `/server`
- ✅ **Persistent volume** mounted at `/data`
- ✅ Environment variables with production defaults
- ✅ Health check endpoint: `/api/health`
- ✅ Automated Prisma migrations on deploy
- ✅ Optional: Cron service for file cleanup every 15 minutes

**Required Railway Configuration**:
1. **Service Root Directory**: Set to `server` in Railway UI
2. **Volume**: Attach a volume and mount at `/data`
3. **Environment Variables**: See table below

### 2) Frontend → Netlify

**After Railway deployment**, visit your Railway app URL and navigate to:  
`https://<your-railway-domain>/deploy/netlify`

This generates a Netlify deploy link with pre-configured:
- ✅ Monorepo base directory: `web`
- ✅ API URL: `VITE_API_URL=https://<your-railway-domain>`
- ✅ SPA routing configuration

Alternatively, use the manual Netlify button:
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/kodok-ijho/Secure-Scan-Viewer-System&base=web)

## ⚙️ Environment Variables

### Railway (Backend) - Required

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | Server port (auto-set by Railway) |
| `NODE_ENV` | `production` | Environment mode |
| `WEB_ORIGIN` | `https://your-app.netlify.app` | Frontend URL for CORS |
| `JWT_SECRET` | `change_me_in_production` | JWT signing secret (32+ chars) |
| `DATABASE_URL` | `file:/data/db/app.db` | SQLite database path |
| `LOCAL_ROOT` | `/data/storage/local` | File storage directory |
| `DEFAULT_SOURCE` | `/data/source` | Default source folder |
| `RETENTION_DAYS` | `2` | File retention period |
| `ADMIN_USERNAME` | `admin` | Default admin username |
| `ADMIN_PASSWORD` | `Admin@123` | Default admin password |

### Netlify (Frontend) - Required

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Railway backend URL (e.g., `https://your-app.railway.app`) |

## 🔧 Manual Deployment Steps

### Railway Backend Setup

1. **Create Railway Project**:
   ```bash
   # Connect your GitHub repository to Railway
   # Or use Railway CLI
   railway login
   railway link
   ```

2. **Configure Service**:
   - Set **Root Directory** to `server`
   - Attach a **Volume** and mount at `/data`
   - Add environment variables from table above

3. **Deploy**:
   ```bash
   railway up
   ```

### Netlify Frontend Setup

1. **Connect Repository**:
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build**:
   - **Base directory**: `web`
   - **Build command**: `npm run build`
   - **Publish directory**: `web/dist`

3. **Environment Variables**:
   - Add `VITE_API_URL` with your Railway backend URL

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │    Railway      │
│   (Frontend)    │◄──►│   (Backend)     │
│                 │    │                 │
│ • React/Vite    │    │ • Node.js/TS    │
│ • SPA Routing   │    │ • Prisma/SQLite │
│ • Static Assets │    │ • File Storage  │
└─────────────────┘    │ • Volume Mount  │
                       └─────────────────┘
```

## 📊 Features Preserved

All existing functionality is maintained:

### 🔐 Authentication & Security
- ✅ Role-based access control (Admin/User)
- ✅ JWT authentication with secure tokens
- ✅ Server-side file filtering by username prefix
- ✅ CORS protection for production domains

### 📁 File Management
- ✅ File indexing from source folders (COPY/MOVE modes)
- ✅ File preview and download with access control
- ✅ File deletion with proper permissions
- ✅ Automatic file cleanup based on retention policy

### 👥 User Management (Admin Only)
- ✅ User creation and role assignment
- ✅ Password management
- ✅ User activity tracking

### 📈 Monitoring & Logging
- ✅ Comprehensive audit logs
- ✅ Dashboard statistics and system overview
- ✅ Health monitoring and status checks

## 🔍 Verification Checklist

After deployment, verify functionality:

### Backend (Railway)
- [ ] Health check responds: `GET https://your-app.railway.app/api/health`
- [ ] Database migrations completed successfully
- [ ] Volume mounted and directories created
- [ ] Environment variables loaded correctly
- [ ] File cleanup script accessible

### Frontend (Netlify)
- [ ] Site loads without errors
- [ ] SPA routing works (refresh on any page)
- [ ] API calls reach Railway backend
- [ ] Environment variables loaded correctly

### Integration
- [ ] Admin login works: `admin` / `Admin@123`
- [ ] User login works: `dhaniy` / `123456`
- [ ] File operations work end-to-end
- [ ] Role-based access control enforced
- [ ] File indexing and cleanup functional

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Run cleanup script
npm run cleanup
```

## 🚨 Troubleshooting

### Common Issues

**Railway deployment fails**:
- Verify service root directory is set to `server`
- Check that volume is attached and mounted at `/data`
- Review build logs for missing dependencies

**Netlify build fails**:
- Ensure base directory is set to `web`
- Verify `VITE_API_URL` environment variable is set
- Check for TypeScript errors in build logs

**CORS errors**:
- Update `WEB_ORIGIN` in Railway to match Netlify URL
- Ensure no trailing slashes in URLs

**File operations fail**:
- Verify volume is properly mounted
- Check file permissions in Railway logs
- Ensure source folder is accessible

### Support

For deployment issues:
- Check Railway logs: `railway logs`
- Review Netlify deploy logs in dashboard
- Verify environment variables are set correctly
- Test API endpoints directly

---

**🎉 Ready to deploy? Start with the Railway button above!**
