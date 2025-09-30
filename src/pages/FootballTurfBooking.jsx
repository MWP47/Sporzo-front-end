import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Hero from "../components/Hero";
import WeatherCard from "../components/WeatherCard";
import TurfCard from "../components/TurfCard";
import { getUserLocation, getHourlyForecast } from "../services/weatherService";
import { FaMapMarkerAlt, FaSync } from "react-icons/fa";

const FootballTurfBooking = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Detecting location...');
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  const turfs = [
    { 
      id: 1, 
      name: "Elite Turf Arena", 
      location: "Downtown", 
      price: 50, 
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
      premium: true
    },
    { 
      id: 2, 
      name: "Pro Stadium", 
      location: "Uptown", 
      price: 70, 
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800",
      premium: true
    },
    { 
      id: 3, 
      name: "Champion Field", 
      location: "Midtown", 
      price: 60, 
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800"
    },
  ];

  // Fetch weather data on component mount
  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setIsLoadingWeather(true);
    try {
      // Get user location
      const location = await getUserLocation();
      setUserLocation(location);

      // Fetch hourly forecast
      const forecast = await getHourlyForecast(location.lat, location.lon);
      
      if (forecast && forecast.length > 0) {
        setWeatherData(forecast);
        // Get location name from first forecast item
        setLocationName(location.isDefault ? 'Kochi, India (Default)' : 'Your Location');
      } else {
        // Fallback to mock data if API fails
        setWeatherData(generateMockWeatherData());
        setLocationName('Demo Data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Fallback to mock data
      setWeatherData(generateMockWeatherData());
      setLocationName('Demo Data');
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
              <div className="flex items-center gap-2 text-gray-400">
                <FaMapMarkerAlt className="text-emerald-400" />
                <span>{locationName}</span>
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

        {/* Premium Venues */}
        <section id="venues" className="mb-16 px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-6">Premium Football Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfs.map((turf) => (
              <TurfCard 
                key={turf.id} 
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
