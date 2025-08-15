# Secure Scanner Viewer System

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
   git clone <repository-url>
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
