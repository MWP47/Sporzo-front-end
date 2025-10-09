import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Hero from "../components/Hero";
import WeatherCard from "../components/WeatherCard";
import TurfCard from "../components/TurfCard";
import { getUserLocation, getHourlyForecast, getCurrentWeather } from "../services/weatherService";
import { FaMapMarkerAlt, FaSync, FaCreditCard, FaShieldAlt, FaMobile, FaCheckCircle, FaLock, FaBolt } from "react-icons/fa";
import turfService from "../services/turfService";

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const FootballTurfBooking = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  const [turfs, setTurfs] = useState([]);

  // Removed local fallback: show only backend turfs (with cache)

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

  // Fetch weather data and load turfs on component mount
  useEffect(() => {
    fetchWeatherData();
    // Don't load turfs immediately, wait for user location
  }, []);

  // Load turfs after user location is available
  useEffect(() => {
    if (userLocation) {
      loadTurfsFromBackend();
    }
  }, [userLocation]);

  // Recalculate distances when user location changes
  useEffect(() => {
    if (userLocation && turfs.length > 0) {
      console.log('Recalculating distances with user location:', userLocation);
      const turfsWithUpdatedDistance = turfs.map(turf => {
        let distance = 0;
        if (turf.coordinates && turf.coordinates.lat && turf.coordinates.lng) {
          distance = calculateDistance(
            userLocation.lat, 
            userLocation.lon, 
            turf.coordinates.lat, 
            turf.coordinates.lng
          );
          console.log(`Distance to ${turf.name}: ${distance} km`);
        } else {
          console.log(`No coordinates for turf: ${turf.name}`, turf.coordinates);
        }
        
        // Use original location without coordinates display
        const originalLocation = turf.address || turf.location || 'Unknown Location';
        const cleanLocation = originalLocation
          .replace(/Lat:\s*[\d.-]+,?\s*Lng:\s*[\d.-]+\s*•?\s*/gi, '') // Remove "Lat: X, Lng: Y •"
          .replace(/\s*•\s*\d+\.\d+\s*km\s*away.*$/gi, '') // Remove "• X.X km away"
          .trim();
        
        return {
          ...turf,
          distance: distance,
          location: `${cleanLocation} • ${distance.toFixed(1)} km away`
        };
      });
      setTurfs(turfsWithUpdatedDistance);
    }
  }, [userLocation]);

  const removeDuplicates = (turfs) => {
    const seen = new Set();
    return turfs.filter(turf => {
      const identifier = `${turf.id}-${turf.name}-${turf.location}`;
      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });
  };

  const loadTurfsFromBackend = async () => {
    console.log('Loading turfs from backend with user location:', userLocation);
    
    // Show cached or fallback immediately for faster perceived load
    try {
      const cached = sessionStorage.getItem('turfs_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const backendOnly = Array.isArray(parsed) ? parsed.filter(t => t && t.isBackendTurf === true) : [];
        // Only show owner-created items (must have ownerId)
        const ownerOnly = backendOnly.filter(t => !!t.ownerId);
        const uniqueTurfs = removeDuplicates(ownerOnly);
        const featuredTurfs = uniqueTurfs.slice(0, 6);
        
        // Add distance calculation to cached turfs
        const turfsWithDistance = featuredTurfs.map(turf => {
          let distance = turf.distance || 0;
          if (userLocation && turf.coordinates && turf.coordinates.lat && turf.coordinates.lng) {
            distance = calculateDistance(
              userLocation.lat, 
              userLocation.lon, 
              turf.coordinates.lat, 
              turf.coordinates.lng
            );
            console.log(`Cached turf ${turf.name} distance: ${distance} km`);
          }
          
          // Clean location name (remove any existing coordinate info)
          console.log(`Turf ${turf.name} full data:`, { location: turf.location, address: turf.address, name: turf.name });
          const originalLocation = turf.location || turf.address || turf.name || 'Unknown Location';
          console.log(`Turf ${turf.name} - Original location:`, originalLocation);
          const cleanLocation = originalLocation
            .replace(/Lat:\s*[\d.-]+,?\s*Lng:\s*[\d.-]+\s*•?\s*/gi, '') // Remove "Lat: X, Lng: Y •"
            .replace(/\s*•\s*\d+\.\d+\s*km\s*away.*$/gi, '') // Remove "• X.X km away"
            .trim() || turf.name || 'Unknown Location';
          console.log(`Turf ${turf.name} - Clean location:`, cleanLocation);
          
          return {
            ...turf,
            distance: distance,
            location: `${cleanLocation} • ${distance.toFixed(1)} km away`
          };
        });
        
        setTurfs(turfsWithDistance);
      } else {
        setTurfs([]);
      }
    } catch { /* ignore cache errors */ }

    // Fetch fresh data from backend

    try {
      const result = await turfService.getAllTurfs();
      if (result.success) {
        // Remove duplicates and limit to featured turfs
        const uniqueTurfs = removeDuplicates(result.turfs);
        const featuredTurfs = uniqueTurfs.slice(0, 6); // Show only 6 featured turfs
        
        // Add distance calculation to fetched turfs
        const turfsWithDistance = featuredTurfs.map(turf => {
          let distance = 0;
          if (userLocation && turf.coordinates && turf.coordinates.lat && turf.coordinates.lng) {
            distance = calculateDistance(
              userLocation.lat, 
              userLocation.lon, 
              turf.coordinates.lat, 
              turf.coordinates.lng
            );
            console.log(`Fresh turf ${turf.name} distance: ${distance} km`);
          } else {
            console.log(`Fresh turf ${turf.name} - no coordinates or user location`, {
              hasUserLocation: !!userLocation,
              hasCoordinates: !!turf.coordinates,
              coordinates: turf.coordinates
            });
          }
          
          // Clean location name (remove any existing coordinate info)
          console.log(`Turf ${turf.name} full data:`, { location: turf.location, address: turf.address, name: turf.name });
          const originalLocation = turf.location || turf.address || turf.name || 'Unknown Location';
          console.log(`Turf ${turf.name} - Original location:`, originalLocation);
          const cleanLocation = originalLocation
            .replace(/Lat:\s*[\d.-]+,?\s*Lng:\s*[\d.-]+\s*•?\s*/gi, '') // Remove "Lat: X, Lng: Y •"
            .replace(/\s*•\s*\d+\.\d+\s*km\s*away.*$/gi, '') // Remove "• X.X km away"
            .trim() || turf.name || 'Unknown Location';
          console.log(`Turf ${turf.name} - Clean location:`, cleanLocation);
          
          return {
            ...turf,
            distance: distance,
            location: `${cleanLocation} • ${distance.toFixed(1)} km away`
          };
        });
        
        setTurfs(turfsWithDistance);
        // Cache for next visit
        sessionStorage.setItem('turfs_cache', JSON.stringify(uniqueTurfs));
      }
      // if not success, keep cached/fallback
    } catch (error) {
      console.error('Error loading turfs from backend:', error);
      // keep cached/fallback
    }
  };

  const fetchWeatherData = async () => {
    setIsLoadingWeather(true);
    try {
      // Get user location
      console.log('Requesting user location...');
      const location = await getUserLocation();
      console.log('User location received:', location);
      setUserLocation(location);

      // Get current weather to extract location name
      const currentWeather = await getCurrentWeather(location.lat, location.lon);
      
      // Fetch hourly forecast
      const forecast = await getHourlyForecast(location.lat, location.lon);
      
      if (forecast && forecast.length > 0) {
        setWeatherData(forecast);
        // Set location name from current weather data or fallback
        if (currentWeather && currentWeather.location) {
          setLocationName(location.isDefault ? `${currentWeather.location} (Default)` : currentWeather.location);
        } else {
          setLocationName(location.isDefault ? 'Kochi, India (Default)' : 'Your Location');
        }
      } else {
        // Fallback to mock data if API fails
        setWeatherData(generateMockWeatherData());
        setLocationName('Demo Data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Fallback to mock data and default location
      setWeatherData(generateMockWeatherData());
      setLocationName('Demo Data');
      
      // Set default location if not already set
      if (!userLocation) {
        console.log('Setting default location (Kochi, India)');
        setUserLocation({
          lat: 9.9312,
          lon: 76.2673,
          isDefault: true
        });
      }
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const generateMockWeatherData = () => {
    return Array.from({ length: 8 }, (_, i) => {
      const hour = new Date().getHours() + i * 3;
      return {
        hour: hour % 24,
        time: `${(hour % 24).toString().padStart(2, '0')}:00`,
        temp: 20 + Math.floor(Math.random() * 10),
        feelsLike: 20 + Math.floor(Math.random() * 10),
        humidity: 50 + Math.floor(Math.random() * 30),
        description: ['clear sky', 'few clouds', 'scattered clouds', 'light rain'][Math.floor(Math.random() * 4)],
        main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
        windSpeed: Math.random() * 10,
        rainProbability: Math.random() * 100,
        score: Math.floor(Math.random() * 100),
      };
    });
  };

  const formatHour = (hour) => `${hour}:00`;
  const getScoreColor = (score) =>
    score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";

  const getAvailabilityBadge = (availability, playersNeeded) => {
    if (availability === "available")
      return <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs">Available</span>;
    if (availability === "partial")
      return <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-xs">{playersNeeded} Players Needed</span>;
    return <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs">Full</span>;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavigateToBrowse = () => {
    navigate("/browse");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <Header onLogout={handleLogout} />

      {/* Hero section */}
      <Hero />

      <main className="container mx-auto px-6 py-12">
        {/* Weather Intelligence */}
        <section id="weather" className="mb-16 px-6 lg:px-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Weather Intelligence</h2>
              <div className="flex items-center gap-2 text-gray-400 mb-3">
                <FaMapMarkerAlt className="text-emerald-400" />
                <span>{locationName}</span>
              </div>
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6 max-w-4xl">
                <p className="text-gray-200 text-base leading-relaxed mb-4">
                  <span className="text-2xl">⚡</span> <span className="font-bold text-emerald-400 text-lg">Smart Weather Intelligence</span> powered by advanced AI algorithms that analyze 
                  <span className="text-blue-300 font-semibold"> real-time atmospheric data</span> - temperature, humidity, wind patterns, and precipitation probability - 
                  to deliver precision playing condition scores.
                </p>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-bold text-base">80-100:</span>
                    <span className="text-gray-300 font-medium">Perfect Match Conditions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-400 font-bold text-base">50-79:</span>
                    <span className="text-gray-300 font-medium">Good to Play</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-red-400 font-bold text-base">0-49:</span>
                    <span className="text-gray-300 font-medium">Challenging Weather</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={fetchWeatherData}
              disabled={isLoadingWeather}
              className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              <FaSync className={isLoadingWeather ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {isLoadingWeather ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <FaSync className="animate-spin text-4xl text-emerald-400 mx-auto mb-4" />
                <p className="text-gray-400">Loading weather data...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {weatherData.map((weather, idx) => (
                <WeatherCard
                  key={idx}
                  weather={weather}
                />
              ))}
            </div>
          )}
        </section>

        {/* Payment Solutions */}
        <section id="payments" className="mb-16 px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Secure Payment Solutions
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Experience seamless, secure, and instant payments with our integrated Razorpay gateway
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Payment Gateway Features */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FaCreditCard className="text-2xl text-black" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Razorpay Integration</h3>
                  <p className="text-emerald-400 font-semibold">Powered by India's Leading Payment Gateway</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Multiple Payment Methods</h4>
                    <p className="text-gray-400 text-sm">Credit/Debit Cards, UPI, Net Banking, Digital Wallets</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Bank-Grade Security</h4>
                    <p className="text-gray-400 text-sm">256-bit SSL encryption with PCI DSS compliance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaBolt className="text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Instant Processing</h4>
                    <p className="text-gray-400 text-sm">Real-time payment confirmation and booking updates</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FaMobile className="text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Mobile Optimized</h4>
                    <p className="text-gray-400 text-sm">Seamless payment experience across all devices</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Statistics */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <FaLock className="text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Trust & Security</h3>
                  <p className="text-purple-400 font-semibold">Your Money, Your Security</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">99.9%</div>
                  <div className="text-gray-400 text-sm">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">&lt;3s</div>
                  <div className="text-gray-400 text-sm">Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
                  <div className="text-gray-400 text-sm">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400 mb-2">100%</div>
                  <div className="text-gray-400 text-sm">Secure</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FaShieldAlt className="text-emerald-400" />
                  <span className="font-semibold text-emerald-400">Refund Protection</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Automatic refund processing for cancelled bookings with instant credit to your account
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-2xl p-8 border border-gray-700/50">
            <h3 className="text-xl font-bold text-center mb-8 text-white">Accepted Payment Methods</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {/* Credit Cards */}
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <FaCreditCard className="text-white text-xl" />
                </div>
                <span className="text-gray-300 text-sm font-medium">Credit Cards</span>
                <span className="text-gray-500 text-xs">Visa, Mastercard</span>
              </div>

              {/* Debit Cards */}
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-3">
                  <FaCreditCard className="text-white text-xl" />
                </div>
                <span className="text-gray-300 text-sm font-medium">Debit Cards</span>
                <span className="text-gray-500 text-xs">All Banks</span>
              </div>

              {/* UPI */}
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white text-sm font-bold">UPI</span>
                </div>
                <span className="text-gray-300 text-sm font-medium">UPI</span>
                <span className="text-gray-500 text-xs">GPay, PhonePe</span>
              </div>

              {/* Net Banking */}
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white text-xs font-bold">NET</span>
                </div>
                <span className="text-gray-300 text-sm font-medium">Net Banking</span>
                <span className="text-gray-500 text-xs">50+ Banks</span>
              </div>

              {/* Wallets */}
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-3">
                  <FaMobile className="text-white text-xl" />
                </div>
                <span className="text-gray-300 text-sm font-medium">Wallets</span>
                <span className="text-gray-500 text-xs">Paytm, Amazon</span>
              </div>

              {/* Manual */}
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white text-xs font-bold">PAY</span>
                </div>
                <span className="text-gray-300 text-sm font-medium">Pay Later</span>
                <span className="text-gray-500 text-xs">Manual Payment</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full px-6 py-3">
                <FaCheckCircle className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">All transactions are secured with end-to-end encryption</span>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Venues */}
        <section id="venues" className="mb-16 px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-6">Premium Football Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfs.map((turf) => (
              <TurfCard 
                key={turf._id || turf.turfId || turf.id} 
                turf={turf} 
                onViewVenue={handleNavigateToBrowse} 
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FootballTurfBooking;
