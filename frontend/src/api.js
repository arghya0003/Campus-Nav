// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Fetch API key from backend
 * This is needed for the Google Maps component
 */
export async function fetchApiKey() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/maps-key`);
    if (!response.ok) {
      throw new Error('Failed to fetch API key');
    }
    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error('Error fetching API key:', error);
    throw error;
  }
}

/**
 * Get directions from backend (proxied Google Directions API)
 */
export async function getDirections({ origin, destination, travelMode, alternatives = true }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/directions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        travelMode,
        alternatives,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch directions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching directions:', error);
    throw error;
  }
}

/**
 * Get place autocomplete suggestions from backend
 */
export async function getPlaceAutocomplete({ input, location, radius = 50000 }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/places/autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        location,
        radius,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch place suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching place suggestions:', error);
    throw error;
  }
}

/**
 * Get place details from backend
 */
export async function getPlaceDetails(placeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/places/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw error;
  }
}

/**
 * Geocode address or coordinates from backend
 */
export async function geocode({ address, latlng }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        latlng,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to geocode');
    }

    return await response.json();
  } catch (error) {
    console.error('Error geocoding:', error);
    throw error;
  }
}
