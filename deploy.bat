@echo off
REM CampusNav Quick Deployment Script (Windows)
REM This script helps you deploy to Render + Vercel

echo.
echo. 🚀 CampusNav Deployment Script
echo. ==============================
echo.

REM Check if Git is initialized
if not exist .git (
  echo. 📝 Step 1: Initialize Git
  set /p init="Initialize Git repository? (y/n) "
  if /i "%init%"=="y" (
    git init
    git add .
    git commit -m "Initial CampusNav deployment"
    git branch -M main
    echo. ✅ Git repository initialized
  )
) else (
  echo. ✅ Git repository already initialized
)

echo.
echo. 📋 Pre-Deployment Checklist:
echo. =============================
echo.

echo. STEP 1: Get Google Maps API Key (if you don't have one)
echo.   1. Go to: https://console.cloud.google.com/
echo.   2. Create new project
echo.   3. Enable APIs: Maps, Directions, Places, Geocoding
echo.   4. Create API key
echo.   5. Copy the key
echo.

set /p has_key="Do you have a Google Maps API key? (y/n) "

if /i "%has_key%"=="y" (
  set /p api_key="Enter your Google Maps API key: "
  if not "!api_key!"=="" (
    powershell -Command "(Get-Content backend\.env) -replace 'GOOGLE_MAPS_API_KEY=.*', 'GOOGLE_MAPS_API_KEY=!api_key!' | Set-Content backend\.env"
    echo. ✅ Backend .env updated
  )
)

echo.
echo. STEP 2: Push to GitHub
echo.   1. Create repository at: https://github.com/new
echo.   2. Run these commands:
echo.      git remote add origin https://github.com/YOUR_USERNAME/campusnav.git
echo.      git push -u origin main
echo.

set /p push_git="Push to GitHub? (y/n) "

if /i "%push_git%"=="y" (
  git push -u origin main
  echo. ✅ Pushed to GitHub
)

echo.
echo. STEP 3: Deploy Backend to Render
echo.   1. Go to: https://render.com
echo.   2. Sign up (use GitHub)
echo.   3. Connect GitHub repo
echo.   4. New Web Service:
echo.      - Name: campusnav-backend
echo.      - Build: npm install
echo.      - Start: npm start
echo.      - Root: backend
echo.   5. Add environment variables:
echo.      - GOOGLE_MAPS_API_KEY
echo.      - PORT=3001
echo.

set /p backend_ready="Backend deployed? (y/n) "

if /i "%backend_ready%"=="y" (
  set /p backend_url="Enter your Render backend URL (e.g., https://campusnav-backend.onrender.com): "
  echo. ✅ Backend URL: !backend_url!
)

echo.
echo. STEP 4: Deploy Frontend to Vercel
echo.   1. Go to: https://vercel.com
echo.   2. Sign up (use GitHub)
echo.   3. Import GitHub repo
echo.   4. Configure:
echo.      - Framework: Vite
echo.      - Root: frontend
echo.      - Build: npm run build
echo.   5. Environment Variables:
echo.      - VITE_API_URL=!backend_url!
echo.      - VITE_GOOGLE_MAPS_API_KEY=!api_key!
echo.

set /p frontend_ready="Frontend deployed? (y/n) "

if /i "%frontend_ready%"=="y" (
  set /p frontend_url="Enter your Vercel frontend URL (e.g., https://campusnav.vercel.app): "
  echo. ✅ Frontend URL: !frontend_url!
  
  echo.
  echo. ⚠️  Update backend CORS in Render dashboard:
  echo.    Set ALLOWED_ORIGIN=!frontend_url!
)

echo.
echo. ✅ Deployment Complete!
echo. ==============================
echo.

if not "!frontend_url!"=="" (
  echo. Frontend: !frontend_url!
)
if not "!backend_url!"=="" (
  echo. Backend: !backend_url!
)

echo.
echo. Test endpoints:
if not "!backend_url!"=="" (
  echo.   Backend health: !backend_url!/api/health
)
if not "!frontend_url!"=="" (
  echo.   Frontend: !frontend_url!
)

echo.
pause
