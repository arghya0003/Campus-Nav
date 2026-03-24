import { useState, useEffect, useCallback, useRef } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { fetchApiKey } from "./api";

const API_KEY = null; // Will be fetched from backend

const KIIT_CENTER = { lat: 20.3543, lng: 85.8145 };

const TRANSPORT_MODES = [
  { icon: "directions_walk", label: "Walking", mode: "WALKING", color: "#4CAF50" },
  { icon: "two_wheeler", label: "Moped", mode: "TWO_WHEELER", color: "#FF9800" },
  { icon: "directions_car", label: "Driving", mode: "DRIVING", color: "#2196F3" },
];

const MAP_ID = "campus-map";

// Helper function to adjust duration for campus navigation
// Google Maps often overestimates times for short campus distances
function adjustDurationForMode(durationText, mode) {
  // Parse duration like "5 mins" or "1 hour 20 mins"
  const hourMatch = durationText.match(/(\d+)\s*hour/);
  const minMatch = durationText.match(/(\d+)\s*min/);

  let totalMins = 0;
  if (hourMatch) totalMins += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMins += parseInt(minMatch[1]);

  if (totalMins === 0) return durationText;

  // Campus-specific adjustments (Google tends to overestimate for short distances)
  let adjustmentFactor = 1;

  switch (mode) {
    case "TWO_WHEELER":
      // Mopeds are faster on campus - easier parking, can take shortcuts
      adjustmentFactor = 0.7; // 30% faster
      break;
    case "DRIVING":
      // Driving on campus is usually quicker than Google estimates (less traffic)
      adjustmentFactor = 0.85; // 15% faster
      break;
    case "WALKING":
      // Walking estimates are usually accurate
      adjustmentFactor = 1;
      break;
    default:
      adjustmentFactor = 1;
  }

  const adjustedMins = Math.max(1, Math.round(totalMins * adjustmentFactor));

  if (adjustedMins >= 60) {
    const hours = Math.floor(adjustedMins / 60);
    const mins = adjustedMins % 60;
    return mins > 0 ? `${hours} hour ${mins} mins` : `${hours} hour`;
  }
  return `${adjustedMins} mins`;
}

// Predefined KIIT Campus locations
const KIIT_LOCATIONS = [
  { name: "Campus 1", description: "School of Computer Engineering" },
  { name: "Campus 2", description: "School of Electronics" },
  { name: "Campus 3", description: "School of Mechanical Engineering" },
  { name: "Campus 4", description: "School of Civil Engineering" },
  { name: "Campus 5", description: "School of Electrical Engineering" },
  { name: "Campus 6", description: "School of Computer Application" },
  { name: "Campus 7", description: "School of Biotechnology" },
  { name: "Campus 8", description: "School of Management" },
  { name: "Campus 9", description: "School of Law" },
  { name: "Campus 10", description: "School of Humanities" },
  { name: "Campus 11", description: "School of Architecture" },
  { name: "Campus 12", description: "School of Fashion Technology" },
  { name: "Campus 13", description: "School of Film & Media Sciences" },
  { name: "Campus 14", description: "School of Rural Management" },
  { name: "Campus 15", description: "School of Languages" },
  { name: "Central Library", description: "Main Library Building" },
  { name: "Convention Center", description: "KIIT Convention Center" },
  { name: "KIIT Stadium", description: "Sports Complex" },
  { name: "KIMS Hospital", description: "Medical Facility" },
  { name: "Food Court", description: "Main Cafeteria" },
];

// PlaceAutocomplete component with Google Places integration
function PlaceAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  icon,
  iconColor = "text-on-surface-variant",
  onIconClick,
  userLocation,
  onUseCurrentLocation
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const places = useMapsLibrary("places");
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const [campusSuggestions, setCampusSuggestions] = useState([]);

  // Initialize services when places library loads
  useEffect(() => {
    if (!places) return;
    autocompleteService.current = new places.AutocompleteService();
    // We need a map or div for PlacesService
    const div = document.createElement("div");
    placesService.current = new places.PlacesService(div);
  }, [places]);

  // Filter campus suggestions based on input
  useEffect(() => {
    if (!value || value.length === 0) {
      setCampusSuggestions(KIIT_LOCATIONS.slice(0, 5));
    } else {
      const filtered = KIIT_LOCATIONS.filter(
        (loc) =>
          loc.name.toLowerCase().includes(value.toLowerCase()) ||
          loc.description.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 3);
      setCampusSuggestions(filtered);
    }
  }, [value]);

  // Fetch Google Places suggestions when input changes
  useEffect(() => {
    if (!autocompleteService.current || !value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    // Check if value looks like coordinates
    if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(value)) {
      setSuggestions([]);
      return;
    }

    const request = {
      input: value,
      locationBias: {
        center: KIIT_CENTER,
        radius: 5000, // 5km radius around KIIT
      },
      componentRestrictions: { country: "in" },
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions.slice(0, 3));
      } else {
        setSuggestions([]);
      }
    });
  }, [value]);

  // Handle Google Places suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    // Get place details for coordinates
    if (placesService.current) {
      placesService.current.getDetails(
        { placeId: suggestion.place_id, fields: ["geometry"] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            onPlaceSelect({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        }
      );
    }
  };

  // Handle campus location selection
  const handleSelectCampus = (campus) => {
    const searchQuery = `${campus.name}, KIIT University, Bhubaneswar`;
    onChange(searchQuery);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    // Let the directions service resolve this by name
    onPlaceSelect(null);
  };

  // Handle current location selection
  const handleUseCurrentLocation = () => {
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    const totalItems = (onUseCurrentLocation ? 1 : 0) + campusSuggestions.length + suggestions.length;
    if (!showSuggestions || totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      // Determine which item was selected
      let currentIndex = 0;
      if (onUseCurrentLocation) {
        if (selectedIndex === 0) {
          handleUseCurrentLocation();
          return;
        }
        currentIndex = 1;
      }
      if (selectedIndex < currentIndex + campusSuggestions.length) {
        handleSelectCampus(campusSuggestions[selectedIndex - currentIndex]);
        return;
      }
      const googleIndex = selectedIndex - currentIndex - campusSuggestions.length;
      if (suggestions[googleIndex]) {
        handleSelectSuggestion(suggestions[googleIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const hasAnySuggestions = (onUseCurrentLocation && userLocation) || campusSuggestions.length > 0 || suggestions.length > 0;

  return (
    <div className="relative">
      {onIconClick ? (
        <button
          onClick={onIconClick}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors z-10"
          title="Use my current location"
        >
          <span className={`material-symbols-outlined ${iconColor} text-xl`}>
            {icon}
          </span>
        </button>
      ) : (
        <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 ${iconColor} text-xl`}>
          {icon}
        </span>
      )}
      <input
        ref={inputRef}
        className="w-full pl-12 pr-4 py-3 bg-white/5 border-none rounded-2xl text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/40 font-body text-sm outline-none transition-all"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && hasAnySuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-72 overflow-y-auto">
          {/* Use Current Location option */}
          {onUseCurrentLocation && userLocation && (
            <button
              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 border-b border-white/5 ${
                selectedIndex === 0
                  ? "bg-primary/20 text-white"
                  : "text-on-surface hover:bg-white/5"
              }`}
              onClick={handleUseCurrentLocation}
            >
              <span className="material-symbols-outlined text-primary-accent text-lg">
                my_location
              </span>
              <div className="flex-1">
                <p className="font-medium">Use Current Location</p>
                <p className="text-xs text-on-surface-variant">Your GPS location</p>
              </div>
            </button>
          )}

          {/* Campus locations */}
          {campusSuggestions.length > 0 && (
            <>
              <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold bg-white/5">
                KIIT Campus
              </div>
              {campusSuggestions.map((campus, index) => {
                const itemIndex = (onUseCurrentLocation && userLocation ? 1 : 0) + index;
                return (
                  <button
                    key={campus.name}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-start gap-3 ${
                      selectedIndex === itemIndex
                        ? "bg-primary/20 text-white"
                        : "text-on-surface hover:bg-white/5"
                    }`}
                    onClick={() => handleSelectCampus(campus)}
                  >
                    <span className="material-symbols-outlined text-primary-accent text-lg mt-0.5">
                      school
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campus.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {campus.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Google Places suggestions */}
          {suggestions.length > 0 && (
            <>
              <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-on-surface-variant font-bold bg-white/5">
                Other Places
              </div>
              {suggestions.map((suggestion, index) => {
                const itemIndex = (onUseCurrentLocation && userLocation ? 1 : 0) + campusSuggestions.length + index;
                return (
                  <button
                    key={suggestion.place_id}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-start gap-3 ${
                      selectedIndex === itemIndex
                        ? "bg-primary/20 text-white"
                        : "text-on-surface hover:bg-white/5"
                    }`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg mt-0.5">
                      location_on
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {suggestion.structured_formatting?.main_text || suggestion.description}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {suggestion.structured_formatting?.secondary_text || ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// RouteRenderer component - renders polyline and markers on the map
function RouteRenderer({ route, originCoords, destCoords, routeColor = "#00c9a7" }) {
  const map = useMap(MAP_ID);
  const polylineRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous polyline and markers
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
    }

    if (!route || route.length === 0) return;

    // Create the polyline
    polylineRef.current = new google.maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: routeColor,
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map: map,
    });

    // Create origin marker
    if (originCoords) {
      originMarkerRef.current = new google.maps.Marker({
        position: originCoords,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: routeColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "Start",
      });
    }

    // Create destination marker
    if (destCoords) {
      destMarkerRef.current = new google.maps.Marker({
        position: destCoords,
        map: map,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#ff6b6b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          rotation: 180,
        },
        title: "Destination",
      });
    }

    // Fit bounds to show the entire route
    const bounds = new google.maps.LatLngBounds();
    route.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { padding: 80 });

    // Cleanup on unmount
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
      }
      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null);
      }
    };
  }, [map, route, originCoords, destCoords, routeColor]);

  return null;
}

// LiveLocationMarker component - shows user's live position on map
function LiveLocationMarker({ enabled }) {
  const map = useMap(MAP_ID);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!map || !enabled) {
      // Clean up marker when disabled
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Create the live location marker
    markerRef.current = new google.maps.Marker({
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      title: "Your Location",
      zIndex: 999,
    });

    // Start watching position
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          if (markerRef.current) {
            markerRef.current.setPosition(pos);
          }
        },
        (error) => {
          console.error("Live location error:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, enabled]);

  return null;
}

// TrafficLayer component - shows real-time traffic conditions on the map
function TrafficLayer({ enabled }) {
  const map = useMap(MAP_ID);
  const trafficLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    if (enabled) {
      // Create and show traffic layer
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      // Hide traffic layer
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
}

// TrafficLegend component - shows traffic color legend when traffic layer is enabled
function TrafficLegend({ enabled }) {
  if (!enabled) return null;

  const legendItems = [
    { color: "#30ac3e", label: "Fast", description: "Free flowing" },
    { color: "#ffcf00", label: "Moderate", description: "Light traffic" },
    { color: "#ff9500", label: "Slow", description: "Moderate traffic" },
    { color: "#ff0000", label: "Heavy", description: "Heavy congestion" },
    { color: "#9e1313", label: "Severe", description: "Near standstill" },
  ];

  return (
    <div className="absolute bottom-4 right-20 md:right-24 glass-card border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-auto z-20">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-red-400 text-sm">
          traffic
        </span>
        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Traffic
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-1.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[9px] text-on-surface font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapControls({ darkMode, onToggleTheme, mapType, onToggleMapType, trafficEnabled, onToggleTraffic }) {
  const map = useMap(MAP_ID);
  const [locating, setLocating] = useState(false);

  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 16) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 16) - 1);
  };

  const handleRecenter = () => {
    if (!map || !navigator.geolocation) {
      // Fallback to KIIT center if geolocation not available
      if (map) {
        map.panTo(KIIT_CENTER);
        map.setZoom(16);
      }
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.panTo({ lat: latitude, lng: longitude });
        map.setZoom(18);
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback to KIIT center on error
        map.panTo(KIIT_CENTER);
        map.setZoom(16);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="absolute bottom-48 md:bottom-auto md:top-1/2 md:-translate-y-1/2 right-3 md:right-8 flex flex-col gap-2 md:gap-3 pointer-events-auto">
      <div className="flex flex-col glass-card border border-white/5 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 md:w-12 md:h-12 text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-xl md:text-2xl">add</span>
        </button>
        <div className="h-px bg-white/10 mx-2 md:mx-3" />
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 md:w-12 md:h-12 text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-xl md:text-2xl">
            remove
          </span>
        </button>
      </div>
      <button
        onClick={handleRecenter}
        disabled={locating}
        className={`w-10 h-10 md:w-12 md:h-12 glass-card border border-white/5 transition-all flex items-center justify-center rounded-xl md:rounded-2xl shadow-2xl ${
          locating
            ? "text-primary-accent animate-pulse"
            : "text-on-surface-variant hover:text-primary-accent"
        }`}
      >
        <span className="material-symbols-outlined text-xl md:text-2xl">
          my_location
        </span>
      </button>
      {/* Satellite Toggle Button */}
      <button
        onClick={onToggleMapType}
        className="w-10 h-10 md:w-12 md:h-12 glass-card border border-white/5 transition-all flex items-center justify-center rounded-xl md:rounded-2xl shadow-2xl text-on-surface-variant hover:text-primary-accent"
        title={mapType === "roadmap" ? "Switch to Satellite View" : "Switch to Map View"}
      >
        <span className="material-symbols-outlined text-xl md:text-2xl">
          {mapType === "roadmap" ? "satellite_alt" : "map"}
        </span>
      </button>
      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className="w-10 h-10 md:w-12 md:h-12 glass-card border border-white/5 transition-all flex items-center justify-center rounded-xl md:rounded-2xl shadow-2xl text-on-surface-variant hover:text-primary-accent"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <span className="material-symbols-outlined text-xl md:text-2xl">
          {darkMode ? "light_mode" : "dark_mode"}
        </span>
      </button>
      {/* Traffic Layer Toggle Button */}
      <button
        onClick={onToggleTraffic}
        className={`w-10 h-10 md:w-12 md:h-12 glass-card border border-white/5 transition-all flex items-center justify-center rounded-xl md:rounded-2xl shadow-2xl ${
          trafficEnabled
            ? "text-red-400 bg-red-500/10"
            : "text-on-surface-variant hover:text-primary-accent"
        }`}
        title={trafficEnabled ? "Hide Traffic" : "Show Traffic"}
      >
        <span className="material-symbols-outlined text-xl md:text-2xl">
          traffic
        </span>
      </button>
    </div>
  );
}

function App() {
  const [apiKey, setApiKey] = useState(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [activeMode, setActiveMode] = useState(0);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [selectedOriginCoords, setSelectedOriginCoords] = useState(null);
  const [selectedDestCoords, setSelectedDestCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [mapType, setMapType] = useState("roadmap");
  const [directionSteps, setDirectionSteps] = useState([]);
  const [showDirections, setShowDirections] = useState(false);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("campusNavRecentSearches");
    return saved ? JSON.parse(saved) : [];
  });
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [trafficEnabled, setTrafficEnabled] = useState(false);

  // Fetch API key from backend on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await fetchApiKey();
        setApiKey(key);
        setApiKeyLoading(false);
      } catch (err) {
        console.error("Failed to load API key:", err);
        setError("Failed to load map. Please check backend connection.");
        setApiKeyLoading(false);
      }
    };
    loadApiKey();
  }, []);

  // Save recent searches to localStorage
  const addRecentSearch = useCallback((originText, destText) => {
    if (!originText.trim() || !destText.trim()) return;

    const newSearch = {
      id: Date.now(),
      origin: originText,
      destination: destText,
      timestamp: new Date().toISOString(),
    };

    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter(
        (s) => !(s.origin === originText && s.destination === destText)
      );
      // Add new search at the beginning, keep only last 5
      const updated = [newSearch, ...filtered].slice(0, 5);
      localStorage.setItem("campusNavRecentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Load a recent search
  const loadRecentSearch = useCallback((search) => {
    setOrigin(search.origin);
    setDestination(search.destination);
    setSelectedOriginCoords(null);
    setSelectedDestCoords(null);
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("campusNavRecentSearches");
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const toggleMapType = useCallback(() => {
    setMapType((prev) => (prev === "roadmap" ? "hybrid" : "roadmap"));
  }, []);

  const toggleTraffic = useCallback(() => {
    setTrafficEnabled((prev) => !prev);
  }, []);

  // Swap origin and destination
  const handleSwapLocations = useCallback(() => {
    setOrigin(destination);
    setDestination(origin);
    setSelectedOriginCoords(selectedDestCoords);
    setSelectedDestCoords(selectedOriginCoords);
  }, [origin, destination, selectedOriginCoords, selectedDestCoords]);

  // Clear route and reset navigation
  const handleClearRoute = useCallback(() => {
    setRoute([]);
    setRouteInfo(null);
    setDirectionSteps([]);
    setShowDirections(false);
    setOriginCoords(null);
    setDestCoords(null);
    setError("");
    setLiveTrackingEnabled(false);
    setAlternativeRoutes([]);
    setSelectedRouteIndex(0);
  }, []);

  // Select an alternative route
  const handleSelectRoute = useCallback((index) => {
    if (alternativeRoutes[index]) {
      const selectedRoute = alternativeRoutes[index];
      setSelectedRouteIndex(index);
      setRoute(selectedRoute.path);
      setRouteInfo({
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        durationInTraffic: selectedRoute.durationInTraffic,
        trafficDelay: selectedRoute.trafficDelay,
        hasTrafficData: selectedRoute.hasTrafficData,
      });
      setDirectionSteps(selectedRoute.steps);
      setShowDirections(false);
    }
  }, [alternativeRoutes]);

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.log("Geolocation not available:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Handle "Use My Location" button
  const handleUseMyLocation = useCallback(() => {
    if (userLocation) {
      setOrigin(`${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`);
      setSelectedOriginCoords(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          setUserLocation(coords);
          setOrigin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setSelectedOriginCoords(coords);
        },
        (err) => {
          setError("Could not get your location. Please enter it manually.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, [userLocation]);

  // Clear selected coords when user types manually
  const handleOriginChange = (value) => {
    setOrigin(value);
    setSelectedOriginCoords(null);
  };

  const handleDestinationChange = (value) => {
    setDestination(value);
    setSelectedDestCoords(null);
  };

  // Handle "Use My Location" for destination
  const handleUseMyLocationForDestination = useCallback(() => {
    if (userLocation) {
      setDestination(`${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`);
      setSelectedDestCoords(userLocation);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          setUserLocation(coords);
          setDestination(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setSelectedDestCoords(coords);
        },
        (err) => {
          setError("Could not get your location. Please enter it manually.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, [userLocation]);

  // Auto-refresh directions when transport mode changes (if route exists)
  const previousModeRef = useRef(activeMode);
  useEffect(() => {
    if (previousModeRef.current !== activeMode && route.length > 0 && origin && destination) {
      previousModeRef.current = activeMode;
      // Re-fetch directions with new mode
      const fetchNewRoute = async () => {
        setLoading(true);
        setError("");
        setSelectedRouteIndex(0);

        try {
          let originLocation = selectedOriginCoords;
          let destLocation = selectedDestCoords;

          if (!originLocation) {
            const coordMatch = origin.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
            if (coordMatch) {
              originLocation = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
            }
          }

          if (!destLocation) {
            const coordMatch = destination.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
            if (coordMatch) {
              destLocation = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
            }
          }

          const directionsService = new google.maps.DirectionsService();
          const travelMode = TRANSPORT_MODES[activeMode].mode;
          const googleTravelMode = travelMode === "TWO_WHEELER" ? "DRIVING" : travelMode;

          const requestOptions = {
            origin: originLocation || origin,
            destination: destLocation || destination,
            travelMode: google.maps.TravelMode[googleTravelMode],
            provideRouteAlternatives: true,
          };

          // Add driving options for traffic-aware routing
          if (googleTravelMode === "DRIVING") {
            requestOptions.drivingOptions = {
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            };
          }

          const result = await new Promise((resolve, reject) => {
            directionsService.route(requestOptions, (response, status) => {
              if (status === "OK") {
                resolve(response);
              } else {
                reject(new Error(`Directions request failed: ${status}`));
              }
            });
          });

          // Process all routes for alternatives
          const allRoutes = result.routes.map((routeData, index) => {
            const leg = routeData.legs[0];
            const hasTrafficData = leg.duration_in_traffic != null;
            const trafficDuration = hasTrafficData ? leg.duration_in_traffic.text : null;
            const normalDuration = leg.duration.text;

            // Calculate traffic delay if traffic data is available
            let trafficDelay = null;
            if (hasTrafficData) {
              const normalSecs = leg.duration.value;
              const trafficSecs = leg.duration_in_traffic.value;
              const delaySecs = trafficSecs - normalSecs;
              if (delaySecs > 60) {
                const delayMins = Math.round(delaySecs / 60);
                trafficDelay = delayMins >= 60
                  ? `+${Math.floor(delayMins / 60)}h ${delayMins % 60}m delay`
                  : `+${delayMins} min delay`;
              }
            }

            return {
              id: index,
              path: routeData.overview_path.map((point) => ({
                lat: point.lat(),
                lng: point.lng(),
              })),
              distance: leg.distance.text,
              duration: adjustDurationForMode(normalDuration, travelMode),
              durationInTraffic: trafficDuration ? adjustDurationForMode(trafficDuration, travelMode) : null,
              trafficDelay: trafficDelay,
              hasTrafficData: hasTrafficData,
              summary: routeData.summary || `Route ${index + 1}`,
              steps: leg.steps.map((step, stepIndex) => ({
                id: stepIndex,
                instruction: step.instructions,
                distance: step.distance.text,
                duration: step.duration.text,
              })),
            };
          });

          setAlternativeRoutes(allRoutes);

          // Set the first route as selected
          const selectedRoute = allRoutes[0];
          const leg = result.routes[0].legs[0];

          setOriginCoords({
            lat: leg.start_location.lat(),
            lng: leg.start_location.lng(),
          });
          setDestCoords({
            lat: leg.end_location.lat(),
            lng: leg.end_location.lng(),
          });
          setRoute(selectedRoute.path);
          setRouteInfo({
            distance: selectedRoute.distance,
            duration: selectedRoute.duration,
            durationInTraffic: selectedRoute.durationInTraffic,
            trafficDelay: selectedRoute.trafficDelay,
            hasTrafficData: selectedRoute.hasTrafficData,
          });
          setDirectionSteps(selectedRoute.steps);

        } catch (err) {
          console.error("Error getting directions:", err);
          setError(err.message || "Failed to get directions. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchNewRoute();
    }
  }, [activeMode, route.length, origin, destination, selectedOriginCoords, selectedDestCoords]);

  // Get directions between origin and destination
  const handleGetDirections = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      setError("Please enter both origin and destination.");
      return;
    }

    setLoading(true);
    setError("");
    setRoute([]);
    setRouteInfo(null);
    setAlternativeRoutes([]);
    setSelectedRouteIndex(0);

    try {
      // Use pre-selected coordinates if available, otherwise parse coordinates from text
      let originLocation = selectedOriginCoords;
      let destLocation = selectedDestCoords;

      // Parse coordinates if not selected from autocomplete
      if (!originLocation) {
        const coordMatch = origin.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
          originLocation = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
        }
      }

      if (!destLocation) {
        const coordMatch = destination.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
          destLocation = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
        }
      }

      // If we still don't have coordinates, use the text directly in DirectionsService
      // Google Directions can accept place names
      const directionsService = new google.maps.DirectionsService();
      const travelMode = TRANSPORT_MODES[activeMode].mode;
      const googleTravelMode = travelMode === "TWO_WHEELER" ? "DRIVING" : travelMode;

      // Build request with traffic options for driving modes
      const requestOptions = {
        origin: originLocation || origin,
        destination: destLocation || destination,
        travelMode: google.maps.TravelMode[googleTravelMode],
        provideRouteAlternatives: true,
      };

      // Add driving options for traffic-aware routing
      if (googleTravelMode === "DRIVING") {
        requestOptions.drivingOptions = {
          departureTime: new Date(), // Current time for real-time traffic
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        };
      }

      const result = await new Promise((resolve, reject) => {
        directionsService.route(requestOptions, (response, status) => {
          if (status === "OK") {
            resolve(response);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      // Save to recent searches
      addRecentSearch(origin, destination);

      // Process all routes for alternatives
      const allRoutes = result.routes.map((routeData, index) => {
        const leg = routeData.legs[0];
        const hasTrafficData = leg.duration_in_traffic != null;
        const trafficDuration = hasTrafficData ? leg.duration_in_traffic.text : null;
        const normalDuration = leg.duration.text;

        // Calculate traffic delay if traffic data is available
        let trafficDelay = null;
        if (hasTrafficData) {
          const normalSecs = leg.duration.value;
          const trafficSecs = leg.duration_in_traffic.value;
          const delaySecs = trafficSecs - normalSecs;
          if (delaySecs > 60) {
            const delayMins = Math.round(delaySecs / 60);
            trafficDelay = delayMins >= 60
              ? `+${Math.floor(delayMins / 60)}h ${delayMins % 60}m delay`
              : `+${delayMins} min delay`;
          }
        }

        return {
          id: index,
          path: routeData.overview_path.map((point) => ({
            lat: point.lat(),
            lng: point.lng(),
          })),
          distance: leg.distance.text,
          duration: adjustDurationForMode(normalDuration, travelMode),
          durationInTraffic: trafficDuration ? adjustDurationForMode(trafficDuration, travelMode) : null,
          trafficDelay: trafficDelay,
          hasTrafficData: hasTrafficData,
          summary: routeData.summary || `Route ${index + 1}`,
          steps: leg.steps.map((step, stepIndex) => ({
            id: stepIndex,
            instruction: step.instructions,
            distance: step.distance.text,
            duration: step.duration.text,
          })),
        };
      });

      setAlternativeRoutes(allRoutes);

      // Set the first route as selected
      const selectedRoute = allRoutes[0];
      const leg = result.routes[0].legs[0];

      setOriginCoords({
        lat: leg.start_location.lat(),
        lng: leg.start_location.lng(),
      });
      setDestCoords({
        lat: leg.end_location.lat(),
        lng: leg.end_location.lng(),
      });
      setRoute(selectedRoute.path);
      setRouteInfo({
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        durationInTraffic: selectedRoute.durationInTraffic,
        trafficDelay: selectedRoute.trafficDelay,
        hasTrafficData: selectedRoute.hasTrafficData,
      });
      setDirectionSteps(selectedRoute.steps);

    } catch (err) {
      console.error("Error getting directions:", err);
      setError(err.message || "Failed to get directions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [origin, destination, activeMode, selectedOriginCoords, selectedDestCoords, addRecentSearch]);

  // Show loading screen while fetching API key
  if (apiKeyLoading || !apiKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading CampusNav...</p>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="font-body selection:bg-primary selection:text-on-primary">
        {/* Google Map Background */}
        <div className="fixed inset-0 z-0">
          <Map
            id={MAP_ID}
            defaultCenter={KIIT_CENTER}
            defaultZoom={16}
            gestureHandling="greedy"
            disableDefaultUI
            mapTypeId={mapType}
            colorScheme={darkMode ? "DARK" : "LIGHT"}
            className="w-full h-full"
          >
            <RouteRenderer
              route={route}
              originCoords={originCoords}
              destCoords={destCoords}
              routeColor={TRANSPORT_MODES[activeMode].color}
            />
            <LiveLocationMarker enabled={liveTrackingEnabled} />
            <TrafficLayer enabled={trafficEnabled} />
          </Map>
          <TrafficLegend enabled={trafficEnabled} />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent opacity-70 pointer-events-none" />
        </div>

        {/* Main Content */}
        <main className="relative z-10 flex h-[100dvh] overflow-hidden pointer-events-none">
          {/* Left Sidebar Panel */}
          <div className="w-full max-w-sm p-3 md:p-6 flex flex-col pointer-events-none">
            {/* Header */}
            <div className="mb-4 pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary text-xl">
                    explore
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white font-headline m-0">
                    CampusNav
                  </h1>
                  <p className="text-[0.5rem] text-primary-accent font-bold uppercase tracking-[0.2em]">
                    KIIT University
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Card */}
            <div className="glass-card border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col gap-4 pointer-events-auto">
              {/* Origin */}
              <div className="group">
                <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5 ml-1">
                  My Location
                </label>
                <PlaceAutocomplete
                  value={origin}
                  onChange={handleOriginChange}
                  onPlaceSelect={setSelectedOriginCoords}
                  placeholder="Search or use current location"
                  icon="my_location"
                  iconColor="text-primary-accent"
                  onIconClick={handleUseMyLocation}
                  userLocation={userLocation}
                  onUseCurrentLocation={handleUseMyLocation}
                />
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2">
                <button
                  onClick={handleSwapLocations}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  title="Swap origin and destination"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-lg">
                    swap_vert
                  </span>
                </button>
              </div>

              {/* Destination */}
              <div className="group">
                <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5 ml-1">
                  Destination
                </label>
                <PlaceAutocomplete
                  value={destination}
                  onChange={handleDestinationChange}
                  onPlaceSelect={setSelectedDestCoords}
                  placeholder="Search for KIIT campus, building..."
                  icon="flag"
                  userLocation={userLocation}
                  onUseCurrentLocation={handleUseMyLocationForDestination}
                />
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && !origin && !destination && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[9px] text-on-surface-variant hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {recentSearches.slice(0, 3).map((search) => (
                      <button
                        key={search.id}
                        onClick={() => loadRecentSearch(search)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">
                          history
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-on-surface truncate">
                            {search.origin.split(",")[0]}
                          </p>
                          <p className="text-[10px] text-on-surface-variant truncate">
                            → {search.destination.split(",")[0]}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transport Mode */}
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1.5 ml-1">
                  Transport Mode
                </label>
                <div className="flex gap-2">
                  {TRANSPORT_MODES.map((mode, index) => (
                    <button
                      key={mode.icon}
                      onClick={() => setActiveMode(index)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                        activeMode === index
                          ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                          : "bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {mode.icon}
                      </span>
                      <span className="text-[9px] font-bold font-headline uppercase tracking-wider hidden sm:inline">
                        {mode.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Get Directions Button */}
              <button
                onClick={handleGetDirections}
                disabled={loading}
                className={`w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold font-headline text-sm tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/30 uppercase flex items-center justify-center gap-2 ${
                  loading ? "opacity-70 cursor-wait" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">
                      progress_activity
                    </span>
                    Finding Route...
                  </>
                ) : (
                  "Get Directions"
                )}
              </button>

              {/* Route Info & Error Display */}
              {(error || routeInfo) && (
                <div className="mt-1">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3">
                      <span className="material-symbols-outlined text-red-400">
                        error
                      </span>
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  {routeInfo && !error && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-accent text-lg">
                            straighten
                          </span>
                          <span className="text-on-surface text-sm font-medium">
                            {routeInfo.distance}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-accent text-lg">
                            schedule
                          </span>
                          <div className="flex flex-col items-end">
                            <span className="text-on-surface text-sm font-medium">
                              {routeInfo.hasTrafficData && routeInfo.durationInTraffic
                                ? routeInfo.durationInTraffic
                                : routeInfo.duration}
                            </span>
                            {routeInfo.trafficDelay && (
                              <span className="text-orange-400 text-[10px] font-medium">
                                {routeInfo.trafficDelay}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Traffic indicator */}
                      {routeInfo.hasTrafficData && trafficEnabled && (
                        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant bg-white/5 rounded-lg px-2 py-1">
                          <span className="material-symbols-outlined text-sm text-green-400">
                            traffic
                          </span>
                          <span>Live traffic data included</span>
                          {routeInfo.trafficDelay && (
                            <span className="ml-auto text-orange-400 font-medium">
                              {routeInfo.trafficDelay}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-sm">
                            {TRANSPORT_MODES[activeMode].icon}
                          </span>
                          <span>via {TRANSPORT_MODES[activeMode].label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Live Tracking Toggle */}
                          <button
                            onClick={() => setLiveTrackingEnabled((prev) => !prev)}
                            className={`p-1.5 rounded-lg transition-all ${
                              liveTrackingEnabled
                                ? "bg-primary/30 text-primary-accent"
                                : "bg-white/5 text-on-surface-variant hover:bg-white/10"
                            }`}
                            title={liveTrackingEnabled ? "Disable live tracking" : "Enable live tracking"}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {liveTrackingEnabled ? "gps_fixed" : "gps_not_fixed"}
                            </span>
                          </button>
                          {/* Clear Route Button */}
                          <button
                            onClick={handleClearRoute}
                            className="p-1.5 rounded-lg bg-white/5 text-on-surface-variant hover:bg-red-500/20 hover:text-red-400 transition-all"
                            title="Clear route"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Route Alternatives */}
                      {alternativeRoutes.length > 1 && (
                        <div className="pt-2 mt-1 border-t border-white/10">
                          <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">
                            Route Options ({alternativeRoutes.length})
                          </span>
                          <div className="flex flex-col gap-2 mt-2">
                            {alternativeRoutes.map((altRoute, index) => (
                              <button
                                key={altRoute.id}
                                onClick={() => handleSelectRoute(index)}
                                className={`w-full p-2 rounded-lg transition-all text-left ${
                                  selectedRouteIndex === index
                                    ? "bg-primary/30 border border-primary/50"
                                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-on-surface">
                                      {altRoute.hasTrafficData && altRoute.durationInTraffic
                                        ? altRoute.durationInTraffic
                                        : altRoute.duration}
                                    </span>
                                    {altRoute.trafficDelay && (
                                      <span className="text-[8px] text-orange-400 font-medium">
                                        {altRoute.trafficDelay}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-on-surface-variant">
                                    {altRoute.distance}
                                  </span>
                                </div>
                                <div className="text-[8px] text-on-surface-variant truncate mt-0.5">
                                  via {altRoute.summary || `Route ${index + 1}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Turn-by-turn directions toggle */}
                      {directionSteps.length > 0 && (
                        <button
                          onClick={() => setShowDirections((prev) => !prev)}
                          className="flex items-center justify-between w-full pt-2 mt-1 border-t border-white/10 text-on-surface-variant hover:text-white transition-colors"
                        >
                          <span className="text-xs font-medium">
                            {showDirections ? "Hide" : "Show"} directions ({directionSteps.length} steps)
                          </span>
                          <span className="material-symbols-outlined text-sm">
                            {showDirections ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Turn-by-turn Directions Panel */}
              {showDirections && directionSteps.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl max-h-48 overflow-y-auto">
                  {directionSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 flex gap-3 ${
                        index !== directionSteps.length - 1 ? "border-b border-white/5" : ""
                      }`}
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-accent">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm text-on-surface"
                          dangerouslySetInnerHTML={{ __html: step.instruction }}
                        />
                        <div className="flex gap-3 mt-1 text-xs text-on-surface-variant">
                          <span>{step.distance}</span>
                          <span>{step.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map Controls (right side) */}
          <MapControls
            darkMode={darkMode}
            onToggleTheme={toggleTheme}
            mapType={mapType}
            onToggleMapType={toggleMapType}
            trafficEnabled={trafficEnabled}
            onToggleTraffic={toggleTraffic}
          />
        </main>
      </div>
    </APIProvider>
  );
}

export default App;
