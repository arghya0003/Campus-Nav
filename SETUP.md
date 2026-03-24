# CampusNav - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Setup Backend (2 mins)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your Google Maps API key
npm start
```

Backend should be running on http://localhost:3001

### Step 2: Setup Frontend (2 mins)
```bash
# Open new terminal
cd frontend
npm install
cp .env.example .env
# No need to edit frontend .env (it's pre-configured)
npm run dev
```

Frontend should be running on http://localhost:5173

### Step 3: Test (1 min)
1. Open http://localhost:5173 in your browser
2. Grant location permissions if prompted
3. Try searching for a location and getting directions

## 🔑 Get Your Google Maps API Key

1. Visit: https://console.cloud.google.com/
2. Create a new project
3. Enable these APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Geocoding API
4. Create an API key
5. Add it to `backend/.env` as `GOOGLE_MAPS_API_KEY=your_key_here`

## 🔒 Security Features

✅ API key stored securely in backend
✅ Never exposed in client-side code
✅ Protected by .gitignore
✅ Backend proxy for all sensitive API calls

## 🐛 Troubleshooting

**Frontend not loading map?**
- Make sure backend is running on port 3001
- Check browser console for errors
- Verify VITE_API_URL in frontend/.env

**Backend not starting?**
- Check if port 3001 is available
- Verify .env file exists in backend/
- Make sure Node.js 18+ is installed

**API key errors?**
- Verify the key is correct in backend/.env
- Check that all required APIs are enabled in Google Cloud
- Remove any spaces or quotes around the key

## 📝 Notes

- Backend must be running for the app to work
- Frontend fetches API key from backend on load
- Both servers need to be running during development
- In production, deploy backend separately and update VITE_API_URL
