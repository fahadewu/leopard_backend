# Portfolio Backend API

A comprehensive admin panel backend built with Express.js and MySQL for managing portfolio content.

## 🚀 Features

- **Authentication**: JWT-based admin authentication
- **Profile Management**: Update personal information and profile images
- **Skills Management**: Add, edit, and organize skills with levels
- **Project Management**: Manage portfolio projects with images and galleries
- **Testimonials**: Handle client testimonials with ratings
- **Education**: Track educational background
- **Image Gallery**: Upload and organize gallery images
- **Contact Management**: Handle contact form submissions
- **File Uploads**: Secure image upload with validation
- **Database**: MySQL with proper relationships and indexing

## 🛠️ Technologies

- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **express-validator** - Input validation

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── upload.js            # File upload middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── profile.js           # Profile management
│   ├── skills.js            # Skills CRUD
│   ├── projects.js          # Projects CRUD
│   ├── testimonials.js      # Testimonials CRUD
│   ├── education.js         # Education CRUD
│   ├── gallery.js           # Gallery management
│   └── contact.js           # Contact messages
├── scripts/
│   └── initDatabase.js      # Database initialization
├── uploads/                 # File uploads directory
├── server.js               # Main server file
├── package.json
└── .env.example
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

1. Install MySQL and create a database
2. Copy `.env.example` to `.env` and update database credentials:

```bash
cp .env.example .env
```

Edit `.env` with your database configuration:
```
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=portfolio_db
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### 3. Initialize Database

```bash
npm run init-db
```

This will:
- Create the database if it doesn't exist
- Create all necessary tables
- Insert sample data
- Create an admin user

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `https://localhost:5000`

## 📊 Database Schema

### Core Tables

- **users** - Admin authentication
- **profile** - Personal information
- **skills** - Technical skills with levels
- **projects** - Portfolio projects
- **testimonials** - Client testimonials
- **education** - Educational background
- **gallery** - Image gallery
- **contact_messages** - Contact form submissions

## 🔒 API Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

### Login Endpoint
```
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Profile
- `GET /api/profile` - Get profile (Public)
- `PUT /api/profile` - Update profile (Admin)

### Skills
- `GET /api/skills` - Get all skills (Public)
- `POST /api/skills` - Create skill (Admin)
- `PUT /api/skills/:id` - Update skill (Admin)
- `DELETE /api/skills/:id` - Delete skill (Admin)

### Projects
- `GET /api/projects` - Get all projects (Public)
- `GET /api/projects/:id` - Get single project (Public)
- `POST /api/projects` - Create project (Admin)
- `PUT /api/projects/:id` - Update project (Admin)
- `DELETE /api/projects/:id` - Delete project (Admin)

### Testimonials
- `GET /api/testimonials` - Get testimonials (Public)
- `POST /api/testimonials` - Create testimonial (Admin)
- `PUT /api/testimonials/:id` - Update testimonial (Admin)
- `DELETE /api/testimonials/:id` - Delete testimonial (Admin)

### Education
- `GET /api/education` - Get education records (Public)
- `POST /api/education` - Create education record (Admin)
- `PUT /api/education/:id` - Update education record (Admin)
- `DELETE /api/education/:id` - Delete education record (Admin)

### Gallery
- `GET /api/gallery` - Get gallery images (Public)
- `GET /api/gallery/categories` - Get categories (Public)
- `POST /api/gallery` - Upload gallery image (Admin)
- `PUT /api/gallery/:id` - Update gallery image (Admin)
- `DELETE /api/gallery/:id` - Delete gallery image (Admin)

### Contact
- `POST /api/contact` - Send contact message (Public)
- `GET /api/contact/messages` - Get all messages (Admin)
- `PUT /api/contact/messages/:id/status` - Update message status (Admin)
- `DELETE /api/contact/messages/:id` - Delete message (Admin)
- `GET /api/contact/stats` - Get message statistics (Admin)

## 🔐 Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on API endpoints
- File upload validation
- Input validation and sanitization
- CORS configuration
- Helmet security headers

## 🚀 Deployment

1. Set environment variables for production
2. Use PM2 or similar process manager
3. Set up reverse proxy with Nginx
4. Configure SSL certificates
5. Set up database backups

## 📝 Admin Panel Features

The backend provides APIs for a complete admin panel with:

- Dashboard with statistics
- Content management for all sections
- File upload capabilities
- Contact message management
- User authentication and security

## 🤝 Integration with Frontend

The backend is designed to work seamlessly with the Next.js frontend. Update the frontend to fetch data from these API endpoints instead of using static data.