# CampusNav

A modern campus navigation app for KIIT University built with React, Vite, and Google Maps API. Features turn-by-turn directions, place autocomplete, and a sleek dark/light theme with glassmorphism UI design.

![CampusNav Preview](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)

## Features

### Navigation
- **Turn-by-turn directions** using Google Directions API
- **Route visualization** with polyline and markers on the map
- **Distance & duration display** for each route
- **Transport mode selection** - Walking, Moped, Driving
- **Auto-refresh routes** when switching transport modes
- **Alternative routes** - compare multiple route options
- **Live location tracking** on the map

### Traffic
- **Real-time traffic layer** showing congestion on roads
- **Traffic-aware routing** with live duration estimates
- **Traffic delay indicators** showing expected delays
- **Traffic legend** with color-coded conditions

### Location Search
- **Google Places Autocomplete** for searching any location
- **Predefined KIIT campus locations** (15 campuses + landmarks)
- **"Use Current Location"** option for both origin and destination
- **GPS geolocation** with high accuracy

### UI/UX
- **Dark/Light theme toggle** for the map
- **Satellite/Map view toggle** for different map styles
- **Glassmorphism UI** with smooth animations
- **Left sidebar layout** for easy navigation
- **Responsive design** for mobile and desktop
- **Custom zoom controls** and recenter button
- **Traffic toggle** to show/hide traffic layer

### KIIT Campus Locations
Pre-configured locations include:
- Campus 1-15 (with school names)
- Central Library
- Convention Center
- KIIT Stadium
- KIMS Hospital
- Food Court

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **@vis.gl/react-google-maps** - Google Maps integration
- **Node.js & Express** - Backend server
- **Google Maps APIs** - Directions, Places, Geocoding

## Architecture

CampusNav uses a client-server architecture to securely manage API keys:

- **Frontend (React + Vite)**: Handles UI and user interactions
- **Backend (Node.js + Express)**: Securely stores Google Maps API key and proxies API requests
- **Google Maps APIs**: Powers mapping, directions, and location services

This architecture ensures your Google Maps API key is never exposed in the client-side code.

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Directions API
  - Places API
  - Geocoding API

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/arghya0003/Campus-Nav.git
cd Campus-Nav
```

#### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```bash
cp .env.example .env
```

Edit `backend/.env` and add your Google Maps API key:
```
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
PORT=3001
```

Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3001`

#### 3. Set up the Frontend

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```bash
cp .env.example .env
```

The frontend `.env` should contain:
```
VITE_API_URL=http://localhost:3001
```

Start the frontend development server:
```bash
npm run dev
```

#### 4. Open the app

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Directions API**
   - **Places API**
   - **Geocoding API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. (Recommended) Restrict the API key:
   - **Application restrictions**: HTTP referrers (for extra security)
   - Add: `http://localhost:5173/*` for development
   - Add your production domain when deploying
6. Copy the key and add it to your `backend/.env` file (NOT frontend)

**Security Note**: The API key is now stored securely in the backend and never exposed in the client-side code.

## Usage

1. **Start Backend**: Run `npm start` in the `backend` directory
2. **Start Frontend**: Run `npm run dev` in the `frontend` directory
3. **Set Origin**: Click the location icon or search for a place
4. **Set Destination**: Search for KIIT campus, building, or any location
5. **Select Transport Mode**: Choose Walking, Moped, or Driving
6. **Get Directions**: Click the button to see the route on the map
7. **Toggle Theme**: Use the sun/moon button to switch between dark and light modes
8. **Enable Traffic**: Toggle traffic view to see real-time traffic conditions

## Scripts

### Backend
| Command | Description |
|---------|-------------|
| `npm start` | Start backend server |
| `npm run dev` | Start backend with auto-reload (Node 18.11+) |

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
Campus-Nav/
├── backend/
│   ├── .env                # API keys (not committed)
│   ├── .env.example        # Template for environment variables
│   ├── package.json        # Backend dependencies
│   └── server.js           # Express server with API proxy endpoints
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── App.css         # Component styles
│   │   ├── api.js          # Backend API client
│   │   ├── index.css       # Global styles & Tailwind config
│   │   └── main.jsx        # React entry point
│   ├── .env                # Frontend config (not committed)
│   ├── .env.example        # Template for frontend environment
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Screenshots

### Dark Mode
The default view with dark map theme and glassmorphism UI.

### Light Mode
Clean light theme for daytime use.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

**Arghya** - [GitHub](https://github.com/arghya0003)
