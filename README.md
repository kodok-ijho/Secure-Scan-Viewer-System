# # 🔒 Secure Scanner Viewer System

A professional document management application with role-based access control, designed for organizations that need to securely manage and distribute scanned documents.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [User Guide](#user-guide)
- [Admin Guide](#admin-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🌟 Overview

The Secure Scanner Viewer System is a web-based application that allows organizations to:

- **Securely manage scanned documents** with role-based access control
- **Automatically index files** from network folders or local directories
- **Control file access** based on username prefixes in filenames
- **Track all file operations** with comprehensive audit logging
- **Manage users and permissions** through an intuitive admin interface

### Who is this for?

- **IT Administrators** who need to manage document access and user permissions
- **Office Managers** who want to organize and distribute scanned documents
- **Teams** that need secure, controlled access to shared documents
- **Organizations** requiring audit trails for document access

## ✨ Features

### 🔐 Security & Access Control
- **Role-based authentication** (Admin and User roles)
- **File ownership system** based on filename prefixes
- **Secure token-based authentication** with JWT
- **Server-side access control** that cannot be bypassed

### 📁 File Management
- **Automatic file indexing** from source folders
- **File preview** for images and documents
- **Secure file downloads** with access control
- **File deletion** with proper permissions
- **Bulk operations** for administrators

### 👥 User Management
- **User creation and management** (Admin only)
- **Role assignment** (Admin/User)
- **Password management** and security
- **User activity tracking**

### 📊 Monitoring & Logging
- **Comprehensive audit logs** for all file operations
- **Dashboard statistics** and system overview
- **Activity monitoring** and reporting
- **System health monitoring**

### ⚙️ Administration
- **Source folder configuration** for file indexing
- **Retention policy management** for automatic cleanup
- **System settings** and configuration
- **Real-time system status** monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/secure-scanner-viewer.git
cd secure-scanner-viewer
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd web && npm install && cd ..
```

### 3. Configure Environment

```bash
# Copy environment files
cp .env.example .env
cp web/.env.example web/.env

# Edit the .env files with your configuration
```

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000

### 5. Login

Use the default credentials:
- **Admin**: `admin` / `Admin@123`
- **User**: `dhaniy` / `123456`

> ⚠️ **Important**: Change these default passwords in production!

## 📦 Installation

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/secure-scanner-viewer.git
   cd secure-scanner-viewer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   cp web/.env.example web/.env
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

### Production Setup

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

#### Backend Configuration (`.env`)

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# File Storage
LOCAL_STORAGE_PATH=./storage
DEFAULT_SOURCE_FOLDER=./source-files
DEFAULT_RETENTION_DAYS=7

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123
```

#### Frontend Configuration (`web/.env`)

```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com/api

# Application Configuration
VITE_APP_NAME=Secure Scanner Viewer
VITE_APP_VERSION=1.0.0
```

### File Naming Convention

For proper file ownership, files should follow this naming pattern:
```
[username]_[identifier].[extension]
```

Examples:
- `john_document001.pdf` → Owned by user "john"
- `mary_scan_2024.png` → Owned by user "mary"
- `admin_report.xlsx` → Owned by user "admin"

Files without this pattern are considered "Unassigned" and only visible to administrators.

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

#### Netlify Deployment

1. **Build the frontend**:
   ```bash
   cd web
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Environment Variables** (Netlify Dashboard):
   ```
   VITE_API_BASE_URL=https://your-backend-server.herokuapp.com/api
   ```

#### Vercel Deployment

1. **Deploy to Vercel**:
   ```bash
   cd web
   npx vercel
   ```

2. **Configure environment variables** in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-server.railway.app/api
   ```

### Backend Deployment (Node.js Hosting)

#### Heroku Deployment

1. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-production-secret
   heroku config:set CORS_ORIGIN=https://your-frontend.netlify.app
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

#### Railway Deployment

1. **Connect GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** on git push

#### DigitalOcean/AWS/VPS Deployment

1. **Setup Node.js server**:
   ```bash
   # Install Node.js and npm
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Clone and setup application
   git clone https://github.com/yourusername/secure-scanner-viewer.git
   cd secure-scanner-viewer
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Setup process manager** (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "scanner-viewer"
   pm2 startup
   pm2 save
   ```

4. **Setup reverse proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 👤 User Guide

### For Regular Users

#### Logging In

1. **Navigate** to the application URL
2. **Enter your credentials**:
   - Username: Your assigned username
   - Password: Your assigned password
3. **Click "Sign In"**

#### Viewing Your Files

1. **Dashboard**: See overview of your files and recent activity
2. **Files Page**: Browse all files you have access to
3. **Search**: Use the search box to find specific files
4. **Filter**: Files are automatically filtered to show only your files

#### File Operations

**Preview Files**:
1. Click the **👁️ Preview** button on any file
2. View the file in the preview modal
3. Close the modal when done

**Download Files**:
1. Click the **⬇️ Download** button on any file
2. The file will download to your default download folder

**Delete Files** (if permitted):
1. Click the **🗑️ Delete** button on any file
2. Confirm the deletion in the dialog
3. The file will be permanently removed

#### Understanding File Access

- You can only see files that start with your username
- Example: If your username is "john", you'll only see files like:
  - `john_document.pdf`
  - `john_scan_001.png`
  - `john_report.xlsx`

### For Administrators

#### Admin Dashboard

The admin dashboard provides:
- **System Overview**: Total files, storage usage, recent activity
- **System Status**: Source folder, last indexing, retention settings
- **Recent Files**: Latest files in the system
- **Quick Actions**: Access to all admin functions

#### User Management

**Creating Users**:
1. Go to **Users** page
2. Click **"Add User"**
3. Fill in user details:
   - Username (should match file naming convention)
   - Password (secure password)
   - Role (ADMIN or USER)
4. Click **"Create User"**

**Managing Users**:
- **Edit**: Modify username or role
- **Change Password**: Update user passwords
- **Delete**: Remove users (be careful!)

#### File Management

**Viewing All Files**:
- Admins can see ALL files in the system
- Files are organized by owner
- Unassigned files are marked as "Admin only"

**File Assignment**:
- **Assign**: Assign unassigned files to users
- **Unassign**: Remove file ownership (makes file admin-only)

#### System Configuration

**Settings Page**:
1. **Source Folder**: Configure where files are indexed from
2. **Retention Period**: Set how long files are kept (1-365 days)
3. **Test Access**: Verify source folder accessibility

**Indexing Files**:
1. Go to **Indexing** page
2. Choose indexing mode:
   - **COPY**: Copy files from source (keeps originals)
   - **MOVE**: Move files from source (removes originals)
3. Click **"Run Indexing"**
4. Monitor progress and results

#### Monitoring & Logs

**Activity Logs**:
- View all file operations (copy, move, delete)
- Filter by action type or filename
- See who performed each action and when

**System Monitoring**:
- Monitor file counts and storage usage
- Track indexing operations
- Review system health and performance

## 🔧 API Documentation

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_admin_001",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Files

#### List Files
```http
GET /api/files
Authorization: Bearer <token>
```

#### Stream File
```http
GET /api/files/:filename/stream?token=<token>
```

#### Download File
```http
GET /api/files/:filename/download?token=<token>
```

#### Delete File
```http
DELETE /api/files/:filename
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Settings
```http
GET /api/settings
Authorization: Bearer <admin-token>
```

#### Update Settings
```http
PUT /api/settings
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "sourceFolder": "/path/to/source",
  "retentionDays": 30
}
```

#### Run Indexing
```http
POST /api/indexing/run
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "mode": "COPY"
}
```

#### List Users
```http
GET /api/users
Authorization: Bearer <admin-token>
```

#### Create User
```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "SecurePass123",
  "role": "USER"
}
```

#### Get Logs
```http
GET /api/logs?search=filename&action=Copied
Authorization: Bearer <admin-token>
```

#### Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

## 🔍 Troubleshooting

### Common Issues

#### "Failed to load image" in file preview
**Problem**: Images don't load in the preview modal
**Solution**:
1. Check that the backend server is running
2. Verify the API URL in frontend environment variables
3. Ensure authentication tokens are valid

#### "Access token required" when downloading files
**Problem**: Downloads fail with authentication error
**Solution**:
1. Log out and log back in to refresh tokens
2. Check browser console for token-related errors
3. Verify backend JWT configuration

#### Files not showing up after indexing
**Problem**: Indexing completes but files don't appear
**Solution**:
1. Check file naming convention (username_identifier.ext)
2. Verify source folder path in Settings
3. Check file permissions on source folder
4. Review indexing logs for errors

#### Cannot access admin features
**Problem**: Admin menus not visible
**Solution**:
1. Verify user role is set to "ADMIN"
2. Log out and log back in
3. Check user management in admin panel

#### CORS errors in browser console
**Problem**: Cross-origin request blocked
**Solution**:
1. Update CORS_ORIGIN in backend environment
2. Ensure frontend URL is included in CORS settings
3. Check for trailing slashes in URLs

### Performance Issues

#### Slow file loading
**Solutions**:
- Optimize file sizes before indexing
- Use appropriate image formats (WebP, optimized PNG/JPEG)
- Consider implementing file compression

#### High memory usage
**Solutions**:
- Implement file retention policies
- Regular cleanup of old files
- Monitor storage usage in dashboard

### Security Considerations

#### Production Deployment Checklist
- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable HTTPS for both frontend and backend
- [ ] Configure proper CORS origins
- [ ] Set up proper file permissions
- [ ] Enable access logging
- [ ] Regular security updates

#### File Access Security
- [ ] Verify file naming convention is followed
- [ ] Test user access restrictions
- [ ] Monitor audit logs regularly
- [ ] Implement proper backup procedures

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**: Look at browser console and server logs
2. **Review configuration**: Verify all environment variables
3. **Test connectivity**: Ensure frontend can reach backend
4. **Check permissions**: Verify file and folder permissions
5. **Update dependencies**: Ensure all packages are up to date

### Development Issues

#### Hot reload not working
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Build failures
```bash
# Check for TypeScript errors
npm run build

# Clear build cache
rm -rf dist .vite
npm run build
```

#### Database/Storage issues
```bash
# Reset storage (development only)
rm -rf storage settings.json
```

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**:
   ```bash
   npm run test
   npm run build
   ```
5. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add user profile management"
   ```
6. **Push and create pull request**

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Testing

```bash
# Run frontend tests
cd web && npm test

# Run backend tests (if implemented)
npm test

# Build test
npm run build
```

## 📄 License

This project is private and proprietary. All rights reserved.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Backend powered by [Express.js](https://expressjs.com/)
- UI components from [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

## 📞 Support

For technical support or questions:

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Security**: Report security issues privately to the maintainers

---

**Made with ❤️ for secure document management**

A comprehensive document management system for handling scanned files with role-based access control, automated indexing, and file retention policies.

## 🚀 Features

### Core Functionality
- **File Indexing**: Copy or move files from network/local source folders to local storage
- **Role-Based Access**: Admin and User roles with different permissions
- **File Ownership**: Automatic file ownership based on filename convention `[username]_[code].ext`
- **File Preview**: Support for images, PDFs, and text files with in-browser preview
- **Automated Retention**: Configurable file retention with automatic cleanup
- **Activity Logging**: Comprehensive audit trail of all file operations

### Admin Features
- Configure source folders and retention policies
- Run indexing operations (copy/move files)
- Manage users and permissions
- View system logs and statistics
- Access all files regardless of ownership

### User Features
- View and manage personal files only
- Download and delete owned files
- Preview supported file types
- Search and filter personal documents

## 🛠 Technology Stack

### Backend
- **Node.js 20** with Express.js
- **SQLite** database with Prisma ORM
- **JWT** authentication with access/refresh tokens
- **bcrypt** for password hashing
- **node-cron** for scheduled tasks
- **Jest & Supertest** for testing

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Vitest** for testing

## 📁 Project Structure

```
secure-scanner-viewer/
├── server/                 # Backend application
│   ├── src/
│   │   ├── config/        # Database and environment config
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth and validation middleware
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   ├── jobs/          # Scheduled jobs
│   │   └── __tests__/     # Backend tests
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── web/                   # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # Utilities and API client
│   │   └── __tests__/     # Frontend tests
│   └── package.json
├── .env.example           # Environment variables template
├── package.json           # Root package.json with workspaces
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kodok-ijho/Secure-Scan-Viewer-System
   cd secure-scanner-viewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Backend
   PORT=4000
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   TOKEN_EXPIRES_IN=15m
   REFRESH_EXPIRES_IN=7d

   # Folders
   LOCAL_ROOT=./storage/local
   DEFAULT_SOURCE=\\127.12.23.23\Folder A\Folder B

   # Retention
   RETENTION_DAYS=7

   # CORS
   WEB_ORIGIN=http://localhost:5173
   ```

4. **Set up the database**
   ```bash
   npm run prisma:migrate
   npm run seed
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

### Default Credentials

After seeding, you can log in with:

**Admin Account:**
- Username: `admin`
- Password: `Admin@123`

**Test User Account:**
- Username: `testuser`
- Password: `Test@123`

## 📖 Usage Guide

### For Administrators

1. **Configure Settings**
   - Navigate to Settings page
   - Set the source folder path (UNC or local path)
   - Configure retention period (1-365 days)
   - Test folder access before saving

2. **Run Indexing**
   - Go to Indexing page
   - Choose COPY (keep originals) or MOVE (remove originals)
   - Click "Run Indexing" to process files

3. **Manage Users**
   - Access Users page to create/delete users
   - Assign ADMIN or USER roles
   - Username must match file naming convention

4. **Monitor Activity**
   - View Logs page for audit trail
   - Check Dashboard for system statistics

### For Users

1. **View Files**
   - Dashboard shows your file overview
   - Files page lists all your documents
   - Only files matching your username are visible

2. **Preview Files**
   - Click on any file to preview
   - Supported: Images, PDFs, text files
   - Download button for unsupported types

3. **Manage Files**
   - Download files you need
   - Delete files you no longer need
   - Search through your documents

## 🔧 Configuration

### File Naming Convention

Files must follow the pattern: `[username]_[code].[extension]`

Examples:
- `john_invoice2024.pdf` (owned by user "john")
- `mary_report_final.docx` (owned by user "mary")
- `admin_system_backup.zip` (owned by user "admin")

Files not following this pattern are only accessible to administrators.

### Supported File Types

**Preview Support:**
- Images: PNG, JPG, JPEG, WebP, GIF
- Documents: PDF
- Text: TXT, CSV, JSON, XML, HTML, CSS, JS, TS

**Download Only:**
- All other file types

### Retention Policy

- Configurable retention period (1-365 days)
- Automatic cleanup runs every 15 minutes
- Files older than retention period are permanently deleted
- All deletions are logged for audit purposes

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd web
npm test
```

### Run All Tests
```bash
npm test
```

## 🔒 Security Features

- **Authentication**: JWT-based with access and refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Path Security**: Protection against path traversal attacks
- **Input Validation**: Comprehensive validation using Joi
- **Rate Limiting**: Login attempt rate limiting
- **CORS**: Configurable cross-origin resource sharing
- **File Validation**: Filename and size validation

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Admin Endpoints
- `GET /api/settings` - Get system settings
- `PATCH /api/settings` - Update settings
- `POST /api/index` - Run file indexing
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/logs` - View activity logs

### File Endpoints
- `GET /api/files` - List accessible files
- `GET /api/files/:name/stream` - Stream file for preview
- `GET /api/files/:name/download` - Download file
- `DELETE /api/files/:name` - Delete file

## 🚨 Troubleshooting

### Common Issues

1. **Source folder not accessible**
   - Verify network path is correct
   - Check network connectivity
   - Ensure proper permissions

2. **Files not appearing**
   - Check file naming convention
   - Verify indexing completed successfully
   - Check user permissions

3. **Preview not working**
   - Ensure file size is under 2MB for text files
   - Check file format is supported
   - Verify file is not corrupted

### Logs and Debugging

- Backend logs: Check console output
- Database: Use `npm run prisma:studio` to inspect data
- File operations: Check activity logs in admin panel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all prerequisites are met
4. Verify configuration settings

---

**Note**: This system is designed for internal use. Ensure proper network security and access controls are in place when deploying to production environments.
