# Frontend Environment Variables Setup

Create a `.env` file in the `frontend` directory with the following variables:

```env
# API Base URL
VITE_API_URL=http://localhost:5000

# Environment
VITE_NODE_ENV=development
```

## Variable Descriptions

- **VITE_API_URL**: Backend API base URL (default: http://localhost:5000)
- **VITE_NODE_ENV**: Environment mode (development/production)

## Quick Setup

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update the values if your backend runs on a different port

## Note

All environment variables in Vite must be prefixed with `VITE_` to be accessible in the frontend code.

