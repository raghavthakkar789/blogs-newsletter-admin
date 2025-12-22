# Login Error Guide

This document explains all possible login failure scenarios and their solutions.

## Common Login Errors

### 1. "Invalid credentials" (401)
**Causes:**
- Email doesn't exist in the database
- Password is incorrect
- User account was deleted

**Solutions:**
- Verify the email address is correct
- Check if the user exists in the database
- Ensure you're using the correct password
- For default admin: `admin@example.com` / `Admin@123456`

**Code Location:** `backend/src/routes/auth.ts:152`

---

### 2. "Account is locked. Please try again later." (403)
**Causes:**
- 5 or more failed login attempts
- Account is locked for 30 minutes

**Solutions:**
- Wait 30 minutes for the lock to expire
- Admin can reset the user's account:
  ```sql
  UPDATE "User" SET "failedLoginAttempts" = 0, "lockedUntil" = NULL WHERE email = 'user@example.com';
  ```
- Or use the admin panel to unlock the account

**Code Location:** `backend/src/routes/auth.ts:156-159`

---

### 3. "Too many login attempts, please try again later" (429)
**Causes:**
- Rate limiting: More than 5 login attempts in 15 minutes from the same IP

**Solutions:**
- Wait 15 minutes before trying again
- This is a security feature to prevent brute force attacks

**Code Location:** `backend/src/middleware/rateLimit.ts:loginLimiter`

---

### 4. "Account is not active" (403)
**Causes:**
- User account status is `INACTIVE` or `SUSPENDED`
- Account was deactivated by an admin

**Solutions:**
- Contact an admin to activate your account
- Admin can update user status to `ACTIVE`:
  ```sql
  UPDATE "User" SET status = 'ACTIVE' WHERE email = 'user@example.com';
  ```

**Code Location:** `backend/src/middleware/authenticate.ts`

---

### 5. Validation Errors (400)
**Causes:**
- Missing email or password
- Invalid email format
- Empty password field

**Solutions:**
- Ensure both email and password are provided
- Use a valid email format (e.g., `user@example.com`)
- Password cannot be empty

**Code Location:** `backend/src/routes/auth.ts:13-16` (loginSchema)

---

### 6. Database Connection Error
**Causes:**
- `DATABASE_URL` not set or invalid
- Database server is down
- Network connectivity issues

**Solutions:**
- Check `.env` file has valid `DATABASE_URL`
- Verify database server is running
- Test database connection

**Error Message:** Usually shows as "PrismaClientInitializationError" or connection timeout

---

## Login Flow

1. **Request Validation** - Email and password must be provided
2. **Rate Limiting** - Max 5 attempts per 15 minutes
3. **User Lookup** - Find user by email
4. **Account Status Check** - Verify account is not locked
5. **Password Verification** - Compare provided password with stored hash
6. **Failed Attempt Tracking** - Increment counter on failure
7. **Account Locking** - Lock after 5 failed attempts (30 minutes)
8. **Success** - Reset failed attempts, update last login, generate tokens

## Testing Login

### Default Admin Credentials (after seeding)
```
Email: admin@example.com
Password: Admin@123456
```

### Test with curl
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123456"}'
```

### Test with Postman/Insomnia
- Method: POST
- URL: `http://localhost:5000/api/auth/login`
- Body (JSON):
  ```json
  {
    "email": "admin@example.com",
    "password": "Admin@123456"
  }
  ```

## Debugging Steps

1. **Check if user exists:**
   ```bash
   # Using Prisma Studio
   npm run prisma:studio
   # Navigate to User table and check if email exists
   ```

2. **Verify password hash:**
   - Passwords are hashed with bcrypt (12 rounds)
   - Cannot directly compare - must use `comparePassword()` function

3. **Check account status:**
   ```sql
   SELECT email, status, "failedLoginAttempts", "lockedUntil" 
   FROM "User" 
   WHERE email = 'user@example.com';
   ```

4. **Reset failed attempts (Admin only):**
   ```sql
   UPDATE "User" 
   SET "failedLoginAttempts" = 0, "lockedUntil" = NULL 
   WHERE email = 'user@example.com';
   ```

5. **Check server logs:**
   - Look for error messages in the console
   - Check for database connection errors
   - Verify environment variables are loaded

## Security Features

- **Password Hashing:** bcrypt with 12 salt rounds
- **Rate Limiting:** 5 attempts per 15 minutes
- **Account Lockout:** 30 minutes after 5 failed attempts
- **JWT Tokens:** Secure token-based authentication
- **Activity Logging:** All login attempts are logged

## Common Issues

### Issue: "User not found" but user exists
**Solution:** Check email case sensitivity and exact spelling

### Issue: Password always fails
**Solution:** 
- Verify password was hashed correctly during registration
- Check if password contains special characters that need encoding
- Ensure you're using the exact password (case-sensitive)

### Issue: Account locked immediately
**Solution:** 
- Previous failed attempts may have locked the account
- Reset `failedLoginAttempts` and `lockedUntil` in database
- Or wait 30 minutes

### Issue: Can't login after database reset
**Solution:** 
- Run seed script to create default admin:
  ```bash
  npm run prisma:seed
  ```

