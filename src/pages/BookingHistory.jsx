import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaRupeeSign, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSpinner } from 'react-icons/fa';
import bookingService from '../services/bookingService';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookingsDetailed();
      
      if (response.success) {
        // Sort bookings by date (newest first)
        const sortedBookings = response.bookings.sort((a, b) => 
          new Date(b.bookingDate || b.createdAt) - new Date(a.bookingDate || a.createdAt)
        );
        setBookings(sortedBookings);
      } else {
        setError(response.message || 'Failed to fetch booking history');
      }
    } catch (err) {
      console.error('Error fetching booking history:', err);
      setError('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return <FaCheckCircle className="text-green-500" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      case 'pending':
        return <FaHourglassHalf className="text-yellow-500" />;
      default:
        return <FaHourglassHalf className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'text-green-500 bg-green-500/10 border-green-500/30';
      case 'cancelled':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-emerald-400">
              <FaSpinner className="animate-spin text-2xl" />
              <span className="text-lg">Loading booking history...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Booking History
          </h1>
          <p className="text-gray-400">View all your turf bookings and their status</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="text-gray-500 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Bookings Found</h3>
            <p className="text-gray-500">You haven't made any turf bookings yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking._id || booking.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {booking.turf?.name || booking.turfDetails?.name || booking.turfName || 'Turf Booking'}
                      </h3>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(booking.paymentStatus || booking.status)}`}>
                        {getStatusIcon(booking.paymentStatus || booking.status)}
                        <span className="capitalize">{booking.paymentStatus || booking.status || 'pending'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Date */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaCalendarAlt className="text-emerald-400" />
                        <span>{formatDate(booking.bookingDate || booking.date)}</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaClock className="text-cyan-400" />
                        <span>{formatTime(booking.timeSlot || booking.time)}</span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaMapMarkerAlt className="text-red-400" />
                        <span>{booking.turf?.address || booking.turf?.location || booking.turfDetails?.location || booking.location || 'Location not available'}</span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2 text-gray-300">
                        <FaRupeeSign className="text-yellow-400" />
                        <span>₹{booking.totalAmount || booking.amount || '0'}</span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    {(booking.customerName || booking.customerPhone) && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          {booking.customerName && (
                            <span>Customer: {booking.customerName}</span>
                          )}
                          {booking.customerPhone && (
                            <span>Phone: {booking.customerPhone}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Booking ID */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                    <p className="text-sm font-mono text-gray-300">
                      {booking._id?.slice(-8) || booking.id?.slice(-8) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;
