import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaMapMarkerAlt, FaClock, FaUsers, FaCheckCircle, FaArrowLeft, FaCloudRain, FaSun, FaCloud } from "react-icons/fa";
import { WiDaySunny, WiCloudy, WiRain } from "react-icons/wi";
import Header from "../components/Header";
import Notification from "../components/Notification";
import TurfMap from "../components/TurfMap";
import { getUserLocation, getHourlyForecast, getWeatherForDate } from "../services/weatherService";

const TurfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Get today's date in local timezone
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState({});
  const [notification, setNotification] = useState(null);
  const [turf, setTurf] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [bookingMode, setBookingMode] = useState('slots'); // 'slots' or 'flexible'
  const [flexibleStartTime, setFlexibleStartTime] = useState('');
  const [flexibleEndTime, setFlexibleEndTime] = useState('');

  // Generate turf data dynamically
  const generateTurfData = (turfId) => {
    const turfNames = ['Elite Turf Arena', 'Pro Stadium', 'Champion Field', 'Victory Arena', 'Legends Ground', 'Golden Boot Stadium'];
    const locations = ['Downtown', 'Uptown', 'Midtown', 'Ernakulam', 'Kochi', 'Alangad', 'Aluva', 'Thrissur'];
    const images = [
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800",
      "https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
    ];
    
    // Different operating hours for different turfs
    const operatingHours = [
      { start: 6, end: 22, type: "Standard" },      // 6 AM - 10 PM
      { start: 0, end: 23, type: "24 Hours" },      // 24 hours
      { start: 8, end: 20, type: "Day Only" },      // 8 AM - 8 PM
      { start: 6, end: 23, type: "Extended" },      // 6 AM - 11 PM
      { start: 0, end: 23, type: "24 Hours" },      // 24 hours
      { start: 7, end: 21, type: "Standard" },      // 7 AM - 9 PM
    ];
    
    const nameIndex = (turfId - 1) % turfNames.length;
    const locationIndex = (turfId - 1) % locations.length;
    const imageIndex = (turfId - 1) % images.length;
    const hoursIndex = (turfId - 1) % operatingHours.length;
    
    const basePrice = 50 + Math.floor((turfId - 1) / 3) * 10;
    const rating = 4.5 + (Math.random() * 0.5);
    const hours = operatingHours[hoursIndex];
    
    return {
      id: turfId,
      name: turfNames[nameIndex],
      location: `${locations[locationIndex]}, Sector ${turfId}`,
      price: basePrice,
      rating: Math.round(rating * 10) / 10,
      image: images[imageIndex],
      description: "Premium quality artificial turf with FIFA-approved standards. Perfect for professional matches and training sessions.",
      amenities: ["Floodlights", "Changing Rooms", "Parking", "Water Facility", "First Aid"],
      capacity: turfId % 2 === 0 ? "11v11 (22 players)" : "7v7 (14 players)",
      size: turfId % 2 === 0 ? "100m x 64m" : "60m x 40m",
      surface: turfId % 3 === 0 ? "Hybrid Grass" : "Artificial Grass - FIFA Approved",
      operatingHours: hours,
      timings: hours.type === "24 Hours" 
        ? "Open 24 Hours" 
        : `${hours.start === 0 ? '12' : hours.start > 12 ? hours.start - 12 : hours.start}${hours.start >= 12 ? 'PM' : 'AM'} - ${hours.end === 0 ? '12' : hours.end > 12 ? hours.end - 12 : hours.end}${hours.end >= 12 ? 'PM' : 'AM'}`,
    };
  };

  // Generate time slots based on turf's operating hours (hourly)
  const generateTimeSlots = () => {
    if (!turf) return [];
    
    const slots = [];
    const { start, end } = turf.operatingHours;
    
    // For 24-hour turfs, generate all 24 slots
    if (start === 0 && end === 23) {
      for (let hour = 0; hour <= 23; hour++) {
        slots.push({
          id: `slot-${hour}`,
          startTime: `${hour.toString().padStart(2, "0")}:00`,
          endTime: `${((hour + 1) % 24).toString().padStart(2, "0")}:00`,
          hour,
          display: `${hour.toString().padStart(2, "0")}:00 - ${((hour + 1) % 24).toString().padStart(2, "0")}:00`,
        });
      }
    } else {
      // Generate slots based on operating hours
      for (let hour = start; hour <= end; hour++) {
        slots.push({
          id: `slot-${hour}`,
          startTime: `${hour.toString().padStart(2, "0")}:00`,
          endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
          hour,
          display: `${hour.toString().padStart(2, "0")}:00 - ${(hour + 1).toString().padStart(2, "0")}:00`,
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    // Load turf data - generate dynamically for any ID
    const turfId = parseInt(id);
    if (turfId > 0 && turfId <= 100) {
      const turfData = generateTurfData(turfId);
      setTurf(turfData);
    } else {
      navigate("/");
    }

    // Load booked slots from localStorage
    const savedBookings = localStorage.getItem("turfBookings");
    if (savedBookings) {
      setBookedSlots(JSON.parse(savedBookings));
    }

    // Fetch weather data
    fetchWeatherForDate(selectedDate);
  }, [id, navigate]);

  // Fetch weather when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchWeatherForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchWeatherForDate = async (date) => {
    setIsLoadingWeather(true);
    try {
      const location = await getUserLocation();
      
      // Check if date is within 7 days
      const targetDate = new Date(date);
      const today = new Date();
      const daysDiff = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 7) {
        // Beyond 7 days, show message
        setWeatherData({});
        showNotification('info', 'Weather forecast available for next 7 days only');
        return;
      }
      
      // Fetch weather for the selected date
      const weatherByHour = await getWeatherForDate(location.lat, location.lon, date);
      
      if (weatherByHour && Object.keys(weatherByHour).length > 0) {
        setWeatherData(weatherByHour);
      } else {
        setWeatherData({});
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherData({});
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const getWeatherForSlot = (hour) => {
    return weatherData[hour] || null;
  };

  const handleFlexibleBooking = () => {
    if (!flexibleStartTime || !flexibleEndTime) {
      showNotification("error", "Please select both start and end times!");
      return;
    }

    const startHour = parseInt(flexibleStartTime.split(':')[0]);
    const endHour = parseInt(flexibleEndTime.split(':')[0]);

    if (startHour >= endHour) {
      showNotification("error", "End time must be after start time!");
      return;
    }

    // Save flexible booking
    const flexibleBookings = JSON.parse(localStorage.getItem("flexibleBookings")) || {};
    const key = `${id}-${selectedDate}`;
    flexibleBookings[key] = {
      startTime: flexibleStartTime,
      endTime: flexibleEndTime,
      turfId: id,
      date: selectedDate
    };
    localStorage.setItem("flexibleBookings", JSON.stringify(flexibleBookings));

    showNotification("success", `Booked from ${flexibleStartTime} to ${flexibleEndTime}!`);
    setFlexibleStartTime('');
    setFlexibleEndTime('');
    setBookingMode('slots');
  };

  const getWeatherIcon = (main) => {
    if (!main) return null;
    const mainLower = main.toLowerCase();
    if (mainLower.includes('clear')) return <WiDaySunny className="text-yellow-400 text-2xl" />;
    if (mainLower.includes('rain')) return <WiRain className="text-blue-400 text-2xl" />;
    return <WiCloudy className="text-gray-400 text-2xl" />;
  };

  const getWeatherBackground = (main) => {
    if (!main) return 'bg-gray-800';
    const mainLower = main.toLowerCase();
    
    if (mainLower.includes('clear')) {
      return 'bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-yellow-600/20';
    }
    if (mainLower.includes('rain') || mainLower.includes('drizzle')) {
      return 'bg-gradient-to-br from-blue-500/20 via-blue-600/15 to-cyan-500/20';
    }
    if (mainLower.includes('cloud')) {
      return 'bg-gradient-to-br from-gray-500/20 via-gray-600/15 to-slate-500/20';
    }
    if (mainLower.includes('snow')) {
      return 'bg-gradient-to-br from-blue-200/20 via-white/10 to-blue-300/20';
    }
    if (mainLower.includes('storm') || mainLower.includes('thunder')) {
      return 'bg-gradient-to-br from-purple-600/20 via-gray-700/15 to-indigo-600/20';
    }
    
    return 'bg-gray-800';
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isSlotBooked = (slotId) => {
    const key = `${id}-${selectedDate}-${slotId}`;
    return bookedSlots[key] === true;
  };

  const isSlotSelected = (slotId) => {
    return selectedSlots.includes(slotId);
  };

  const isSlotPastOrTooSoon = (slot) => {
    // If not today, all slots are available
    if (selectedDate !== getTodayDate()) {
      return false;
    }

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Calculate slot start time
    const slotHour = slot.hour;
    
    // Check if slot is in the past or within 30 minutes
    if (slotHour < currentHour) {
      return true; // Past slot
    } else if (slotHour === currentHour) {
      return true; // Current hour - too soon
    } else if (slotHour === currentHour + 1 && currentMinute > 30) {
      return true; // Next hour but less than 30 min away
    }

    return false;
  };

  // Check if a slot is within a flexible booking time range
  const isSlotInFlexibleBooking = (slot) => {
    const flexibleBookings = JSON.parse(localStorage.getItem("flexibleBookings")) || {};
    const key = `${id}-${selectedDate}`;
    const booking = flexibleBookings[key];
    
    if (!booking) return false;
    
    // Convert times to hours for comparison
    const slotHour = slot.hour;
    const startHour = parseInt(booking.startTime.split(':')[0]);
    const endHour = parseInt(booking.endTime.split(':')[0]);
    
    // Check if slot hour is within the flexible booking range
    return slotHour >= startHour && slotHour < endHour;
  };

  const toggleSlotSelection = (slotId) => {
    if (isSlotBooked(slotId)) {
      showNotification("error", "This slot is already booked!");
      return;
    }

    if (isSlotSelected(slotId)) {
      setSelectedSlots(selectedSlots.filter((id) => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const calculateTotal = () => {
    return selectedSlots.length * turf.price;
  };

  const handleBooking = () => {
    if (selectedSlots.length === 0) {
      showNotification("error", "Please select at least one time slot!");
      return;
    }

    // Create booking records
    const newBookings = { ...bookedSlots };
    selectedSlots.forEach((slotId) => {
      const key = `${id}-${selectedDate}-${slotId}`;
      newBookings[key] = true;
    });

    // Save to localStorage
    localStorage.setItem("turfBookings", JSON.stringify(newBookings));
    setBookedSlots(newBookings);

    // Show success notification
    showNotification(
      "success",
      `Successfully booked ${selectedSlots.length} slot(s) for ₹${calculateTotal()}!`
    );

    // Clear selection
    setSelectedSlots([]);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  if (!turf) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Header onLogout={handleLogout} />

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 mb-6 transition-colors"
        >
          <FaArrowLeft /> Back to Home
        </button>

        {/* Turf Header */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Image */}
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={turf.image}
              alt={turf.name}
              className="w-full h-96 object-cover"
            />
            <div className="absolute top-4 right-4 flex items-center bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
              <FaStar className="text-yellow-400 mr-2" />
              <span className="font-bold text-lg">{turf.rating}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {turf.name}
              </h1>
              <p className="text-gray-300 flex items-center mb-4 text-lg">
                <FaMapMarkerAlt className="text-cyan-400 mr-2" />
                {turf.location}
              </p>
              <p className="text-gray-300 mb-6 leading-relaxed">{turf.description}</p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <FaUsers className="text-emerald-400 mb-2 text-xl" />
                  <p className="text-sm text-gray-400">Capacity</p>
                  <p className="font-semibold">{turf.capacity}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <FaClock className="text-cyan-400 mb-2 text-xl" />
                  <p className="text-sm text-gray-400">Operating Hours</p>
                  <p className="font-semibold">{turf.timings}</p>
                </div>
              </div>
              
              {/* Size */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">Field Size</p>
                <p className="font-semibold text-lg">{turf.size}</p>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {turf.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-500/30"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Surface Type */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300">Surface Type</p>
                <p className="font-semibold text-lg">{turf.surface}</p>
              </div>
            </div>

            {/* Price Card */}
            <div className="mt-6 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <p className="text-gray-400 mb-2">Price per hour</p>
              <p className="text-4xl font-bold text-emerald-400">₹{turf.price}</p>
            </div>
          </div>
        </div>

        {/* Location Map */}
        <TurfMap 
          turfName={turf.name}
          location={turf.location}
          turfId={turf.id}
        />

        {/* Booking Section */}
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Book Your Slot</h2>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3">Select Date</label>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlots([]);
                }}
                min={getTodayDate()}
                max={(() => {
                  const maxDate = new Date();
                  maxDate.setDate(maxDate.getDate() + 7);
                  return `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
                })()}
                className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none w-full md:w-auto"
              />
              <span className="text-sm text-gray-400">
                📅 Weather forecast available for next 7 days
              </span>
            </div>
          </div>

          {/* Booking Mode Toggle */}
          <div className="mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setBookingMode('slots')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  bookingMode === 'slots'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Hourly Slots
              </button>
              <button
                onClick={() => setBookingMode('flexible')}
                className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                  bookingMode === 'flexible'
                    ? 'bg-cyan-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Flexible Time
              </button>
            </div>
          </div>

          {/* Flexible Time Booking */}
          {bookingMode === 'flexible' && (
            <div className="mb-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">Custom Time Booking</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Time</label>
                  <input
                    type="time"
                    value={flexibleStartTime}
                    onChange={(e) => setFlexibleStartTime(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Time</label>
                  <input
                    type="time"
                    value={flexibleEndTime}
                    onChange={(e) => setFlexibleEndTime(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleFlexibleBooking}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                Book Custom Time
              </button>
            </div>
          )}

          {/* Time Slots */}
          {bookingMode === 'slots' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="text-lg font-semibold">Select Time Slots</label>
                {selectedDate === getTodayDate() && (
                  <span className="text-sm text-emerald-400 flex items-center gap-2">
                    <FaCloud /> Live Weather Data
                  </span>
                )}
              </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {timeSlots.map((slot) => {
                const booked = isSlotBooked(slot.id);
                const selected = isSlotSelected(slot.id);
                const inFlexibleBooking = isSlotInFlexibleBooking(slot);
                const weather = getWeatherForSlot(slot.hour);
                const isPastOrTooSoon = isSlotPastOrTooSoon(slot);
                const isDisabled = booked || isPastOrTooSoon || inFlexibleBooking;

                return (
                  <button
                    key={slot.id}
                    onClick={() => toggleSlotSelection(slot.id)}
                    disabled={isDisabled}
                    className={`
                      relative rounded-lg font-semibold transition-all duration-200 overflow-hidden
                      ${
                        isDisabled
                          ? "border-2 border-gray-600/50 cursor-not-allowed opacity-50"
                          : selected
                          ? "border-2 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/50"
                          : "border-2 border-gray-600 hover:border-emerald-400 hover:scale-105"
                      }
                    `}
                  >
                    {/* Top Section - Time (60%) */}
                    <div className={`
                      flex items-center justify-center h-16 
                      ${
                        booked
                          ? "bg-red-500/20 text-red-400"
                          : isPastOrTooSoon
                          ? "bg-gray-600/30 text-gray-500"
                          : selected
                          ? "bg-emerald-500 text-black"
                          : "bg-gray-700 text-white"
                      }
                    `}>
                      <div className="text-center">
                        <div className="text-lg font-bold">{slot.startTime}</div>
                        <div className="text-xs opacity-80">to {slot.endTime}</div>
                      </div>
                    </div>
                    
                    {/* Bottom Section - Weather (40%) */}
                    {weather && !isDisabled ? (
                      <div className={`
                        relative h-11 px-2 py-1 flex flex-col justify-center gap-0.5 overflow-hidden
                        ${
                          selected
                            ? "bg-emerald-600"
                            : getWeatherBackground(weather.main)
                        }
                      `}>
                        {/* Background Pattern Overlay */}
                        <div className={`
                          absolute inset-0 opacity-30
                          ${
                            selected
                              ? 'bg-emerald-700'
                              : weather.main?.toLowerCase().includes('clear')
                                ? 'bg-[radial-gradient(circle_at_30%_50%,rgba(251,191,36,0.3),transparent_50%)]'
                                : weather.main?.toLowerCase().includes('rain')
                                  ? 'bg-[linear-gradient(180deg,transparent_0%,rgba(59,130,246,0.2)_100%)]'
                                  : weather.main?.toLowerCase().includes('cloud')
                                    ? 'bg-[radial-gradient(ellipse_at_50%_50%,rgba(156,163,175,0.3),transparent_70%)]'
                                    : ''
                          }
                        `}></div>
                        
                        {/* Content */}
                        <div className="relative z-10">
                          {/* Weather Icon and Condition */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {getWeatherIcon(weather.main)}
                              </div>
                              <div className={`text-xs font-semibold truncate capitalize ${selected ? 'text-black' : 'text-white'}`}>
                                {weather.main}
                              </div>
                            </div>
                            <div className={`
                              text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0
                              ${
                                selected 
                                  ? 'bg-black/20 text-black' 
                                  : weather.score >= 80 
                                    ? 'bg-green-500/30 text-green-300 border border-green-400/30' 
                                    : weather.score >= 60 
                                      ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/30' 
                                      : 'bg-orange-500/30 text-orange-300 border border-orange-400/30'
                              }
                            `}>
                              {weather.score}
                            </div>
                          </div>
                          {/* Temperature */}
                          <div className={`text-xs font-semibold ${selected ? 'text-black/80' : 'text-white/90'}`}>
                            {weather.temp}°C • {weather.description}
                          </div>
                        </div>
                      </div>
                    ) : booked || inFlexibleBooking ? (
                      <div className="h-11 px-2 py-1.5 flex items-center justify-center bg-red-500/30 text-red-400">
                        <span className="text-xs font-bold">BOOKED</span>
                      </div>
                    ) : isPastOrTooSoon ? (
                      <div className="h-11 px-2 py-1.5 flex items-center justify-center bg-gray-600/30 text-gray-500">
                        <span className="text-xs font-bold">UNAVAILABLE</span>
                      </div>
                    ) : (
                      <div className={`
                        h-11 px-2 py-1.5 flex items-center justify-center
                        ${
                          selected
                            ? "bg-emerald-600 text-black"
                            : "bg-gray-800 text-gray-400"
                        }
                      `}>
                        <span className="text-xs">No weather data</span>
                      </div>
                    )}

                    {/* Status Indicator */}
                    {selected && (
                      <div className="absolute top-2 right-2">
                        <FaCheckCircle className="text-black text-lg drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            </div>
          )}

          {/* Booking Summary */}
          {selectedSlots.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Selected Slots:</span>
                  <span className="font-semibold">{selectedSlots.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Price per slot:</span>
                  <span className="font-semibold">₹{turf.price}</span>
                </div>
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-emerald-400">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBooking}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105"
              >
                Confirm Booking
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-700 border-2 border-gray-600 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 border-2 border-emerald-400 rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 border-2 border-red-500/50 rounded"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600/30 border-2 border-gray-600/50 rounded opacity-50"></div>
              <span>Unavailable (Past/Too Soon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetails;
