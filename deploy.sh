#!/bin/bash
# CampusNav Quick Deployment Script
# This script helps you deploy to Render + Vercel

echo "🚀 CampusNav Deployment Script"
echo "=============================="
echo ""

# Check if Git is initialized
if [ ! -d ".git" ]; then
  echo "📝 Step 1: Initialize Git"
  read -p "Initialize Git repository? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git init
    git add .
    git commit -m "Initial CampusNav deployment"
    git branch -M main
    echo "✅ Git repository initialized"
  fi
else
  echo "✅ Git repository already initialized"
fi

echo ""
echo "📋 Pre-Deployment Checklist:"
echo "============================="
echo ""
echo "STEP 1: Get Google Maps API Key (if you don't have one)"
echo "  1. Go to: https://console.cloud.google.com/"
echo "  2. Create new project"
echo "  3. Enable APIs: Maps, Directions, Places, Geocoding"
echo "  4. Create API key"
echo "  5. Copy the key"
echo ""
read -p "Do you have a Google Maps API key? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Enter your Google Maps API key: " API_KEY
  # Update backend .env
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|GOOGLE_MAPS_API_KEY=.*|GOOGLE_MAPS_API_KEY=$API_KEY|" backend/.env
  else
    sed -i "s|GOOGLE_MAPS_API_KEY=.*|GOOGLE_MAPS_API_KEY=$API_KEY|" backend/.env
  fi
  echo "✅ Backend .env updated"
fi

echo ""
echo "STEP 2: Push to GitHub"
echo "  1. Create repository at: https://github.com/new"
echo "  2. Run these commands:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/campusnav.git"
echo "     git push -u origin main"
echo ""
read -p "Push to GitHub? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  git push -u origin main
  echo "✅ Pushed to GitHub"
fi

echo ""
echo "STEP 3: Deploy Backend to Render"
echo "  1. Go to: https://render.com"
echo "  2. Sign up (use GitHub)"
echo "  3. Connect GitHub repo"
echo "  4. New Web Service:"
echo "     - Name: campusnav-backend"
echo "     - Build: npm install"
echo "     - Start: npm start"
echo "     - Root: backend"
echo "  5. Add environment variables:"
echo "     - GOOGLE_MAPS_API_KEY"
echo "     - PORT=3001"
echo ""
read -p "Backend deployed? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Enter your Render backend URL (e.g., https://campusnav-backend.onrender.com): " BACKEND_URL
  echo "✅ Backend URL: $BACKEND_URL"
fi

echo ""
echo "STEP 4: Deploy Frontend to Vercel"
echo "  1. Go to: https://vercel.com"
echo "  2. Sign up (use GitHub)"
echo "  3. Import GitHub repo"
echo "  4. Configure:"
echo "     - Framework: Vite"
echo "     - Root: frontend"
echo "     - Build: npm run build"
echo "  5. Environment Variables:"
echo "     - VITE_API_URL=$BACKEND_URL"
echo "     - VITE_GOOGLE_MAPS_API_KEY=$API_KEY"
echo ""
read -p "Frontend deployed? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Enter your Vercel frontend URL (e.g., https://campusnav.vercel.app): " FRONTEND_URL
  echo "✅ Frontend URL: $FRONTEND_URL"
  
  # Update backend CORS
  echo "⚠️  Update backend CORS in Render dashboard:"
  echo "    Set ALLOWED_ORIGIN=$FRONTEND_URL"
fi

echo ""
echo "✅ Deployment Complete!"
echo "=============================="
echo ""
if [ ! -z "$FRONTEND_URL" ]; then
  echo "Frontend: $FRONTEND_URL"
fi
if [ ! -z "$BACKEND_URL" ]; then
  echo "Backend: $BACKEND_URL"
fi
echo ""
echo "Test endpoints:"
echo "  Backend health: ${BACKEND_URL}/api/health"
echo "  Frontend: ${FRONTEND_URL}"
