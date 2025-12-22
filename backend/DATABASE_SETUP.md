# Database Connection Setup

## Common Error: "client password must be a string"

This error occurs when the `DATABASE_URL` environment variable is missing, empty, or has an invalid format.

## Check Your .env File

Make sure you have a `.env` file in the `backend` directory with a valid `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

## Connection String Format

The `DATABASE_URL` must follow this format:

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### Examples:

**Local PostgreSQL:**
```env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/blog_admin"
```

**With special characters in password:**
If your password contains special characters (like `@`, `:`, `/`, `#`, etc.), you need to URL-encode them:

```env
# Password: "p@ssw:rd"
DATABASE_URL="postgresql://postgres:p%40ssw%3Ard@localhost:5432/blog_admin"
```

**Common URL encoding:**
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `#` → `%23`
- `%` → `%25`
- ` ` (space) → `%20`

**Cloud Database (e.g., Supabase, Railway, Neon):**
```env
DATABASE_URL="postgresql://user:password@db.xxxxx.supabase.co:5432/postgres"
```

## Troubleshooting Steps

1. **Verify .env file exists:**
   ```bash
   # In backend directory
   ls -la .env
   # or on Windows
   dir .env
   ```

2. **Check DATABASE_URL is set:**
   ```bash
   # In backend directory
   node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'SET' : 'NOT SET')"
   ```

3. **Test connection string format:**
   - Make sure it starts with `postgresql://` or `postgres://`
   - Verify username and password are present
   - Check that host, port, and database name are correct

4. **Common Issues:**
   - Missing quotes around the connection string
   - Empty password (use empty string `""` if no password)
   - Special characters not URL-encoded
   - Wrong host/port/database name

## Quick Fix

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Update the `DATABASE_URL` with your actual database credentials:
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/blog_admin"
   ```

3. Restart your application

