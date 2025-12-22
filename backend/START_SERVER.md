# Starting the Backend Server

## Quick Start

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   🚀 Server running on port 5000
   📝 Environment: development
   ```

## Troubleshooting

### Error: "ECONNREFUSED" or "Connection refused"

**Cause:** Backend server is not running on port 5000

**Solution:**
1. Make sure you're in the `backend` directory
2. Run `npm run dev`
3. Wait for the server to start (you'll see the success message)
4. Keep this terminal window open while developing

### Error: "Port 5000 already in use"

**Solution:**
1. Find and kill the process using port 5000:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```
2. Or change the port in `.env`:
   ```env
   PORT=5001
   ```
3. Update Vite proxy in `frontend/vite.config.ts` to match

### Error: "DATABASE_URL not set"

**Solution:**
1. Create `.env` file in `backend` directory
2. Copy from `env.example`:
   ```bash
   cp env.example .env
   ```
3. Update `DATABASE_URL` with your database credentials

## Running Both Frontend and Backend

You need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Verification

Once the backend is running, you can test it:

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

