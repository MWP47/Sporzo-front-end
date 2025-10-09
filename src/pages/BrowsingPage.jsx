// TurfBrowse.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import Header from '../components/Header';
import { getUserLocation, getCurrentWeather } from '../services/weatherService';
import turfService from '../services/turfService';

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

const TurfBrowse = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [favorites, setFavorites] = useState(new Set());

  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedType, setSelectedType] = useState('all');
  const [availableNow, setAvailableNow] = useState(false);
  
  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Turf data with images and details
  const turfImages = [
    "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
    "https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800",
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
  ];

  const [turfs, setTurfs] = useState([]);

  const loadAllTurfs = async () => {
    try {
      // Only load owner-created turfs from localStorage as fallback
      const ownerTurfs = JSON.parse(localStorage.getItem("ownerTurfs")) || [];
      const processedOwnerTurfs = ownerTurfs.map(turf => {
        // Calculate distance from user location
        let distance = 0;
        if (userLocation && turf.coordinates) {
          distance = calculateDistance(
            userLocation.lat, 
            userLocation.lon, 
            turf.coordinates.lat, 
            turf.coordinates.lng
          );
        }

        return {
          ...turf,
          // Use main image if available
          image: turf.images && turf.images.length > 0 
            ? turf.images[turf.mainImageIndex || 0] || turf.images[0]
            : turf.image || turfImages[0],
          // Calculate price range
          priceRange: calculateTurfPriceRange(turf),
          isPremium: turf.fieldConfigurations && turf.fieldConfigurations.length > 2,
          isAvailable: true,
          distance: distance,
          phone: turf.phone || `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`,
          isDemo: false
        };
      });

      // Remove duplicates and set turfs
      const uniqueTurfs = removeDuplicateTurfs(processedOwnerTurfs);
      setTurfs(uniqueTurfs);
      setFilteredTurfs(uniqueTurfs);
    } catch (error) {
      console.error('Error loading fallback turfs:', error);
      setTurfs([]);
      setFilteredTurfs([]);
    }
  };

  // Create a compact version of turfs for caching to avoid exceeding storage quota
  const compactTurfs = (list) => {
    return (list || []).map(t => {
      const priceRange = t.priceRange || calculateTurfPriceRange(t);
      const image = t.image || (Array.isArray(t.images) && t.images.length > 0 ? (t.images[t.mainImageIndex || 0] || t.images[0]) : turfImages[0]);
      
      // Calculate distance from user location if coordinates are available
      let distance = 0;
      if (userLocation && t.coordinates) {
        distance = calculateDistance(
          userLocation.lat, 
          userLocation.lon, 
          t.coordinates.lat, 
          t.coordinates.lng
        );
      } else if (typeof t.distance === 'number') {
        distance = t.distance;
      }
      
      return {
        _id: t._id,
        turfId: t.turfId,
        id: t.id,
        name: t.name,
        location: t.location,
        image,
        rating: typeof t.rating === 'number' ? t.rating : 0,
        isPremium: !!(t.fieldConfigurations && t.fieldConfigurations.length > 2),
        isAvailable: t.isAvailable !== undefined ? t.isAvailable : true,
        distance: distance,
        priceRange,
        // Use min price for card display where `price` is expected
        price: priceRange && typeof priceRange.min === 'number' ? priceRange.min : (t.price || 0),
        isBackendTurf: t.isBackendTurf === true ? true : true
      };
    });
  };

  const safeCacheTurfs = (key, turfsList) => {
    try {
      // Limit number of items to reduce payload size
      const payload = compactTurfs(turfsList).slice(0, 100);
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('Skipping caching turfs due to storage limits:', e?.message || e);
    }
  };

  const calculateTurfPriceRange = (turf) => {
    if (!turf.fieldConfigurations || turf.fieldConfigurations.length === 0) {
      return { min: turf.price || 0, max: turf.price || 0 };
    }

    const allPrices = [];
    turf.fieldConfigurations.forEach(config => {
      const pricing = config.pricing || {};
      if (pricing.dayPrice) allPrices.push(parseInt(pricing.dayPrice));
      if (pricing.nightPrice) allPrices.push(parseInt(pricing.nightPrice));
      if (pricing.peakPrice) allPrices.push(parseInt(pricing.peakPrice));
      if (allPrices.length === 0 && config.price) allPrices.push(parseInt(config.price));
    });

    if (allPrices.length === 0) return { min: turf.price || 0, max: turf.price || 0 };
    
    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices)
    };
  };
  const [filteredTurfs, setFilteredTurfs] = useState([]);

  // Fetch user location and load turfs on component mount
  useEffect(() => {
    fetchUserLocation();
    loadTurfsFromBackend();
  }, []);

  // Recalculate distances when user location changes
  useEffect(() => {
    if (userLocation && turfs.length > 0) {
      const turfsWithUpdatedDistance = turfs.map(turf => {
        let distance = 0;
        if (turf.coordinates) {
          distance = calculateDistance(
            userLocation.lat, 
            userLocation.lon, 
            turf.coordinates.lat, 
            turf.coordinates.lng
          );
        }
        return { ...turf, distance };
      });
      setTurfs(turfsWithUpdatedDistance);
    }
  }, [userLocation]);

  const loadTurfsFromBackend = async () => {
    // Show cached backend data immediately if available
    try {
      const cached = sessionStorage.getItem('turfs_cache_all');
      if (cached) {
        const parsed = JSON.parse(cached);
        const backendOnly = Array.isArray(parsed) ? parsed.filter(t => t && t.isBackendTurf === true) : [];
        // Recalculate distances for cached turfs if user location is available
        const turfsWithDistance = backendOnly.map(turf => {
          let distance = turf.distance || 0;
          if (userLocation && turf.coordinates) {
            distance = calculateDistance(
              userLocation.lat, 
              userLocation.lon, 
              turf.coordinates.lat, 
              turf.coordinates.lng
            );
          }
          return { ...turf, distance };
        });
        const uniqueTurfs = removeDuplicateTurfs(turfsWithDistance);
        setTurfs(uniqueTurfs);
        setFilteredTurfs(uniqueTurfs);
      }
    } catch { /* ignore cache errors */ }

    try {
      const result = await turfService.getAllTurfs();
      if (result.success) {
        // Calculate distances for all turfs from backend
        const turfsWithDistance = result.turfs.map(turf => {
          let distance = 0;
          if (userLocation && turf.coordinates) {
            distance = calculateDistance(
              userLocation.lat, 
              userLocation.lon, 
              turf.coordinates.lat, 
              turf.coordinates.lng
            );
          }
          return { ...turf, distance };
        });
        
        const uniqueTurfs = removeDuplicateTurfs(turfsWithDistance);
        setTurfs(uniqueTurfs);
        setFilteredTurfs(uniqueTurfs);
        // Cache compact version safely
        safeCacheTurfs('turfs_cache_all', uniqueTurfs);
      } else {
        // keep whatever is currently shown (cache or empty) — do not show fake turfs
      }
    } catch (error) {
      console.error('Error loading turfs from backend:', error);
      // keep cache/empty — do not fall back to fake turfs
    }
  };

  const removeDuplicateTurfs = (turfs) => {
    const seen = new Set();
    return turfs.filter(turf => {
      // Create a unique identifier for each turf
      const identifier = `${turf.id}-${turf.name}-${turf.location}`;
      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });
  };

  const fetchUserLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);

      // Get current weather to extract location name
      const currentWeather = await getCurrentWeather(location.lat, location.lon);
      
      if (currentWeather && currentWeather.location) {
        setLocationName(location.isDefault ? `${currentWeather.location} (Default)` : currentWeather.location);
      } else {
        setLocationName(location.isDefault ? 'Kochi, India (Default)' : 'Your Location');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocationName('Location unavailable');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    let filtered = turfs.filter(turf => {
      // Search filter
      if (searchQuery && 
          !turf.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !turf.location.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Location filter
      if (selectedLocation && turf.location !== selectedLocation) return false;
      
      // Type filter
      if (selectedType === 'premium' && !turf.isPremium) return false;
      if (selectedType === 'regular' && turf.isPremium) return false;
      
      // Availability filter
      if (availableNow && !turf.isAvailable) return false;
      
      // Price range filter
      const turfPrice = turf.priceRange ? turf.priceRange.min : turf.price;
      if (turfPrice < priceRange[0] || turfPrice > priceRange[1]) return false;
      
      // Rating filter
      if (selectedRating > 0 && turf.rating < selectedRating) return false;
      
      return true;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance': 
          return a.distance - b.distance;
        case 'price-low': 
          const priceA = a.priceRange ? a.priceRange.min : a.price;
          const priceB = b.priceRange ? b.priceRange.min : b.price;
          return priceA - priceB;
        case 'price-high': 
          const priceHighA = a.priceRange ? a.priceRange.max : a.price;
          const priceHighB = b.priceRange ? b.priceRange.max : b.price;
          return priceHighB - priceHighA;
        case 'rating': 
          return b.rating - a.rating;
        default: 
          return 0;
      }
    });

    setFilteredTurfs(filtered);
  }, [searchQuery, selectedLocation, sortBy, selectedType, availableNow, priceRange, selectedRating, turfs]);

  const toggleFavorite = (turfId) => {
    const newFavorites = new Set(favorites);
    newFavorites.has(turfId) ? newFavorites.delete(turfId) : newFavorites.add(turfId);
    setFavorites(newFavorites);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setPriceRange([0, 5000]);
    setSelectedRating(0);
    setSelectedType('all');
    setAvailableNow(false);
  };

  const TurfCard = ({ turf }) => (
    <div className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:scale-105 hover:border-emerald-500/50">
      <div className="relative">
        <img src={turf.image} alt={turf.name} className="w-full h-48 object-cover" />
        {turf.isPremium && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            PREMIUM
          </span>
        )}
        {turf.isAvailable ? (
          <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            Available Now
          </span>
        ) : (
          <span className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            Busy
          </span>
        )}
        <div className="absolute bottom-4 left-4 flex items-center bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
          <span className="font-semibold text-white">{turf.rating && !isNaN(turf.rating) ? turf.rating.toFixed(1) : '0.0'}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2 text-white">{turf.name}</h3>
        <p className="text-gray-400 mb-1 text-sm">{turf.location || turf.address || 'Location not available'} • {turf.distance && !isNaN(turf.distance) ? turf.distance.toFixed(1) : '0.0'} km away</p>
        
        {/* Field Types */}
        {turf.fieldConfigurations && turf.fieldConfigurations.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {turf.fieldConfigurations.map((config, index) => (
                <span
                  key={index}
                  className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-medium border border-emerald-500/30"
                >
                  {config.type}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div>
            {turf.priceRange && turf.priceRange.min !== turf.priceRange.max ? (
              <span className="text-2xl font-bold text-emerald-400">₹{turf.priceRange.min} - ₹{turf.priceRange.max}</span>
            ) : (
              <span className="text-2xl font-bold text-emerald-400">₹{turf.priceRange?.min || turf.price}</span>
            )}
            <span className="text-gray-400 text-sm ml-1">/ hour</span>
          </div>
          <button
            onClick={() => {
              const turfId = turf._id || turf.turfId || turf.id;
              navigate(`/booking/${turfId}`);
            }}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Header onLogout={() => navigate('/login')} />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Browse Football Turfs
              </h1>
              <p className="text-gray-400 mb-3">Find and book the perfect turf for your game</p>
              <div className="flex items-center gap-2 text-gray-400">
                <FaMapMarkerAlt className="text-emerald-400" />
                <span className="text-sm">{locationName}</span>
                {isLoadingLocation && <FaSync className="animate-spin text-emerald-400 ml-2" />}
              </div>
            </div>
            <button
              onClick={fetchUserLocation}
              disabled={isLoadingLocation}
              className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              <FaSync className={isLoadingLocation ? 'animate-spin' : ''} />
              Refresh Location
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            />

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">All Locations</option>
              <option value="Downtown">Downtown</option>
              <option value="Uptown">Uptown</option>
              <option value="Midtown">Midtown</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="Kochi">Kochi</option>
              <option value="Alangad">Alangad</option>
              <option value="Aluva">Aluva</option>
              <option value="Thrissur">Thrissur</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            >
              <option value="distance">Sort by Distance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="premium">Premium Only</option>
              <option value="regular">Regular Only</option>
            </select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={availableNow}
                onChange={e => setAvailableNow(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-gray-300">Available Now</span>
            </label>

            <button
              onClick={resetFilters}
              className="ml-auto bg-red-500/20 text-red-400 border border-red-500/50 px-6 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-400">
          Showing <span className="text-emerald-400 font-semibold">{filteredTurfs.length}</span> turf{filteredTurfs.length !== 1 ? 's' : ''}
        </div>

        {/* Turfs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurfs.length ? filteredTurfs.map(turf => (
            <TurfCard key={(turf._id || turf.turfId || turf.id)} turf={turf} />
          )) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 text-lg mb-4">No turfs found matching your criteria</p>
              <button
                onClick={resetFilters}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurfBrowse;
