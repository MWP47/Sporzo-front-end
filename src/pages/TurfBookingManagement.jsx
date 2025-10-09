import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import turfService from "../services/turfService";
import bookingService from "../services/bookingService";
import turfOwnerService from "../services/turfOwnerService";
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaRupeeSign, 
  FaClock,
  FaUser,
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFilter,
  FaSearch,
  FaEye
} from "react-icons/fa";
import Notification from "../components/Notification";

const TurfBookingManagement = () => {
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const [notification, setNotification] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    turf: 'all',
    dateRange: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    revenue: 0
  });

  useEffect(() => {
    (async () => {
      // Check authentication
      const ownerToken = localStorage.getItem("turfOwnerToken");
      const ownerData = localStorage.getItem("turfOwner");

      if (!ownerToken || !ownerData) {
        navigate("/owner/login");
        return;
      }

      const parsedOwner = JSON.parse(ownerData);
      setOwner(parsedOwner);

      // Load data in order so bookings use merged turfs
      const mergedTurfs = await loadOwnerTurfs(parsedOwner.id);
      await loadBookings(parsedOwner.id, mergedTurfs);
    })();
  }, [navigate]);

  useEffect(() => {
    // Apply filters when bookings or filters change
    applyFilters();
  }, [bookings, filters]);

  const loadOwnerTurfs = async (ownerId) => {
    let backendOwnerTurfs = [];
    try {
      const res = await turfOwnerService.getTurfs();
      if (res?.success && Array.isArray(res.turfs)) {
        backendOwnerTurfs = res.turfs;
      }
    } catch (e) {
      console.warn('Failed to fetch owner turfs from backend (owner route)');
    }

    setTurfs(backendOwnerTurfs);
    return backendOwnerTurfs;
  };

  const cancelOwnerBooking = async (booking) => {
    try {
      const reason = window.prompt('Reason for cancellation (optional):', '') || '';
      const res = await turfOwnerService.cancelBooking(booking.bookingId, reason);
      if (res?.success) {
        showNotification('success', 'Booking cancelled');
        await loadBookings(owner.id, turfs);
      } else {
        showNotification('error', res?.message || 'Failed to cancel booking');
      }
    } catch (e) {
      showNotification('error', e.message || 'Failed to cancel booking');
    }
  };

  const loadBookings = async (ownerId, ownerTurfsList = null) => {
    // Use owner route turfs if provided, else from state/local
    const ownerTurfs = ownerTurfsList ?? turfs;
    const idOf = (t) => String(t.turfId ?? t._id ?? t.id);

    // Fetch bookings from owner route
    let ownerBookings = [];
    try {
      const res = await turfOwnerService.getBookings();
      if (res?.success && Array.isArray(res.bookings)) {
        // Backend already filters bookings to this owner; use as-is
        ownerBookings = res.bookings;
      }
    } catch (e) {
      console.warn('Failed to fetch owner bookings from backend (owner route)');
    }

    // Map turf info for display (support both turfId and _id keys)
    const turfById = new Map();
    ownerTurfs.forEach(t => {
      const tid = t?.turfId ? String(t.turfId) : null;
      const oid = t?._id ? String(t._id) : null;
      const fid = t?.id ? String(t.id) : null;
      if (tid) turfById.set(tid, t);
      if (oid) turfById.set(oid, t);
      if (fid) turfById.set(fid, t);
    });

    const enhancedBookings = ownerBookings.map(booking => {
      let turf = turfById.get(String(booking.turfId));
      if (!turf && booking.turfName) {
        turf = ownerTurfs.find(t => t.name === booking.turfName) || null;
      }

      const name = booking.customerName 
        || booking.customer?.name 
        || booking.customerDetails?.name 
        || booking.userName 
        || 'Customer';
      const email = booking.customerEmail 
        || booking.customer?.email 
        || booking.customerDetails?.email 
        || booking.userEmail 
        || 'customer@example.com';
      const phone = booking.customerPhone 
        || booking.customer?.phone 
        || booking.customerDetails?.phone 
        || booking.userPhone 
        || 'Not provided';

      return {
        ...booking,
        turfInfo: turf,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        status: getBookingStatus(booking)
      };
    });

    // Sort by creation time if available, else by date desc
    enhancedBookings.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    setBookings(enhancedBookings);
    calculateStats(enhancedBookings);
  };

  const getBookingStatus = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);

    // Use backend payment status to derive UI status
    const payStatus = booking.paymentStatus || booking.status;

    // Cancelled or failed/refunded are treated as cancelled for UI
    if (payStatus === 'cancelled') return 'cancelled';
    if (payStatus === 'failed' || payStatus === 'refunded') return 'cancelled';

    // Manual or online but not paid yet
    if (payStatus === 'pending') return 'pending';

    // Payment completed: past bookings are completed, future are confirmed
    if (payStatus === 'completed') {
      return bookingDate < today ? 'completed' : 'confirmed';
    }

    // Fallback based on date
    return bookingDate < today ? 'completed' : 'confirmed';
  };

  const calculateStats = (bookingsList) => {
    const stats = {
      total: bookingsList.length,
      completed: bookingsList.filter(b => b.status === 'completed').length,
      pending: bookingsList.filter(b => b.status === 'pending').length,
      cancelled: bookingsList.filter(b => b.status === 'cancelled').length,
      revenue: bookingsList
        .filter(b => b.status === 'completed' || b.status === 'confirmed')
        .reduce((sum, b) => sum + b.amount, 0)
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Turf filter
    if (filters.turf !== 'all') {
      filtered = filtered.filter(booking => String(booking.turfId) === String(filters.turf));
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(0, 0, 0, 0);
            return bookingDate.getTime() === filterDate.getTime();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(booking => new Date(booking.date) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(booking => new Date(booking.date) >= filterDate);
          break;
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.customerName || '').toLowerCase().includes(searchTerm) ||
        (booking.turfInfo?.name || '').toLowerCase().includes(searchTerm) ||
        (booking.bookingId || '').toLowerCase().includes(searchTerm)
      );
    }

    setFilteredBookings(filtered);
  };

  const confirmManualPayment = async (bookingId) => {
    try {
      const res = await turfOwnerService.confirmBookingPayment(bookingId);
      if (res?.success) {
        showNotification('success', 'Booking marked as paid');
        // Reload bookings to reflect update
        await loadBookings(owner.id, turfs);
      } else {
        showNotification('error', res?.message || 'Failed to confirm payment');
      }
    } catch (e) {
      showNotification('error', e.message || 'Failed to confirm payment');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'confirmed': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'cancelled': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FaCheckCircle />;
      case 'confirmed': return <FaCheckCircle />;
      case 'pending': return <FaHourglassHalf />;
      case 'cancelled': return <FaTimesCircle />;
      default: return <FaHourglassHalf />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (slots) => {
    if (!slots || slots.length === 0) return 'No slots';
    // Extract numeric hours from slot IDs like "slot-6"
    const hours = slots
      .map(slot => parseInt(String(slot).split('-')[1]))
      .filter(h => !isNaN(h))
      .sort((a, b) => a - b);

    if (hours.length === 0) return 'No slots';

    const startHour = hours[0];
    const lastHour = hours[hours.length - 1];
    const endHour = (lastHour + 1) % 24; // wrap midnight

    const fmt = (h) => `${h.toString().padStart(2, '0')}:00`;
    return `${fmt(startHour)} - ${fmt(endHour)}`;
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const StatCard = ({ icon, title, value, color = "emerald" }) => (
    <div className={`bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-${color}-500/50 transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold text-${color}-400 mt-1`}>{value}</p>
        </div>
        <div className={`bg-${color}-500/20 p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const BookingCard = ({ booking }) => (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{booking.turf?.name || booking.turfInfo?.name || booking.turfName || 'Turf Booking'}</h3>
          <p className="text-gray-400 text-sm">Booking ID: {booking.bookingId}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(booking.status)}`}>
          {getStatusIcon(booking.status)}
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      {/* Booking Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FaCalendarAlt className="text-cyan-400" />
            <span className="text-gray-300">{formatDate(booking.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaClock className="text-purple-400" />
            <span className="text-gray-300">{formatTime(booking.slots)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaRupeeSign className="text-emerald-400" />
            <span className="text-gray-300">₹{booking.amount}</span>
          </div>
          {booking.fieldConfig && (
            <div className="flex items-center gap-2 text-sm">
              <FaUsers className="text-blue-400" />
              <span className="text-gray-300">{booking.fieldConfig.name}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <FaUser className="text-blue-400" />
            <span className="text-gray-300">{booking.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaEnvelope className="text-pink-400" />
            <span className="text-gray-300 text-xs">{booking.customerEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FaPhone className="text-yellow-400" />
            <span className="text-gray-300">{booking.customerPhone}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <span className="text-sm text-gray-400">
          Payment: {booking.paymentMethod === 'manual' ? 'Pay at Venue' : 'Online Payment'}
        </span>
        <div className="flex items-center gap-2">
          {booking.paymentMethod === 'manual' && (booking.paymentStatus === 'pending' || booking.status === 'pending') && (
            <button
              onClick={() => confirmManualPayment(booking.bookingId)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Mark as Paid
            </button>
          )}
          {booking.status !== 'cancelled' && (
            <button
              onClick={() => cancelOwnerBooking(booking)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => navigate(`/booking/${booking.turfId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <FaEye className="text-xs" />
            View Turf
          </button>
        </div>
      </div>
    </div>
  );

  if (!owner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/owner/dashboard")}
            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Booking Management</h1>
            <p className="text-gray-400">Manage all your turf bookings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon={<FaCalendarAlt className="text-blue-400 text-xl" />}
            title="Total Bookings"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<FaCheckCircle className="text-green-400 text-xl" />}
            title="Completed"
            value={stats.completed}
            color="green"
          />
          <StatCard
            icon={<FaHourglassHalf className="text-yellow-400 text-xl" />}
            title="Pending"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<FaTimesCircle className="text-red-400 text-xl" />}
            title="Cancelled"
            value={stats.cancelled}
            color="red"
          />
          <StatCard
            icon={<FaRupeeSign className="text-emerald-400 text-xl" />}
            title="Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            color="emerald"
          />
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-emerald-400" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Turf Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Turf</label>
              <select
                value={filters.turf}
                onChange={(e) => handleFilterChange('turf', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white text-sm"
              >
                <option value="all">All Turfs</option>
                {turfs
                  .filter(turf => turf)
                  .map(turf => {
                    const tid = String(turf.turfId ?? turf._id ?? turf.id);
                    return (
                      <option key={tid} value={tid}>{turf.name}</option>
                    );
                  })}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search bookings..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-400 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              Bookings ({filteredBookings.length})
            </h2>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 text-center">
              <FaCalendarAlt className="text-6xl text-gray-600 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">No Bookings Found</h3>
              <p className="text-gray-400">
                {bookings.length === 0 
                  ? "You haven't received any bookings yet."
                  : "No bookings match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking.bookingId} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurfBookingManagement;
