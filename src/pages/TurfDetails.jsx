import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaMapMarkerAlt, FaClock, FaUsers, FaCheckCircle, FaArrowLeft, FaCloudRain, FaSun, FaCloud, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { WiDaySunny, WiCloudy, WiRain } from "react-icons/wi";
import Header from "../components/Header";
import Notification from "../components/Notification";
import TurfMap from "../components/TurfMap";
import { getUserLocation, getHourlyForecast, getWeatherForDate } from "../services/weatherService";
import { 
  initiateRazorpayPayment, 
  processManualPayment, 
  savePaymentRecord, 
  generateBookingId,
  formatCurrency 
} from "../services/paymentService";
import bookingService from "../services/bookingService";

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

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    
    const today = getTodayDate();
    const maxDate = getMaxDate();
    const newDateString = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
    
    // Check if new date is within valid range
    if (newDateString >= today && newDateString <= maxDate) {
      setSelectedDate(newDateString);
      setSelectedSlots([]);
    }
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date(getTodayDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateString === getTodayDate()) {
      return 'Today';
    } else if (dateString === `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
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
  const [selectedFieldConfig, setSelectedFieldConfig] = useState(null);
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(''); // 'manual' or 'razorpay'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);

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
    
    // Generate field configurations based on turf type
    const fieldConfigurations = [];
    
    if (turfId % 4 === 0) {
      // Multi-configuration turf with time-based pricing
      fieldConfigurations.push(
        { 
          id: 1, type: "5v5", name: "Small Field (5v5)", size: "40m x 30m", capacity: "10 players", 
          price: basePrice - 20, available: true,
          pricing: { dayPrice: basePrice - 20, nightPrice: basePrice - 10, peakPrice: basePrice }
        },
        { 
          id: 2, type: "7v7", name: "Medium Field (7v7)", size: "60m x 40m", capacity: "14 players", 
          price: basePrice, available: true,
          pricing: { dayPrice: basePrice, nightPrice: basePrice + 20, peakPrice: basePrice + 40 }
        },
        { 
          id: 3, type: "11v11", name: "Full Field (11v11)", size: "100m x 64m", capacity: "22 players", 
          price: basePrice + 30, available: true,
          pricing: { dayPrice: basePrice + 30, nightPrice: basePrice + 60, peakPrice: basePrice + 100 }
        }
      );
    } else if (turfId % 3 === 0) {
      // 5v5 and 7v7 with time-based pricing
      fieldConfigurations.push(
        { 
          id: 1, type: "5v5", name: "Small Field (5v5)", size: "40m x 30m", capacity: "10 players", 
          price: basePrice - 15, available: true,
          pricing: { dayPrice: basePrice - 15, nightPrice: basePrice, peakPrice: basePrice + 15 }
        },
        { 
          id: 2, type: "7v7", name: "Medium Field (7v7)", size: "60m x 40m", capacity: "14 players", 
          price: basePrice + 10, available: true,
          pricing: { dayPrice: basePrice + 10, nightPrice: basePrice + 30, peakPrice: basePrice + 50 }
        }
      );
    } else if (turfId % 2 === 0) {
      // 7v7 and 11v11 with time-based pricing
      fieldConfigurations.push(
        { 
          id: 1, type: "7v7", name: "Medium Field (7v7)", size: "60m x 40m", capacity: "14 players", 
          price: basePrice, available: true,
          pricing: { dayPrice: basePrice, nightPrice: basePrice + 25, peakPrice: basePrice + 50 }
        },
        { 
          id: 2, type: "11v11", name: "Full Field (11v11)", size: "100m x 64m", capacity: "22 players", 
          price: basePrice + 25, available: true,
          pricing: { dayPrice: basePrice + 25, nightPrice: basePrice + 50, peakPrice: basePrice + 75 }
        }
      );
    } else {
      // Single configuration with time-based pricing
      fieldConfigurations.push(
        { 
          id: 1, type: "11v11", name: "Full Field (11v11)", size: "100m x 64m", capacity: "22 players", 
          price: basePrice, available: true,
          pricing: { dayPrice: basePrice, nightPrice: basePrice + 30, peakPrice: basePrice + 60 }
        }
      );
    }

    return {
      id: turfId,
      name: turfNames[nameIndex],
      location: `${locations[locationIndex]}, Sector ${turfId}`,
      price: basePrice, // Default price (for backward compatibility)
      fieldConfigurations,
      rating: Math.round(rating * 10) / 10,
      image: images[imageIndex],
      description: "Premium quality artificial turf with FIFA-approved standards. Perfect for professional matches and training sessions.",
      amenities: ["Floodlights", "Changing Rooms", "Parking", "Water Facility", "First Aid"],
      capacity: fieldConfigurations[0]?.name || "11v11 (22 players)",
      size: fieldConfigurations[0]?.size || "100m x 64m",
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
    const loadTurfData = async () => {
      console.log('TurfDetails: Loading turf with ID:', id);
      
      try {
        // Try to load from backend first (handles both MongoDB ObjectId and numeric IDs)
        const turfService = await import('../services/turfService');
        const result = await turfService.default.getTurfById(id);
        
        console.log('TurfDetails: Backend result:', result);
        
        if (result.success && result.turf) {
          console.log('TurfDetails: Turf loaded from backend:', result.turf.name);
          setTurf(result.turf);
          // Set default field configuration
          if (result.turf.fieldConfigurations && result.turf.fieldConfigurations.length > 0) {
            setSelectedFieldConfig(result.turf.fieldConfigurations[0]);
          }
        } else {
          console.log('TurfDetails: Turf not found, redirecting to home');
          showNotification("error", "Turf not found");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
      } catch (error) {
        console.error('TurfDetails: Error loading turf:', error);
        showNotification("error", "Failed to load turf details");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      // Load booked slots from backend
      await refreshBookedSlots(selectedDate);

      // Fetch weather data
      fetchWeatherForDate(selectedDate);
    };

    loadTurfData();
  }, [id, navigate, selectedDate]);

  // Fetch weather when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchWeatherForDate(selectedDate);
      // Also refresh booked slots for the selected date
      if (turf) {
        refreshBookedSlots(selectedDate);
      }
    }
  }, [selectedDate]);

  // Refresh booked slots from backend for a given date
  const refreshBookedSlots = async (dateStr) => {
    try {
      if (!dateStr) return;
      const candidates = [];
      if (turf?.turfId) candidates.push(String(turf.turfId));
      if (turf?._id) candidates.push(String(turf._id));
      if (id) candidates.push(String(id));

      const newMap = {};
      const uniqueCandidates = Array.from(new Set(candidates));

      // Query via bookings API in parallel and merge results
      const results = await Promise.all(
        uniqueCandidates.map(tid => 
          bookingService.getBookingsByFilter({
            turfId: tid,
            date: dateStr,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            limit: 100
          })
        )
      );

      results.forEach(res => {
        if (res?.success && Array.isArray(res.bookings)) {
          res.bookings
            .filter(b => ['completed', 'pending'].includes(b.paymentStatus))
            .forEach(b => {
              (b.slots || []).forEach(slotId => {
                const key = `${id}-${dateStr}-${slotId}`;
                newMap[key] = true;
              });
            });
        }
      });
      setBookedSlots(newMap);
    } catch (e) {
      console.warn('Failed to refresh booked slots from backend', e);
    }
  };

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

  const getPriceForSlot = (slotHour, fieldConfig) => {
    if (!fieldConfig) return turf.price;
    
    const pricing = fieldConfig.pricing || {};
    const basePrice = parseInt(fieldConfig.price) || parseInt(turf.price) || 0;
    
    // Peak hours: 6 PM - 9 PM (18-20)
    if (slotHour >= 18 && slotHour <= 20 && pricing.peakPrice) {
      return parseInt(pricing.peakPrice);
    }
    
    // Night hours: 6 PM - 12 AM (18-23)
    if (slotHour >= 18 && slotHour <= 23 && pricing.nightPrice) {
      return parseInt(pricing.nightPrice);
    }
    
    // Day hours: 6 AM - 6 PM (6-17) - use day price if set, otherwise base price
    if (pricing.dayPrice) {
      return parseInt(pricing.dayPrice);
    }
    
    // Fallback to base price
    return basePrice;
  };

  const getPriceRange = (fieldConfig) => {
    if (!fieldConfig) return { min: turf.price, max: turf.price };
    
    const pricing = fieldConfig.pricing || {};
    const basePrice = parseInt(fieldConfig.price) || parseInt(turf.price) || 0;
    const prices = [basePrice]; // Always include base price
    
    // Add time-based prices if they exist and are different from base
    if (pricing.dayPrice && parseInt(pricing.dayPrice) !== basePrice) {
      prices.push(parseInt(pricing.dayPrice));
    }
    if (pricing.nightPrice) prices.push(parseInt(pricing.nightPrice));
    if (pricing.peakPrice) prices.push(parseInt(pricing.peakPrice));
    
    if (prices.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  const formatPriceRange = (fieldConfig) => {
    const range = getPriceRange(fieldConfig);
    if (range.min === range.max) {
      return `₹${range.min}`;
    }
    return `₹${range.min} - ₹${range.max}`;
  };

  const calculateTotal = () => {
    if (!selectedFieldConfig || selectedSlots.length === 0) return 0;
    
    return selectedSlots.reduce((total, slotId) => {
      const slot = timeSlots.find(s => s.id === slotId);
      if (slot) {
        const price = getPriceForSlot(slot.hour, selectedFieldConfig);
        return total + price;
      }
      return total;
    }, 0);
  };

  const handleBooking = () => {
    if (selectedSlots.length === 0) {
      showNotification("error", "Please select at least one time slot!");
      return;
    }

    // Store booking data and show payment modal
    setPendingBookingData({
      slots: selectedSlots,
      date: selectedDate,
      turfId: id,
      total: calculateTotal(),
      fieldConfig: selectedFieldConfig
    });
    setShowPaymentModal(true);
  };

  const processBooking = async (paymentData = null) => {
    if (!pendingBookingData) return;
    // Refresh booked slots from backend so UI reflects actual state
    await refreshBookedSlots(selectedDate);

    // No longer store payments in localStorage here; persistence handled in payment handlers

    // Show success notification
    const message = paymentMethod === 'manual' 
      ? `Booking confirmed! Please pay ₹${pendingBookingData.total} at the venue.`
      : `Payment successful! Booking confirmed for ₹${pendingBookingData.total}.`;
    
    showNotification("success", message);

    // Clear states
    setSelectedSlots([]);
    setPendingBookingData(null);
    setShowPaymentModal(false);
    setPaymentMethod('');
  };

  const handleManualPayment = async () => {
    if (!pendingBookingData) return;
    
    setIsProcessingPayment(true);
    setPaymentMethod('manual');
    
    try {
      const bookingId = generateBookingId();
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const bookingData = {
        ...pendingBookingData,
        bookingId,
        paymentMethod: 'manual',
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone
      };

      // Process manual payment
      const result = await processManualPayment(bookingData);
      
      if (result.success) {
        // Persist booking to backend
        try {
          await bookingService.createBooking({
            bookingId,
            turfId: id,
            date: selectedDate,
            slots: pendingBookingData.slots,
            amount: pendingBookingData.total,
            paymentMethod: 'manual',
            status: 'pending',
            fieldConfig: pendingBookingData.fieldConfig,
            customerName: bookingData.customerName || 'Customer',
            customerEmail: bookingData.customerEmail || 'customer@sporzo.com',
            customerPhone: bookingData.customerPhone || '9999999999'
          });
        } catch (e) {
          // Fallback to local record if backend fails
          savePaymentRecord({
            bookingId,
            turfId: id,
            turfName: turf.name,
            date: selectedDate,
            slots: pendingBookingData.slots,
            amount: pendingBookingData.total,
            paymentMethod: 'manual',
            status: 'pending',
            paymentData: result,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone
          });
        }

        // Process booking UI/refresh availability
        await processBooking(result);
      } else {
        showNotification("error", "Failed to process manual payment. Please try again.");
      }
    } catch (error) {
      console.error('Manual payment error:', error);
      showNotification("error", "Payment processing failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!pendingBookingData) {
      showNotification("error", "No booking data found. Please try again.");
      return;
    }
    
    console.log('Starting Razorpay payment with data:', pendingBookingData);
    setIsProcessingPayment(true);
    setPaymentMethod('razorpay');

    try {
      // Validate required data
      if (!pendingBookingData.total || pendingBookingData.total <= 0) {
        throw new Error('Invalid payment amount');
      }

      if (!pendingBookingData.slots || pendingBookingData.slots.length === 0) {
        throw new Error('No slots selected');
      }

      const bookingId = generateBookingId();
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const paymentData = {
        amount: pendingBookingData.total,
        turfId: id,
        date: selectedDate,
        slots: pendingBookingData.slots,
        bookingId,
        customerName: user.name || 'Customer',
        customerEmail: user.email || 'customer@sporzo.com',
        customerPhone: user.phone || '9999999999'
      };

      console.log('Calling initiateRazorpayPayment with:', paymentData);

      // Initiate Razorpay payment
      const result = await initiateRazorpayPayment(paymentData);
      
      console.log('Payment result:', result);
      
      if (result.success) {
        // Persist booking to backend
        try {
          await bookingService.createBooking({
            bookingId,
            turfId: id,
            date: selectedDate,
            slots: pendingBookingData.slots,
            amount: pendingBookingData.total,
            paymentMethod: 'razorpay',
            status: 'completed',
            fieldConfig: pendingBookingData.fieldConfig,
            customerName: paymentData.customerName,
            customerEmail: paymentData.customerEmail,
            customerPhone: paymentData.customerPhone
          });
        } catch (e) {
          // Fallback to local record if backend fails
          savePaymentRecord({
            bookingId,
            turfId: id,
            turfName: turf.name,
            date: selectedDate,
            slots: pendingBookingData.slots,
            amount: pendingBookingData.total,
            paymentMethod: 'razorpay',
            status: 'completed',
            paymentData: result,
            customerName: paymentData.customerName,
            customerEmail: paymentData.customerEmail,
            customerPhone: paymentData.customerPhone
          });
        }

        // Process booking UI/refresh availability
        await processBooking(result);
        showNotification("success", "Payment successful! Your booking is confirmed.");
      }
    } catch (error) {
      console.error('Razorpay payment error in TurfDetails:', error);
      if (error.message === 'Payment cancelled by user') {
        showNotification("info", "Payment cancelled");
      } else if (error.message && error.message.includes('Payment gateway not available')) {
        showNotification("error", "Payment gateway not available. Please refresh the page and try again.");
      } else if (error.message && error.message.includes('Payment configuration error')) {
        showNotification("error", "Payment system error. Please try manual payment or contact support.");
      } else {
        showNotification("error", `Payment failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleCancelPayment = useCallback(() => {
    console.log('Canceling payment...');
    
    // Reset all payment-related states
    setShowPaymentModal(false);
    setPendingBookingData(null);
    setPaymentMethod('');
    setIsProcessingPayment(false);
    
    // Show cancellation message
    showNotification("info", "Payment cancelled");
    
    console.log('Payment cancelled successfully');
  }, []);

  // Handle ESC key press for payment modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showPaymentModal && !isProcessingPayment) {
        handleCancelPayment();
      }
    };

    if (showPaymentModal) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [showPaymentModal, isProcessingPayment, handleCancelPayment]);

  // Payment Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal || !pendingBookingData) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          // Close modal if clicking outside and not processing
          if (e.target === e.currentTarget && !isProcessingPayment) {
            handleCancelPayment();
          }
        }}
      >
        <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
          <h3 className="text-xl font-bold mb-4 text-center">Choose Payment Method</h3>
          
          {/* Booking Summary */}
          <div className="bg-gray-700/50 rounded-lg p-3 mb-4 border border-gray-600">
            <h4 className="font-semibold mb-2 text-emerald-400 text-sm">Booking Summary</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Turf:</span>
                <span className="font-medium">{turf.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Date:</span>
                <span className="font-medium">{formatDateDisplay(pendingBookingData.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Field Type:</span>
                <span className="font-medium">{pendingBookingData.fieldConfig?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Slots:</span>
                <span className="font-medium">{pendingBookingData.slots.length} slot(s)</span>
              </div>
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Amount:</span>
                  <span className="text-emerald-400">{formatCurrency(pendingBookingData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-3 mb-4">
            {/* Debug Info */}
            <div className="bg-gray-700/30 rounded-lg p-3 text-xs text-gray-400">
              <div>Debug: Razorpay {typeof window.Razorpay !== 'undefined' ? '✅ Loaded' : '❌ Not Loaded'}</div>
              <div>Amount: ₹{pendingBookingData.total} | Slots: {pendingBookingData.slots.length}</div>
            </div>

            {/* Razorpay Payment */}
            <button
              onClick={handleRazorpayPayment}
              disabled={isProcessingPayment || typeof window.Razorpay === 'undefined'}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              {isProcessingPayment && paymentMethod === 'razorpay' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : typeof window.Razorpay === 'undefined' ? (
                <>
                  <span className="text-xl">⚠️</span>
                  Payment Gateway Loading...
                </>
              ) : (
                <>
                  <span className="text-xl">💳</span>
                  Pay Now with Razorpay
                </>
              )}
            </button>

            {/* Reload Script Button if Razorpay not loaded */}
            {typeof window.Razorpay === 'undefined' && (
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                🔄 Reload Page to Fix Payment Gateway
              </button>
            )}

            {/* Manual Payment */}
            <button
              onClick={handleManualPayment}
              disabled={isProcessingPayment}
              className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              {isProcessingPayment && paymentMethod === 'manual' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-xl">🏪</span>
                  Pay at Venue
                </>
              )}
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <h5 className="font-semibold text-blue-400 mb-2 text-sm">Payment Information</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• <strong>Pay Now:</strong> Secure online payment via Razorpay</li>
              <li>• <strong>Pay at Venue:</strong> Reserve now, pay when you arrive</li>
              <li>• All payments are secure and protected</li>
            </ul>
          </div>

          {/* Cancel Button */}
          <button
            onClick={handleCancelPayment}
            disabled={isProcessingPayment}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isProcessingPayment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                Processing...
              </>
            ) : (
              <>
                <span>❌</span>
                Cancel
              </>
            )}
          </button>
        </div>
      </div>
    );
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

      {/* Payment Modal */}
      <PaymentModal />

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
              <span className="font-bold text-lg">{turf.rating && !isNaN(turf.rating) ? turf.rating.toFixed(1) : '0.0'}</span>
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
                  <p className="font-semibold">
                    {turf.capacity || selectedFieldConfig?.capacity || turf.fieldConfigurations?.[0]?.capacity || 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <FaClock className="text-cyan-400 mb-2 text-xl" />
                  <p className="text-sm text-gray-400">Operating Hours</p>
                  <p className="font-semibold">
                    {turf.timings || (turf.operatingHours 
                      ? (turf.operatingHours.type === "24 Hours" 
                        ? "Open 24 Hours" 
                        : `${turf.operatingHours.start === 0 ? '12' : turf.operatingHours.start > 12 ? turf.operatingHours.start - 12 : turf.operatingHours.start}${turf.operatingHours.start >= 12 ? 'PM' : 'AM'} - ${turf.operatingHours.end === 0 ? '12' : turf.operatingHours.end > 12 ? turf.operatingHours.end - 12 : turf.operatingHours.end}${turf.operatingHours.end >= 12 ? 'PM' : 'AM'}`)
                      : 'Not specified')}
                  </p>
                </div>
              </div>
              
              {/* Size */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">Field Size</p>
                <p className="font-semibold text-lg">
                  {turf.size || selectedFieldConfig?.size || turf.fieldConfigurations?.[0]?.size || 'Not specified'}
                </p>
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

            {/* Field Configuration Selection */}
            <div className="mt-6 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Select Field Size</h3>
              
              {turf.fieldConfigurations && turf.fieldConfigurations.length > 1 ? (
                <div className="space-y-3">
                  {turf.fieldConfigurations.map((config) => (
                    <div
                      key={config.id}
                      onClick={() => {
                        setSelectedFieldConfig(config);
                        setSelectedSlots([]); // Clear selected slots when changing field config
                      }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedFieldConfig?.id === config.id
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">{config.name}</h4>
                          <p className="text-sm text-gray-400">{config.size} • {config.capacity}</p>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <p className="text-xl font-bold text-emerald-400">{formatPriceRange(config)}</p>
                            <p className="text-xs text-gray-400">per hour</p>
                          </div>
                          
                          {config.pricing && (config.pricing.dayPrice || config.pricing.nightPrice || config.pricing.peakPrice) ? (
                            <div className="space-y-1">
                              {config.pricing.dayPrice && (
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs text-gray-400">☀️</span>
                                  <span className="text-xs font-medium text-emerald-400">₹{config.pricing.dayPrice}</span>
                                </div>
                              )}
                              {config.pricing.nightPrice && (
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs text-gray-400">🌙</span>
                                  <span className="text-xs font-medium text-blue-400">₹{config.pricing.nightPrice}</span>
                                </div>
                              )}
                              {config.pricing.peakPrice && (
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-xs text-gray-400">⭐</span>
                                  <span className="text-xs font-medium text-yellow-400">₹{config.pricing.peakPrice}</span>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Single configuration display
                <div className="p-4 rounded-lg border border-emerald-500 bg-emerald-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{selectedFieldConfig?.name}</h4>
                      <p className="text-sm text-gray-400">{selectedFieldConfig?.size} • {selectedFieldConfig?.capacity}</p>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        <p className="text-2xl font-bold text-emerald-400">{formatPriceRange(selectedFieldConfig)}</p>
                        <p className="text-xs text-gray-400">per hour</p>
                      </div>
                      
                      {selectedFieldConfig?.pricing && (selectedFieldConfig.pricing.dayPrice || selectedFieldConfig.pricing.nightPrice || selectedFieldConfig.pricing.peakPrice) ? (
                        <div className="space-y-1">
                          {selectedFieldConfig.pricing.dayPrice && (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-gray-400">☀️</span>
                              <span className="text-sm font-medium text-emerald-400">₹{selectedFieldConfig.pricing.dayPrice}</span>
                            </div>
                          )}
                          {selectedFieldConfig.pricing.nightPrice && (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-gray-400">🌙</span>
                              <span className="text-sm font-medium text-blue-400">₹{selectedFieldConfig.pricing.nightPrice}</span>
                            </div>
                          )}
                          {selectedFieldConfig.pricing.peakPrice && (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs text-gray-400">⭐</span>
                              <span className="text-sm font-medium text-yellow-400">₹{selectedFieldConfig.pricing.peakPrice}</span>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Map */}
        <TurfMap 
          turfName={turf.name}
          location={turf.location}
          turfId={turf._id || turf.turfId || turf.id}
          coordinates={turf.coordinates}
        />

        {/* Booking Section */}
        <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">Book Your Slot</h2>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-3">Select Date</label>
            <div className="flex flex-col gap-4">
              {/* Date Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateDate(-1)}
                  disabled={selectedDate <= getTodayDate()}
                  className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg border border-gray-600 hover:border-emerald-400 transition-all"
                >
                  <FaChevronLeft />
                </button>
                
                <div className="flex-1 bg-gray-700 rounded-lg border border-gray-600 focus-within:border-emerald-400 transition-colors">
                  <div className="flex items-center">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlots([]);
                      }}
                      min={getTodayDate()}
                      max={getMaxDate()}
                      className="bg-transparent text-white px-4 py-3 rounded-lg focus:outline-none flex-1"
                    />
                    <div className="px-4 py-3 text-emerald-400 font-semibold border-l border-gray-600">
                      {formatDateDisplay(selectedDate)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => navigateDate(1)}
                  disabled={selectedDate >= getMaxDate()}
                  className="flex items-center justify-center w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg border border-gray-600 hover:border-emerald-400 transition-all"
                >
                  <FaChevronRight />
                </button>
              </div>
              
              {/* Date Info */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>📅 Weather forecast available for next 7 days</span>
                <span className="text-gray-600">•</span>
                <span className="text-emerald-400">Use arrow keys or buttons to navigate dates</span>
              </div>
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
                    {/* Top Section - Time & Price */}
                    <div className={`
                      flex flex-col items-center justify-center h-16 
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
                        <div className="text-sm font-bold">{slot.startTime}</div>
                        <div className="text-xs opacity-80">to {slot.endTime}</div>
                        {selectedFieldConfig && (
                          <div className="text-xs font-semibold mt-0.5">
                            ₹{getPriceForSlot(slot.hour, selectedFieldConfig)}
                          </div>
                        )}
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
          {selectedSlots.length > 0 && selectedFieldConfig && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Field Type:</span>
                  <span className="font-medium">{selectedFieldConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Field Size:</span>
                  <span className="font-medium">{selectedFieldConfig.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Selected Slots:</span>
                  <span className="font-medium">{selectedSlots.length}</span>
                </div>
                
                {/* Detailed Pricing Breakdown */}
                <div className="space-y-1 text-sm">
                  {selectedSlots.map(slotId => {
                    const slot = timeSlots.find(s => s.id === slotId);
                    if (!slot) return null;
                    
                    const price = getPriceForSlot(slot.hour, selectedFieldConfig);
                    const timeType = slot.hour >= 18 && slot.hour <= 20 ? '⭐ Peak' : 
                                   slot.hour >= 18 ? '🌙 Night' : '☀️ Day';
                    
                    return (
                      <div key={slotId} className="flex justify-between text-xs">
                        <span className="text-gray-400">{slot.startTime} {timeType}:</span>
                        <span className="text-gray-300">₹{price}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-emerald-500/30 pt-2 mt-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total Amount:</span>
                    <span className="text-emerald-400">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBooking}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-all transform hover:scale-105"
              >
                Proceed to Payment
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
