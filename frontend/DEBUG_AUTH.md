# Debugging Authentication Issues

If you're getting "Unauthorized" errors even though `VITE_ADMIN_TOKEN` matches the backend `ADMIN_TOKEN`, follow these steps:

## Step 1: Verify Environment Variables

1. **Check your frontend `.env` file:**
   ```env
   VITE_ADMIN_TOKEN=your-actual-token-here
   ```

2. **Check your backend `.env` file:**
   ```env
   ADMIN_TOKEN=your-actual-token-here
   ```

3. **IMPORTANT:** The tokens must match EXACTLY (including any quotes, spaces, etc.)

## Step 2: Clear localStorage

The frontend might be using a cached token from localStorage. Clear it:

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Find Local Storage → your domain
4. Delete the `accessToken` key
5. Refresh the page

Or run this in the browser console:
```javascript
localStorage.removeItem('accessToken');
location.reload();
```

## Step 3: Restart Dev Servers

**Vite requires a server restart to pick up `.env` changes:**

1. Stop your frontend dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Also restart your backend server

## Step 4: Check Network Tab

In browser DevTools → Network tab:

1. Find a failed request
2. Click on it
3. Go to "Headers" tab
4. Check the "Authorization" header:
   - Should be: `Bearer your-token-here`
   - Verify the token matches your backend `ADMIN_TOKEN`

## Step 5: Check Console Logs

The code now includes debug logging:

- **Frontend:** Check browser console for `[Axios] Using token: ...`
- **Backend:** Check server console for `[AuthGuard] Received token: ...` and `[AuthGuard] Expected token: ...`

## Common Issues

### Issue 1: Quotes in .env file
❌ Wrong:
```env
VITE_ADMIN_TOKEN="my-token-123"
ADMIN_TOKEN="my-token-123"
```

✅ Correct:
```env
VITE_ADMIN_TOKEN=my-token-123
ADMIN_TOKEN=my-token-123
```

### Issue 2: Extra Spaces
❌ Wrong:
```env
VITE_ADMIN_TOKEN= my-token-123 
ADMIN_TOKEN=my-token-123
```

✅ Correct:
```env
VITE_ADMIN_TOKEN=my-token-123
ADMIN_TOKEN=my-token-123
```

### Issue 3: Environment Variable Not Loaded
- Vite only loads `.env` at server start
- Changes require a restart
- Check that `.env` is in the `frontend/` folder (not root)

### Issue 4: localStorage Has Old Token
- The code prioritizes `VITE_ADMIN_TOKEN` but localStorage might have an old value
- Clear localStorage (see Step 2)

## Quick Fix Script

Run this in browser console to debug:

```javascript
// Check current token being used
const envToken = import.meta.env.VITE_ADMIN_TOKEN;
const storedToken = localStorage.getItem('accessToken');
console.log('Env token:', envToken);
console.log('Stored token:', storedToken);
console.log('Token being used:', envToken || storedToken || 'admin-token');

// Clear and reload
localStorage.removeItem('accessToken');
location.reload();
```

## Verify Backend Token

Check what token your backend expects:

1. Look at backend `.env` file
2. Or add a temporary log in `auth.guard.ts`:
   ```typescript
   console.log('Backend expects:', this.configService.get<string>('ADMIN_TOKEN'));
   ```

## Still Not Working?

1. Make sure both frontend and backend `.env` files have the EXACT same token value
2. Restart both servers
3. Clear browser cache and localStorage
4. Check for any CORS issues
5. Verify the Authorization header is being sent (check Network tab)

