import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

// Allow a specific production origin set via env var, or all Vercel preview URLs
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (ALLOWED_ORIGIN && origin === ALLOWED_ORIGIN) return callback(null, true);
    // Allow any Vercel deployment (preview + production)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Validate API key exists
if (!GOOGLE_MAPS_API_KEY) {
  console.error('ERROR: GOOGLE_MAPS_API_KEY is not set in .env file');
  process.exit(1);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CampusNav Backend API is running' });
});

// Get API Key endpoint (for Google Maps JavaScript API - Map display only)
// This is needed for the Map component to work, but we proxy sensitive API calls
app.get('/api/maps-key', (req, res) => {
  res.json({ apiKey: GOOGLE_MAPS_API_KEY });
});

// Proxy endpoint for Google Directions API
app.post('/api/directions', async (req, res) => {
  try {
    const { origin, destination, travelMode, alternatives } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const params = new URLSearchParams({
      origin: typeof origin === 'object' ? `${origin.lat},${origin.lng}` : origin,
      destination: typeof destination === 'object' ? `${destination.lat},${destination.lng}` : destination,
      mode: (travelMode || 'DRIVING').toLowerCase(),
      alternatives: alternatives || 'true',
      key: GOOGLE_MAPS_API_KEY
    });

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Directions API Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch directions',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for Google Places Autocomplete API
app.post('/api/places/autocomplete', async (req, res) => {
  try {
    const { input, location, radius } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const params = new URLSearchParams({
      input,
      key: GOOGLE_MAPS_API_KEY
    });

    if (location) {
      params.append('location', `${location.lat},${location.lng}`);
    }
    if (radius) {
      params.append('radius', radius);
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Places Autocomplete API Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch place suggestions',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for Google Places Details API
app.post('/api/places/details', async (req, res) => {
  try {
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry,name,formatted_address',
      key: GOOGLE_MAPS_API_KEY
    });

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Places Details API Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch place details',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for Google Geocoding API
app.post('/api/geocode', async (req, res) => {
  try {
    const { address, latlng } = req.body;

    if (!address && !latlng) {
      return res.status(400).json({ error: 'Either address or latlng is required' });
    }

    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY
    });

    if (address) {
      params.append('address', address);
    } else {
      params.append('latlng', typeof latlng === 'object' ? `${latlng.lat},${latlng.lng}` : latlng);
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Geocoding API Error:', error.message);
    res.status(500).json({
      error: 'Failed to geocode',
      details: error.response?.data || error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ CampusNav Backend API running on http://localhost:${PORT}`);
  console.log(`🗺️  Google Maps API Key configured: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...`);
});
