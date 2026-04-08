# CampusNav Deployment Guide

## 📋 Overview
- **Backend**: Deploy to Render (Node/Express)
- **Frontend**: Deploy to Vercel (React/Vite)
- **Free Tier**: Yes (Render + Vercel both have free tiers)

---

## 🚀 PHASE 1: Deploy Backend to Render

### Step 1: Prepare Git Repository
```bash
# From project root
git init
git add .
git commit -m "Initial CampusNav deployment"
git branch -M main
```

### Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., `campusnav`)
3. Follow the instructions to push your code

### Step 3: Create Render Account
1. Go to https://render.com
2. Sign up (free)
3. Connect your GitHub account

### Step 4: Create Web Service on Render
1. Click "New +" → "Web Service"
2. Select your `campusnav` GitHub repository
3. Configure:
   - **Name**: `campusnav-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`
   - **Region**: `Oregon` (or closest to you)
   - **Plan**: `Free`

### Step 5: Add Environment Variables in Render
In Render dashboard, go to your service → Environment:
```
PORT=3001
GOOGLE_MAPS_API_KEY=AIzaSyBkGFXg6IwBQ3s0a9FSnw5uYQgmSbZ8Mss
ALLOWED_ORIGIN=(leave blank - we'll fill after Vercel deployment)
```

### Step 6: Deploy
- Render auto-deploys on git push
- Your backend URL will be: `https://campusnav-backend.onrender.com`
- Test it: https://campusnav-backend.onrender.com/api/health

**⏱️ Time to deploy:** 2-3 minutes

---

## 🚀 PHASE 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up (GitHub recommended)
3. Connect your GitHub account

### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Select your `campusnav` repository
3. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables
In Vercel project settings, Environment Variables:
```
VITE_API_BASE_URL=https://campusnav-backend.onrender.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBkGFXg6IwBQ3s0a9FSnw5uYQgmSbZ8Mss
```

### Step 4: Deploy
1. Click "Deploy"
2. Vercel auto-deploys on git push
3. Your frontend URL: `https://campusnav.vercel.app`

**⏱️ Time to deploy:** 2-3 minutes

---

## 🔗 PHASE 3: Connect Frontend to Backend

### Step 1: Update Backend CORS
After frontend is deployed, go to Render dashboard:
1. Backend service → Environment
2. Set `ALLOWED_ORIGIN=https://campusnav.vercel.app`

### Step 2: Update Frontend API Configuration
Make sure `frontend/src/api.js` has:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
```

### Step 3: Test Connection
1. Open https://campusnav.vercel.app
2. Try searching for a location
3. Check browser console for errors (F12)

---

## ✅ Verification Checklist

- [ ] Backend health check works: `https://campusnav-backend.onrender.com/api/health`
- [ ] Frontend loads: `https://campusnav.vercel.app`
- [ ] No CORS errors in browser console
- [ ] Can search for locations
- [ ] Can get directions
- [ ] No 401/403 errors in console

---

## 🆘 Troubleshooting

### CORS Errors
**Error**: `Access to XMLHttpRequest blocked by CORS policy`
**Solution**: Verify `ALLOWED_ORIGIN` is set in Render backend environment

### API Not Responding
**Error**: `Cannot GET /api/maps-key` or timeout
**Solution**: Check Render backend is deployed and running (view logs in dashboard)

### Frontend Won't Load
**Error**: Build failed on Vercel
**Solution**: Check Vercel build logs, ensure `VITE_API_BASE_URL` is set

### Google Maps Not Loading
**Error**: Maps display shows gray area
**Solution**: Verify `VITE_GOOGLE_MAPS_API_KEY` is set and Google Maps API is enabled

---

## 📊 Costs (Estimated)

| Service | Free Tier | Usage/Month |
|---------|-----------|------------|
| Render Backend | $0 (if no DB) | ✅ Free tier works |
| Vercel Frontend | $0 | ✅ Free tier works |
| Google Maps | $200 free credit | ~$5-20 with free tier |
| **Total** | **~$0-20** | Should be free! |

---

## 🎯 Next Steps After Deployment

1. **Monitor**: Check Render & Vercel dashboards for errors
2. **Domain**: Add custom domain in Vercel settings
3. **SSL**: Auto-enabled (HTTPS)
4. **Monitoring**: Set up alerts in Render dashboard
5. **Database**: If needed later, add PostgreSQL to Render

---

## 📚 References
- [Render Deployment Docs](https://render.com/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

