# Deployment Guide - Pulse Prom Booking

## Current Issue

You're getting a 404 error because the frontend is deployed but trying to access a backend API that doesn't exist at the deployed URL.

## Solution Options

### Option 1: Deploy Backend (Recommended)

Your backend needs to be deployed and accessible from the internet.

**Popular Backend Hosting Options:**
1. **Railway.app** - Easy deployment for Node.js apps with database
2. **Render.com** - Free tier available, auto-deploys from GitHub
3. **Fly.io** - Good for Node.js apps with PostgreSQL
4. **Heroku** - Classic option (paid)

**Steps:**
1. Deploy your backend to one of the platforms above
2. Note the deployed backend URL (e.g., `https://your-app.railway.app`)
3. In your frontend deployment (Vercel), add environment variable:
   - Variable: `VITE_API_URL`
   - Value: `https://your-backend-url.com/api`
4. Redeploy frontend

### Option 2: Use Local Development Only

If you only want to run locally:
1. Run backend: `cd backend && npm run dev` (runs on port 3001)
2. Run frontend: `cd frontend && npm run dev` (runs on port 5173)
3. Access: `http://localhost:5173`

## Backend Deployment Instructions

### Deploy Backend to Railway.app

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `pulse` repository
4. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start` or `node server.js`
5. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `PORT` - Railway will auto-assign
   - `NODE_ENV` - `production`
   - Add all other env vars from your backend `.env`
6. Deploy and note the public URL

### Configure Frontend on Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-railway-backend-url.com/api`
4. Redeploy frontend

## Current Setup

**Frontend**: Deployed on Vercel ✅
**Backend**: Not deployed ❌ (needs to be deployed)

**Local Development Works**: 
- Backend runs on `http://localhost:3001`
- Frontend proxies `/api` to backend
- Everything works locally

**Production Doesn't Work**:
- Frontend deployed on Vercel
- Backend not deployed, still points to `/api` (which doesn't exist on Vercel)
- Need to deploy backend and configure VITE_API_URL

## Quick Fix for Now

If you want to test locally while you set up backend deployment:

```bash
# Terminal 1 - Run backend
cd backend
npm run dev

# Terminal 2 - Run frontend
cd frontend
npm run dev
```

Then access `http://localhost:5173` instead of the Vercel URL.

## Files Updated

I've updated `/Users/apple/tickets/frontend/src/api/client.ts` to use `VITE_API_URL` environment variable.

**Next Steps:**
1. Deploy your backend to Railway/Render
2. Add `VITE_API_URL` environment variable to Vercel
3. Redeploy frontend
