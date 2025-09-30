import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaHistory, FaFutbol, FaClock } from "react-icons/fa";
import Header from "../components/Header";
import Notification from "../components/Notification";

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [bookingHistory, setBookingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'bookings'
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Load user data
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
      setEditedUser(userData);
    } else {
      navigate("/login");
    }

    // Load booking history
    loadBookingHistory();
  }, [navigate]);

  const loadBookingHistory = () => {
    const bookings = JSON.parse(localStorage.getItem("turfBookings")) || {};
    const history = [];

    Object.keys(bookings).forEach(key => {
      const [turfId, date, slotId] = key.split('-');
      const slot = slotId.replace('slot-', '');
      
      history.push({
        id: key,
        turfId: parseInt(turfId),
        turfName: getTurfName(parseInt(turfId)),
        date,
        time: `${slot}:00 - ${parseInt(slot) + 1}:00`,
        status: new Date(date) < new Date() ? 'completed' : 'upcoming'
      });
    });

    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    setBookingHistory(history);
  };

  const getTurfName = (turfId) => {
    const turfNames = ['Elite Turf Arena', 'Pro Stadium', 'Champion Field', 'Victory Arena', 'Legends Ground', 'Golden Boot Stadium'];
    return turfNames[(turfId - 1) % turfNames.length];
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Validate required fields
    if (!editedUser.name || !editedUser.email || !editedUser.phone) {
      setNotification({ type: 'error', message: 'Please fill in all required fields!' });
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(editedUser.phone)) {
      setNotification({ type: 'error', message: 'Please enter a valid phone number!' });
      return;
    }

    localStorage.setItem("user", JSON.stringify(editedUser));
    setUser(editedUser);
    setIsEditing(false);
    setNotification({ type: 'success', message: 'Profile updated successfully!' });
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedUser({ ...editedUser, [field]: value });
  };

  const cancelBooking = (bookingId) => {
    const bookings = JSON.parse(localStorage.getItem("turfBookings")) || {};
    delete bookings[bookingId];
    localStorage.setItem("turfBookings", JSON.stringify(bookings));
    loadBookingHistory();
    setNotification({ type: 'success', message: 'Booking cancelled successfully!' });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  if (!user) {
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-400">Manage your account and view booking history</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === 'profile'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUser /> Profile
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === 'bookings'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaHistory /> Booking History ({bookingHistory.length})
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="md:col-span-1">
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <FaUser className="text-6xl text-black" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                <p className="text-gray-400 mb-4">{user.email}</p>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <FaSave /> Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats Card */}
              <div className="mt-6 bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Booking Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Bookings</span>
                    <span className="text-2xl font-bold text-emerald-400">{bookingHistory.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Upcoming</span>
                    <span className="text-xl font-bold text-cyan-400">
                      {bookingHistory.filter(b => b.status === 'upcoming').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-xl font-bold text-gray-400">
                      {bookingHistory.filter(b => b.status === 'completed').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="md:col-span-2">
              <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-2xl font-bold mb-6">Account Information</h3>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <FaUser className="inline mr-2" /> Full Name
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                      />
                    ) : (
                      <div className="bg-gray-700/50 px-4 py-3 rounded-lg">{user.name}</div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <FaEnvelope className="inline mr-2" /> Email Address
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                      />
                    ) : (
                      <div className="bg-gray-700/50 px-4 py-3 rounded-lg">{user.email}</div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <FaPhone className="inline mr-2" /> Phone Number
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedUser.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        required
                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                      />
                    ) : (
                      <div className="bg-gray-700/50 px-4 py-3 rounded-lg">{user.phone || 'Not provided'}</div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <FaMapMarkerAlt className="inline mr-2" /> Location
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, State"
                        className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-emerald-400 focus:outline-none"
                      />
                    ) : (
                      <div className="bg-gray-700/50 px-4 py-3 rounded-lg">{user.location || 'Not provided'}</div>
                    )}
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <FaCalendar className="inline mr-2" /> Member Since
                    </label>
                    <div className="bg-gray-700/50 px-4 py-3 rounded-lg">
                      {user.memberSince || new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-2xl font-bold mb-6">Booking History</h3>
            
            {bookingHistory.length === 0 ? (
              <div className="text-center py-12">
                <FaFutbol className="text-6xl text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-4">No bookings yet</p>
                <button
                  onClick={() => navigate('/browse')}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Browse Turfs
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingHistory.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-600 hover:border-emerald-500/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FaFutbol className="text-emerald-400 text-xl" />
                          <h4 className="text-lg font-bold">{booking.turfName}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'upcoming'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                          }`}>
                            {booking.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-emerald-400" />
                            {new Date(booking.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className="text-cyan-400" />
                            {booking.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/booking/${booking.turfId}`)}
                          className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors"
                        >
                          View Details
                        </button>
                        {booking.status === 'upcoming' && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
