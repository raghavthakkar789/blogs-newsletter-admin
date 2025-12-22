# Blogs & Newsletter Admin Panel

A production-ready full-stack admin panel for managing blog posts and newsletters with role-based access control.

## Features

- **Role-Based Authentication**: Two user roles (Admin and Marketing Manager) with different permissions
- **Content Management**: Create, edit, and manage blogs and newsletters
- **Approval Workflow**: Content requires admin approval before publishing
- **User Management**: Admin can manage user accounts
- **Activity Logging**: Complete audit trail of all system actions
- **File Uploads**: Image upload functionality with validation
- **Rich Text Editor**: WYSIWYG editor for content creation
- **Analytics Dashboard**: Statistics and insights for content and users

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React 18 with TypeScript
- Vite
- React Router DOM v6
- TanStack Query (React Query)
- React Hook Form + Zod
- shadcn/ui components
- Tailwind CSS
- React Quill (rich text editor)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and JWT secrets:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/blog_admin"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
PORT=5000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:5173"
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:push
```

7. Seed the database with default admin user:
```bash
npm run prisma:seed
```

8. Start the development server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:5173`

## Default Credentials

After seeding the database, you can login with:

- **Email**: `admin@example.com`
- **Password**: `Admin@123456`

## User Roles & Permissions

### ADMIN
- Full system access
- Create, edit, delete any content
- Approve/reject content
- Manage user accounts
- View all analytics and activity logs
- Configure system settings

### MARKETING_MANAGER
- Create and edit own blog posts and newsletters
- Upload media for their content
- View own content statistics
- Cannot approve/reject content
- Cannot delete approved/published content
- Cannot edit other users' content
- Cannot manage user accounts

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only, except first user)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password

### Blogs
- `GET /api/blogs` - Get all blogs (with pagination and filters)
- `GET /api/blogs/:id` - Get blog by ID
- `POST /api/blogs` - Create blog
- `PATCH /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog (Admin only)
- `PATCH /api/blogs/:id/status` - Update blog status (Admin only)

### Newsletters
- Same structure as blogs endpoints

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/activity-logs` - Get activity logs (Admin only)

### Upload
- `POST /api/upload` - Upload file (images only, max 10MB)

### AI Content Generation
- `POST /api/generate-content` - Generate content using AI

## Project Structure

```
blogs-newsletter-admin/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/       # Auth, logging, rate limiting
│   │   ├── utils/            # Utilities (auth, access control)
│   │   ├── lib/              # Prisma client
│   │   └── index.ts          # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts          # Seed script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   ├── context/         # React context (Auth)
│   │   ├── lib/             # Utilities
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main app component
│   └── package.json
└── README.md
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT authentication with refresh tokens
- Role-based access control
- Rate limiting on authentication endpoints
- CORS configuration
- Helmet security headers
- Input validation with Zod
- Account lockout after failed login attempts

## Development

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Deployment

1. Build the backend:
```bash
cd backend
npm run build
```

2. Build the frontend:
```bash
cd frontend
npm run build
```

3. Set environment variables for production
4. Run database migrations
5. Start the production server

## License

ISC

## Support

For issues and questions, please open an issue on the repository.
