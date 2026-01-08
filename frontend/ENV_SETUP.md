# Frontend Environment Variables Setup

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Backend API Configuration
VITE_API_URL=http://localhost:5000

# Authentication Token (REQUIRED)
# This must match the ADMIN_TOKEN in your backend .env file
VITE_ADMIN_TOKEN=admin-token

# Admin User Info (for display)
VITE_ADMIN_EMAIL=admin@example.com
VITE_ADMIN_NAME=Admin User

# Environment
VITE_NODE_ENV=development
```

## Variable Descriptions

### Required Variables

- **VITE_ADMIN_TOKEN**: Admin access token that must match your backend's `ADMIN_TOKEN`. This is used to authenticate all API requests.

### Optional Variables

- **VITE_API_URL**: Backend API base URL (without `/api` suffix). Examples:
  - Local: `http://localhost:5000`
  - Different port: `http://localhost:3000`
  - Production: `https://api.yourdomain.com`
  - If not set, uses Vite proxy (`http://localhost:5000`) for development
- **VITE_ADMIN_EMAIL**: Admin user email for display purposes (default: admin@example.com)
- **VITE_ADMIN_NAME**: Admin user name for display purposes (default: Admin User)
- **VITE_NODE_ENV**: Environment mode (development/production)

## Quick Setup

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. **IMPORTANT**: Update `VITE_ADMIN_TOKEN` to match your backend's `ADMIN_TOKEN`:
   - Check your backend `.env` file for the `ADMIN_TOKEN` value
   - Set the same value in `VITE_ADMIN_TOKEN`
   - Example: If backend has `ADMIN_TOKEN="my-secret-token-123"`, set `VITE_ADMIN_TOKEN="my-secret-token-123"`

3. Update `VITE_API_URL` if your backend runs on a different port/URL

4. Restart your frontend dev server after making changes

## Connecting to Backend in Separate Folder

If your backend is running in a separate folder (e.g., `backend-optimized`):

1. Ensure your backend `.env` has:
   ```env
   ADMIN_TOKEN=your-secret-token-here
   ADMIN_EMAIL=admin@example.com
   ADMIN_NAME=Admin User
   PORT=5000
   ```

2. Set the same token in frontend `.env`:
   ```env
   VITE_ADMIN_TOKEN=your-secret-token-here
   ```

3. If backend runs on a different port, update `VITE_API_URL` or the proxy in `vite.config.ts`

## Notes

- All environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend code
- Changes to `.env` require a server restart to take effect
- Never commit `.env` file to version control
- The `VITE_ADMIN_TOKEN` must **exactly match** the backend `ADMIN_TOKEN` for authentication to work

