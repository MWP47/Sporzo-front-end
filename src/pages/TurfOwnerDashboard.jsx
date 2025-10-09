import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlus, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaCalendarAlt, 
  FaRupeeSign,
  FaUsers,
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaChartLine,
  FaBuilding,
  FaSignOutAlt,
  FaCheckCircle,
  FaHourglassHalf
} from "react-icons/fa";
import Notification from "../components/Notification";
import turfOwnerService from "../services/turfOwnerService";

const TurfOwnerDashboard = () => {
  const [owner, setOwner] = useState(null);
  const [turfs, setTurfs] = useState([]);
  const [stats, setStats] = useState({
    totalTurfs: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    completedBookings: 0,
    pendingBookings: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!turfOwnerService.isAuthenticated()) {
      navigate("/owner/login");
      return;
    }

    const ownerData = turfOwnerService.getCurrentOwner();
    setOwner(ownerData);

    // Load dashboard data from backend
    loadDashboardData();
  }, [navigate]);

  const loadOwnerTurfs = (ownerId) => {
    // Get turfs from localStorage (in real app, this would be from API)
    const allTurfs = JSON.parse(localStorage.getItem("ownerTurfs")) || [];
    const ownerTurfs = allTurfs.filter(turf => turf.ownerId === ownerId);
    setTurfs(ownerTurfs);
  };

  const loadStats = (ownerId) => {
    // Calculate stats from localStorage data
    const allTurfs = JSON.parse(localStorage.getItem("ownerTurfs")) || [];
    const ownerTurfs = allTurfs.filter(turf => turf.ownerId === ownerId);
    
    const bookings = JSON.parse(localStorage.getItem("turfBookings")) || {};
    const payments = JSON.parse(localStorage.getItem("payments")) || [];
    
    // Calculate total bookings and revenue for owner's turfs
    let totalBookings = 0;
    let totalRevenue = 0;
    
    ownerTurfs.forEach(turf => {
      const turfBookings = Object.keys(bookings).filter(key => key.includes(`${turf.id}-`));
      totalBookings += turfBookings.length;
      
      const turfPayments = payments.filter(payment => payment.turfId === turf.id.toString());
      totalRevenue += turfPayments.reduce((sum, payment) => sum + payment.amount, 0);
    });

    const averageRating = ownerTurfs.length > 0 
      ? ownerTurfs.reduce((sum, turf) => sum + (turf.rating || 4.5), 0) / ownerTurfs.length 
      : 0;

    setStats({
      totalTurfs: ownerTurfs.length,
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10
    });
  };

  const loadDashboardData = async () => {
    const ownerData = turfOwnerService.getCurrentOwner();
    let backendTurfs = [];
    let backendStats = null;

    try {
      console.log('Dashboard: Loading turfs from backend...');
      
      // Load turfs from backend
      const turfsResult = await turfOwnerService.getTurfs();
      if (turfsResult.success) {
        backendTurfs = turfsResult.turfs || [];
        console.log('Dashboard: Backend turfs loaded:', backendTurfs.length);
      }

      // Load dashboard stats from backend
      const statsResult = await turfOwnerService.getDashboardStats();
      if (statsResult.success) {
        backendStats = statsResult.stats;
        console.log('Dashboard: Backend stats loaded:', backendStats);
      }
    } catch (error) {
      console.error('Dashboard: Error loading from backend:', error);
    }

    // Always load and merge localStorage data
    if (ownerData) {
      console.log('Dashboard: Loading local turfs for owner:', ownerData.id);
      
      const allLocalTurfs = JSON.parse(localStorage.getItem("ownerTurfs")) || [];
      const localTurfs = allLocalTurfs.filter(turf => turf.ownerId === ownerData.id);
      
      console.log('Dashboard: Local turfs found:', localTurfs.length);

      // Merge backend and local turfs (remove duplicates)
      const mergedTurfs = [...backendTurfs];
      
      localTurfs.forEach(localTurf => {
        // Check if this turf already exists in backend data
        const existsInBackend = backendTurfs.some(backendTurf => 
          backendTurf.id === localTurf.id || 
          backendTurf._id === localTurf.id ||
          (backendTurf.name === localTurf.name && backendTurf.location === localTurf.location)
        );
        
        if (!existsInBackend) {
          console.log('Dashboard: Adding local turf to merged list:', localTurf.name);
          mergedTurfs.push({
            ...localTurf,
            isLocalTurf: true // Mark as local for identification
          });
        }
      });

      console.log('Dashboard: Final merged turfs:', mergedTurfs.length);
      setTurfs(mergedTurfs);

      // Use backend stats if available, otherwise calculate from local data
      // Build final stats object
      let finalStats = backendStats ? { ...backendStats } : null;

      // If backend stats are missing, calculate from local as fallback
      if (!finalStats) {
        console.log('Dashboard: Calculating stats from local data');
        // Call existing local loader to update UI; also prepare a minimal object
        loadStats(ownerData.id);
        finalStats = null; // will be replaced by bookings aggregation below if possible
      }

      // Enrich with live bookings for pending/paid counts
      try {
        const bookingsRes = await turfOwnerService.getBookings();
        if (bookingsRes?.success && Array.isArray(bookingsRes.bookings)) {
          const all = bookingsRes.bookings;
          const paid = all.filter(b => b.paymentStatus === 'completed').length;
          const pending = all.filter(b => b.paymentStatus === 'pending').length;
          const totalRevenue = all
            .filter(b => b.paymentStatus === 'completed')
            .reduce((sum, b) => sum + (Number(b.totalAmount) || Number(b.amount) || 0), 0);

          const combined = {
            totalTurfs: mergedTurfs.length,
            totalBookings: all.length,
            totalRevenue: totalRevenue,
            averageRating: finalStats?.averageRating || stats.averageRating || 0,
            completedBookings: paid,
            pendingBookings: pending,
            ...(finalStats || {})
          };

          setStats(combined);
        } else if (finalStats) {
          setStats({
            ...finalStats,
            totalTurfs: mergedTurfs.length,
            pendingBookings: finalStats.pendingBookings || 0
          });
        }
      } catch (err) {
        console.warn('Dashboard: Failed to load bookings for stats', err);
        if (finalStats) {
          setStats({ ...finalStats, totalTurfs: mergedTurfs.length });
        }
      }
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleLogout = () => {
    turfOwnerService.logout();
    navigate("/owner/login");
  };

  const handleAddTurf = () => {
    navigate("/owner/turf-management");
  };

  const handleEditTurf = (turf) => {
    // Handle both backend turfs (_id) and localStorage turfs (id)
    const turfId = turf._id || turf.id;
    navigate(`/owner/turf-management/edit/${turfId}`);
  };

  const syncLocalTurfsToBackend = async () => {
    const ownerData = turfOwnerService.getCurrentOwner();
    if (!ownerData) return;

    const allLocalTurfs = JSON.parse(localStorage.getItem("ownerTurfs")) || [];
    const localTurfs = allLocalTurfs.filter(turf => 
      turf.ownerId === ownerData.id && turf.isBackendTurf !== true
    );

    console.log('Syncing local turfs to backend:', localTurfs.length);
    showNotification("info", `Attempting to sync ${localTurfs.length} local turfs to backend...`);

    for (const localTurf of localTurfs) {
      try {
        console.log('Syncing turf:', localTurf.name);
        const result = await turfOwnerService.createTurf(localTurf);
        
        if (result.success) {
          console.log('Successfully synced turf:', localTurf.name);
        } else {
          console.error('Failed to sync turf:', localTurf.name, result.message);
        }
      } catch (error) {
        console.error('Error syncing turf:', localTurf.name, error);
      }
    }

    // Reload dashboard data after sync
    loadDashboardData();
  };

  const handleViewTurf = (turf) => {
    // Handle both backend turfs (_id) and localStorage turfs (id)
    const turfId = turf._id || turf.id;
    navigate(`/booking/${turfId}`);
  };
  const handleDeleteTurf = async (turfId) => {
    if (window.confirm("Are you sure you want to delete this turf? This action cannot be undone.")) {
      try {
        const result = await turfOwnerService.deleteTurf(turfId);
        
        if (result.success) {
          loadDashboardData();
          showNotification("success", "Turf deleted successfully");
        } else {
          showNotification("error", result.message || "Failed to delete turf");
        }
      } catch (error) {
        console.error("Error deleting turf:", error);
        
        // Fallback to local deletion
        const allTurfs = JSON.parse(localStorage.getItem("ownerTurfs")) || [];
        const updatedTurfs = allTurfs.filter(turf => turf.id !== turfId);
        localStorage.setItem("ownerTurfs", JSON.stringify(updatedTurfs));
        
        loadDashboardData();
        showNotification("success", "Turf deleted successfully (local)");
      }
    }
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

  const TurfCard = ({ turf }) => (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all">
      {/* Turf Image */}
      <div className="relative mb-4">
        <img
          src={turf.images?.[0] || "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400"}
          alt={turf.name}
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
          <FaStar className="text-yellow-400 text-sm" />
          <span className="text-white text-sm font-semibold">{turf.rating && !isNaN(turf.rating) ? turf.rating.toFixed(1) : '4.5'}</span>
        </div>
        {turf.isLocalTurf && (
          <div className="absolute top-2 left-2 bg-orange-500/90 backdrop-blur-sm rounded-full px-2 py-1">
            <span className="text-white text-xs font-semibold">Local</span>
          </div>
        )}
      </div>

      {/* Turf Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{turf.name}</h3>
          <div className="space-y-1">
            <p className="text-gray-400 flex items-center gap-1 text-sm">
              <FaMapMarkerAlt className="text-cyan-400" />
              {turf.location}
            </p>
            {turf.address && (
              <p className="text-gray-500 text-xs pl-5">
                {turf.address}
              </p>
            )}
          </div>
        </div>

        <div className="text-sm">
          <span className="text-gray-400 block mb-1">Pricing:</span>
          {turf.fieldConfigurations && turf.fieldConfigurations.length > 0 ? (
            <div className="space-y-1">
              {turf.fieldConfigurations.map((config) => {
                const pricing = config.pricing || {};
                const prices = [];
                if (pricing.dayPrice) prices.push(parseInt(pricing.dayPrice));
                if (pricing.nightPrice) prices.push(parseInt(pricing.nightPrice));
                if (pricing.peakPrice) prices.push(parseInt(pricing.peakPrice));
                if (prices.length === 0 && config.price) prices.push(parseInt(config.price));
                
                const min = prices.length > 0 ? Math.min(...prices) : 0;
                const max = prices.length > 0 ? Math.max(...prices) : 0;
                const priceDisplay = min === max ? `₹${min}` : `₹${min}-₹${max}`;
                
                return (
                  <div key={config.id} className="flex justify-between">
                    <span className="text-gray-300 text-xs">{config.type}:</span>
                    <span className="text-emerald-400 font-semibold">{priceDisplay}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-emerald-400 font-bold text-lg">₹{turf.price}</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <FaClock className="text-cyan-400" />
            <span>{turf.timings || "6 AM - 10 PM"}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaUsers className="text-purple-400" />
            <span>{turf.capacity || "11v11"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-700">
          <button
            onClick={() => handleViewTurf(turf)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <FaEye className="text-xs" />
            View
          </button>
          <button
            onClick={() => handleEditTurf(turf)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <FaEdit className="text-xs" />
            Edit
          </button>
          <button
            onClick={() => handleDeleteTurf(turf._id || turf.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
          >
            <FaTrash className="text-xs" />
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

      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-12 h-12 rounded-full flex items-center justify-center">
                <FaBuilding className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Owner Dashboard</h1>
                <p className="text-gray-400">Welcome back, {owner.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <StatCard
            icon={<FaBuilding className="text-emerald-400 text-xl" />}
            title="Total Turfs"
            value={stats.totalTurfs}
            color="emerald"
          />
          <StatCard
            icon={<FaCalendarAlt className="text-blue-400 text-xl" />}
            title="Total Bookings"
            value={stats.totalBookings}
            color="blue"
          />
          <StatCard
            icon={<FaRupeeSign className="text-yellow-400 text-xl" />}
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            color="yellow"
          />
          <StatCard
            icon={<FaStar className="text-purple-400 text-xl" />}
            title="Avg Rating"
            value={stats.averageRating && !isNaN(stats.averageRating) ? stats.averageRating.toFixed(1) : '0.0'}
            color="purple"
          />
          <StatCard
            icon={<FaCheckCircle className="text-green-400 text-xl" />}
            title="Paid Bookings"
            value={stats.completedBookings}
            color="green"
          />
          <StatCard
            icon={<FaHourglassHalf className="text-orange-400 text-xl" />}
            title="Pending Bookings"
            value={stats.pendingBookings}
            color="orange"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('turfs')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'turfs'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Turfs ({turfs.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleAddTurf}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white p-4 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaPlus />
                  Add New Turf
                </button>
                <button
                  onClick={() => navigate('/owner/bookings')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaCalendarAlt />
                  View Bookings
                </button>
                <button
                  onClick={() => navigate('/owner/analytics')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FaChartLine />
                  Analytics
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {turfs.length === 0 ? (
                  <div className="text-center py-8">
                    <FaBuilding className="text-4xl text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No turfs added yet</p>
                    <button
                      onClick={handleAddTurf}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Your First Turf
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <p>• You have {turfs.length} turf(s) listed</p>
                    <p>• Total bookings received: {stats.totalBookings}</p>
                    <p>• Average rating across all turfs: {stats.averageRating && !isNaN(stats.averageRating) ? stats.averageRating.toFixed(1) : '0.0'}/5</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'turfs' && (
          <div>
            {/* Add Turf Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">My Turfs</h2>
              <div className="flex gap-3">
                <button
                  onClick={syncLocalTurfsToBackend}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                  title="Sync local turfs to backend"
                >
                  <FaChartLine />
                  Sync
                </button>
                <button
                  onClick={handleAddTurf}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  <FaPlus />
                  Add New Turf
                </button>
              </div>
            </div>

            {/* Turfs Grid */}
            {turfs.length === 0 ? (
              <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 text-center">
                <FaBuilding className="text-6xl text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">No Turfs Added Yet</h3>
                <p className="text-gray-400 mb-6">Start by adding your first turf to begin receiving bookings</p>
                <button
                  onClick={handleAddTurf}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <FaPlus />
                  Add Your First Turf
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {turfs.map((turf) => (
                  <TurfCard key={turf.id} turf={turf} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TurfOwnerDashboard;
