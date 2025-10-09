import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaSearchLocation, FaCrosshairs, FaCheck, FaTimes, FaTrash } from "react-icons/fa";

const LocationPicker = ({ locationValue, addressValue, onLocationChange, onAddressChange, onCoordinatesChange }) => {
  const [showMap, setShowMap] = useState(false);
  const [locationQuery, setLocationQuery] = useState(locationValue || "");
  const [addressQuery, setAddressQuery] = useState(addressValue || "");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isPickingMode, setIsPickingMode] = useState(false);

  // Sync with external props
  useEffect(() => {
    if (locationValue !== locationQuery) {
      setLocationQuery(locationValue || "");
    }
  }, [locationValue, locationQuery]);

  useEffect(() => {
    if (addressValue !== addressQuery) {
      setAddressQuery(addressValue || "");
    }
  }, [addressValue, addressQuery]);

  // Predefined locations for quick selection
  const predefinedLocations = [
    { name: "Kochi, Kerala", lat: 9.9312, lng: 76.2673, area: "Kochi" },
    { name: "Ernakulam, Kerala", lat: 10.0261, lng: 76.3125, area: "Ernakulam" },
    { name: "Thrissur, Kerala", lat: 10.5276, lng: 76.2144, area: "Thrissur" },
    { name: "Alappuzha, Kerala", lat: 9.4981, lng: 76.3388, area: "Alappuzha" },
    { name: "Kozhikode, Kerala", lat: 11.2588, lng: 75.7804, area: "Kozhikode" },
    { name: "Thiruvananthapuram, Kerala", lat: 8.5241, lng: 76.9366, area: "Thiruvananthapuram" },
    { name: "Kottayam, Kerala", lat: 9.5916, lng: 76.5222, area: "Kottayam" },
    { name: "Palakkad, Kerala", lat: 10.7867, lng: 76.6548, area: "Palakkad" }
  ];

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setCoordinates({ lat, lng });
          
          // Update only the address field with coordinates
          try {
            const addressName = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
            setAddressQuery(addressName);
            onAddressChange(addressName);
          } catch (error) {
            console.error("Error updating address with coordinates:", error);
          }
          
          if (onCoordinatesChange) {
            onCoordinatesChange({ lat, lng });
          }
          
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unable to get your current location. ";
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access was denied. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
              break;
          }
          
          alert(errorMessage + " Please enter manually or select from predefined locations.");
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      alert("Geolocation is not supported by this browser. Please enter location manually or select from predefined locations.");
      setIsLoadingLocation(false);
    }
  };

  // Handle predefined location selection
  const selectPredefinedLocation = (location) => {
    setLocationQuery(location.area);
    setAddressQuery(location.name);
    setCoordinates({ lat: location.lat, lng: location.lng });
    setSelectedLocation(location);
    onLocationChange(location.area);
    onAddressChange(location.name);
    
    if (onCoordinatesChange) {
      onCoordinatesChange({ lat: location.lat, lng: location.lng });
    }
  };

  // Handle manual location input
  const handleLocationInputChange = (e) => {
    const newValue = e.target.value;
    console.log("LocationPicker: Location changed to:", newValue);
    setLocationQuery(newValue);
    onLocationChange(newValue);
  };

  // Handle manual address input
  const handleAddressInputChange = (e) => {
    const newValue = e.target.value;
    console.log("LocationPicker: Address changed to:", newValue);
    setAddressQuery(newValue);
    onAddressChange(newValue);
  };

  // Generate map URL for preview
  const getMapUrl = () => {
    if (mapSearchQuery.trim()) {
      // Search mode - show search results
      return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapSearchQuery)}&zoom=14`;
    } else if (coordinates.lat && coordinates.lng) {
      // Coordinate mode - show specific location
      return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coordinates.lat},${coordinates.lng}&zoom=15`;
    }
    return null;
  };

  // Search for location in map (just sets the search query for map display)
  const handleMapSearch = (query) => {
    console.log('Setting map search query to:', query);
    setMapSearchQuery(query);
  };

  // Fallback coordinates for common locations in Kerala
  const getKeralaFallbackCoordinates = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Common football turfs and sports venues in Kerala
    const fallbackLocations = {
      'maithanam': { lat: 10.2258, lng: 76.4097, name: 'Maithanam Football Turf Court' },
      'football turf court': { lat: 10.2258, lng: 76.4097, name: 'Football Turf Court' },
      'kochi': { lat: 9.9312, lng: 76.2673, name: 'Kochi' },
      'ernakulam': { lat: 10.0261, lng: 76.3125, name: 'Ernakulam' },
      'thrissur': { lat: 10.5276, lng: 76.2144, name: 'Thrissur' },
      'kozhikode': { lat: 11.2588, lng: 75.7804, name: 'Kozhikode' },
      'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram' },
      'alappuzha': { lat: 9.4981, lng: 76.3388, name: 'Alappuzha' },
      'kottayam': { lat: 9.5916, lng: 76.5222, name: 'Kottayam' },
      'palakkad': { lat: 10.7867, lng: 76.6548, name: 'Palakkad' }
    };
    
    // Check if query matches any fallback location
    for (const [key, coords] of Object.entries(fallbackLocations)) {
      if (lowerQuery.includes(key)) {
        return coords;
      }
    }
    
    return null;
  };

  // Separate function to extract coordinates from search result
  const extractSearchResultCoordinates = async (query) => {
    console.log('Attempting to get coordinates for:', query);
    
    // First, try fallback coordinates for common Kerala locations
    const fallbackCoords = getKeralaFallbackCoordinates(query);
    if (fallbackCoords) {
      console.log('Using fallback coordinates for:', query);
      
      setCoordinates({ lat: fallbackCoords.lat, lng: fallbackCoords.lng });
      
      const addressName = `Lat: ${fallbackCoords.lat.toFixed(6)}, Lng: ${fallbackCoords.lng.toFixed(6)}`;
      setAddressQuery(addressName);
      onAddressChange(addressName);
      
      const businessName = query.includes('TURF') || query.includes('COURT') || query.includes('STADIUM') 
        ? query 
        : fallbackCoords.name;
      setLocationQuery(businessName);
      onLocationChange(businessName);
      
      if (onCoordinatesChange) {
        onCoordinatesChange({ lat: fallbackCoords.lat, lng: fallbackCoords.lng });
      }
      
      console.log(`✅ Fallback coordinates used: ${fallbackCoords.lat.toFixed(6)}, ${fallbackCoords.lng.toFixed(6)}`);
      return true;
    }
    
    // Try to get coordinates from search query using geocoding
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`);
      
      // Check if request was blocked
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Geocoding API response:', data);
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const searchCoords = { lat: location.lat, lng: location.lng };
        
        console.log('Geocoding successful:', {
          query,
          coordinates: searchCoords,
          formatted_address: data.results[0].formatted_address
        });
        
        // Set coordinates from search result
        setCoordinates(searchCoords);
        
        // Update address field with coordinates format (matching the expected format)
        const addressName = `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`;
        setAddressQuery(addressName);
        onAddressChange(addressName);
        
        // Also update location field with the business name
        const businessName = query.includes('TURF') || query.includes('COURT') || query.includes('STADIUM') 
          ? query 
          : data.results[0].formatted_address.split(',')[0];
        setLocationQuery(businessName);
        onLocationChange(businessName);
        
        // Notify parent component
        if (onCoordinatesChange) {
          onCoordinatesChange(searchCoords);
        }
        
        console.log(`✅ Coordinates updated: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
        console.log('✅ Address field updated to:', addressName);
        console.log('✅ Location field updated to:', businessName);
        
        return true; // Success
      } else {
        console.warn('❌ No geocoding results found for:', query);
        console.log('API response status:', data.status);
        return false; // Failed
      }
    } catch (error) {
      console.error('❌ Geocoding request failed (likely blocked by browser/adblocker):', error);
      
      // Show user-friendly message about the blocking issue
      alert(`🚫 Location lookup was blocked by your browser or ad blocker.\n\n✅ Solution: Use "Pick Custom Location" mode to click on the map, or enter coordinates manually.\n\n💡 For "${query}", you can also try searching for just the city name like "Kochi" or "Ernakulam".`);
      
      return false; // Failed
    }
  };

  // Handle map confirmation
  const confirmLocation = () => {
    // Update the Location Coordinates field with current coordinates
    if (coordinates.lat && coordinates.lng) {
      const addressName = `Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}`;
      setAddressQuery(addressName);
      onAddressChange(addressName);
      
      // Notify parent component of coordinate change
      if (onCoordinatesChange) {
        onCoordinatesChange(coordinates);
      }
      
      console.log(`Location confirmed: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
    }
    
    setShowMap(false);
  };

  // Clear location
  const clearLocation = () => {
    setLocationQuery("");
    setAddressQuery("");
    setCoordinates({ lat: null, lng: null });
    setSelectedLocation(null);
    onLocationChange("");
    onAddressChange("");
    if (onCoordinatesChange) {
      onCoordinatesChange({ lat: null, lng: null });
    }
  };

  return (
    <div className="space-y-4">
      {/* Location (City/Area) Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location/City *
        </label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={locationQuery}
            onChange={handleLocationInputChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Enter city/area (e.g., Kochi, Ernakulam)"
            required
          />
        </div>
      </div>

      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location Coordinates *
        </label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
          <textarea
            value={addressQuery}
            onChange={handleAddressInputChange}
            rows="2"
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
            placeholder="Lat: 10.2258, Lng: 76.4097 or complete address"
            required
          />
        </div>
      </div>

      {/* Location Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
        >
          <FaCrosshairs className={isLoadingLocation ? "animate-spin" : ""} />
          {isLoadingLocation ? "Getting Location..." : "Use Current Location"}
        </button>
        
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-blue-500/30 transition-colors"
        >
          <FaSearchLocation />
          {showMap ? "Hide Map" : "Show Map"}
        </button>

        {(locationQuery || addressQuery) && (
          <button
            type="button"
            onClick={clearLocation}
            className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
          >
            <FaTrash />
            Clear
          </button>
        )}
      </div>

      {/* Predefined Locations */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-2">Quick Select:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {predefinedLocations.map((location, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectPredefinedLocation(location)}
              className={`p-2 text-xs rounded-lg border transition-colors ${
                selectedLocation?.name === location.name
                  ? "bg-emerald-500/30 text-emerald-300 border-emerald-500/50"
                  : "bg-gray-700/30 text-gray-300 border-gray-600 hover:bg-gray-600/30"
              }`}
            >
              {location.area}
            </button>
          ))}
        </div>
      </div>

      {/* Coordinates Display */}
      {coordinates.lat && coordinates.lng && (
        <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
          <p className="text-sm text-gray-300 mb-1">Coordinates:</p>
          <p className="text-xs text-gray-400">
            Latitude: {coordinates.lat.toFixed(6)}, Longitude: {coordinates.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Map View */}
      {showMap && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-white">Interactive Map</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmLocation}
                disabled={!coordinates.lat || !coordinates.lng}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                  coordinates.lat && coordinates.lng
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-gray-500/20 text-gray-500 border border-gray-500/50 cursor-not-allowed'
                }`}
              >
                <FaCheck /> {coordinates.lat && coordinates.lng ? 'Confirm Location' : 'No Location Set'}
              </button>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="flex items-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors"
              >
                <FaTimes /> Close
              </button>
            </div>
          </div>

          {/* Map Search */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FaSearchLocation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleMapSearch(e.target.value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Search location in map (e.g., Kochi, Stadium Road)"
                />
              </div>
              <button
                onClick={() => handleMapSearch(mapSearchQuery)}
                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Map Controls */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                e.stopPropagation(); // Stop event bubbling
                setIsPickingMode(!isPickingMode);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isPickingMode 
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' 
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30'
              }`}
            >
              <FaMapMarkerAlt />
              {isPickingMode ? 'Exit Pick Mode' : 'Pick Custom Location'}
            </button>
            
            {mapSearchQuery && (
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event bubbling
                  
                  console.log('🔍 Use Search Result clicked for:', mapSearchQuery);
                  const success = await extractSearchResultCoordinates(mapSearchQuery);
                  
                  if (success) {
                    console.log('✅ Search result coordinates loaded successfully!');
                  } else {
                    console.log('❌ Failed to load coordinates from search result');
                    alert('Could not find coordinates for this location. Try a different search term or use custom location picking.');
                  }
                }}
                className="flex items-center gap-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                <FaSearchLocation />
                Use Search Result
              </button>
            )}
            
            {coordinates.lat && coordinates.lng && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Stop event bubbling
                  setMapSearchQuery('');
                  // This will refresh the map to show the current coordinates
                }}
                className="bg-gray-500/20 text-gray-400 border border-gray-500/50 px-4 py-2 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Show Current Location
              </button>
            )}
            
            {!isPickingMode && !mapSearchQuery && (
              <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-lg">
                <span className="text-blue-400 text-sm">💡 Search for businesses or use "Pick Custom Location"</span>
              </div>
            )}
            
            {!isPickingMode && mapSearchQuery && (
              <div className="bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-lg">
                <span className="text-purple-400 text-sm">🏢 Business found! Click "Use Search Result" to get its coordinates</span>
              </div>
            )}
            
            {isPickingMode && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg">
                <span className="text-emerald-400 text-sm">🎯 Custom Pick Mode: Click anywhere on map to set coordinates</span>
              </div>
            )}
          </div>

          {getMapUrl() ? (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-600">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={getMapUrl()}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Preview"
              ></iframe>
              
              {/* Conditional clickable overlay - only in picking mode */}
              {isPickingMode && (
                <div 
                  className="absolute inset-0 bg-emerald-500/10 cursor-crosshair border-2 border-emerald-500/50"
                  onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  // Convert pixel coordinates to approximate lat/lng
                  // This is a simplified conversion - in production, use proper map projection
                  const centerLat = coordinates.lat || 10.0;
                  const centerLng = coordinates.lng || 76.0;
                  
                  // Approximate conversion (not precise, but functional for demo)
                  const latOffset = (y - rect.height / 2) * -0.001; // Negative because Y increases downward
                  const lngOffset = (x - rect.width / 2) * 0.001;
                  
                  const newLat = centerLat + latOffset;
                  const newLng = centerLng + lngOffset;
                  
                  // Update coordinates
                  const newCoords = { lat: newLat, lng: newLng };
                  setCoordinates(newCoords);
                  
                  // Update address field
                  const addressName = `Lat: ${newLat.toFixed(6)}, Lng: ${newLng.toFixed(6)}`;
                  setAddressQuery(addressName);
                  onAddressChange(addressName);
                  
                  // Notify parent component
                  if (onCoordinatesChange) {
                    onCoordinatesChange(newCoords);
                  }
                  
                  // Exit pick mode after selection
                  setIsPickingMode(false);
                  
                  console.log(`Location picked: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
                }}
                title="Click anywhere on map to set coordinates"
              >
                {/* Visual indicators for picking mode */}
                <div className="absolute top-2 left-2 bg-emerald-500/90 text-white px-3 py-1 rounded text-sm font-semibold">
                  🎯 Pick Mode Active
                </div>
                <div className="absolute bottom-2 left-2 bg-black/80 text-white px-3 py-1 rounded text-xs">
                  Click anywhere to set coordinates
                </div>
                <div className="absolute top-2 right-2 bg-black/80 text-white px-3 py-1 rounded text-xs">
                  Click "Exit Pick Mode" to navigate normally
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-700/30 rounded-lg border border-gray-600 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <FaMapMarkerAlt className="text-4xl mb-2 mx-auto" />
                <p>Select a location to view on map</p>
              </div>
            </div>
          )}

          {/* Manual Coordinate Input */}
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <p className="text-sm font-medium text-gray-300 mb-3">Manual Coordinate Entry:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={coordinates.lat || ''}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value);
                    const newCoords = { ...coordinates, lat: isNaN(lat) ? null : lat };
                    setCoordinates(newCoords);
                    if (onCoordinatesChange && newCoords.lat && newCoords.lng) {
                      onCoordinatesChange(newCoords);
                      setAddressQuery(`Lat: ${newCoords.lat.toFixed(6)}, Lng: ${newCoords.lng.toFixed(6)}`);
                      onAddressChange(`Lat: ${newCoords.lat.toFixed(6)}, Lng: ${newCoords.lng.toFixed(6)}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                  placeholder="10.2258"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={coordinates.lng || ''}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value);
                    const newCoords = { ...coordinates, lng: isNaN(lng) ? null : lng };
                    setCoordinates(newCoords);
                    if (onCoordinatesChange && newCoords.lat && newCoords.lng) {
                      onCoordinatesChange(newCoords);
                      setAddressQuery(`Lat: ${newCoords.lat.toFixed(6)}, Lng: ${newCoords.lng.toFixed(6)}`);
                      onAddressChange(`Lat: ${newCoords.lat.toFixed(6)}, Lng: ${newCoords.lng.toFixed(6)}`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white text-sm"
                  placeholder="76.4097"
                />
              </div>
            </div>
          </div>

          {/* Map Instructions */}
          <div className="mt-3 text-xs text-gray-400">
            <p>💡 Tip: Search locations in the map, click anywhere on the map to set coordinates, or enter coordinates manually above.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
