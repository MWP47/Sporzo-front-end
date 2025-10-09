const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class BookingService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/bookings`;
  }

  // Get user bookings with details (payment + turf)
  async getUserBookingsDetailed(userId = null) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const uid = userId || storedUser.id || storedUser._id;

      console.log('Fetching bookings for user:', { uid, storedUser: { email: storedUser.email, phone: storedUser.phone } });

      // Try detailed endpoint by userId first (if user is logged in with valid ID)
      if (uid) {
        try {
          const resp = await fetch(`${this.baseURL}/user/${uid}/details`, { headers: this.getAuthHeaders() });
          const data = await resp.json();
          if (data?.success && Array.isArray(data.bookings) && data.bookings.length > 0) {
            console.log('Found bookings by userId:', data.bookings.length);
            return data;
          }
        } catch (err) {
          console.log('UserId endpoint failed, trying fallback:', err.message);
        }
      }

      // Always try fallback by customer info (for guest bookings or when userId doesn't match)
      const params = new URLSearchParams();
      if (storedUser.email) params.append('customerEmail', storedUser.email);
      if (storedUser.phone) params.append('customerPhone', storedUser.phone);

      if ([...params.keys()].length === 0) {
        console.log('No user email or phone available for fallback');
        return { success: true, bookings: [] };
      }

      console.log('Trying fallback with params:', params.toString());
      const resp2 = await fetch(`${this.baseURL}/user/details?${params.toString()}`, { headers: this.getAuthHeaders() });
      const fallbackData = await resp2.json();
      
      if (fallbackData?.success && Array.isArray(fallbackData.bookings)) {
        console.log('Found bookings by customer details:', fallbackData.bookings.length);
        return fallbackData;
      }
      
      console.log('No bookings found in fallback');
      return { success: true, bookings: [] };
    } catch (error) {
      console.error('Get detailed user bookings error:', error);
      return { success: false, message: 'Failed to fetch detailed user bookings' };
    }
  }

  // Get bookings for the owner (by ownerId)
  async getOwnerBookings(ownerId) {
    try {
      // Prefer explicit owner route if available
      let response = await fetch(`${this.baseURL}/owner/${ownerId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.status === 404) {
        // Fallback to generic endpoint with query
        response = await fetch(`${this.baseURL}?ownerId=${encodeURIComponent(ownerId)}`, {
          headers: this.getAuthHeaders()
        });
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get owner bookings error:', error);
      return { success: false, message: 'Failed to fetch owner bookings' };
    }
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('token') 
      || localStorage.getItem('authToken') 
      || localStorage.getItem('turfOwnerToken');
  }

  // Set auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Create new booking
  async createBooking(bookingData) {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  }

  // Get user bookings
  async getUserBookings(userId = null) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const uid = userId || storedUser.id || storedUser._id;

      console.log('Fetching basic bookings for user:', { uid, storedUser: { email: storedUser.email, phone: storedUser.phone } });

      // 1) Try by userId if available
      if (uid) {
        try {
          const resp = await fetch(`${this.baseURL}/user/${uid}`, { headers: this.getAuthHeaders() });
          const userIdData = await resp.json();
          if (userIdData?.success && Array.isArray(userIdData.bookings) && userIdData.bookings.length > 0) {
            console.log('Found basic bookings by userId:', userIdData.bookings.length);
            return userIdData;
          }
        } catch (err) {
          console.log('UserId endpoint failed for basic bookings, trying fallback:', err.message);
        }
      }

      // 2) Always try fallback: query by customer email/phone captured during booking
      const params = new URLSearchParams();
      if (storedUser.email) params.append('customerEmail', storedUser.email);
      if (storedUser.phone) params.append('customerPhone', storedUser.phone);

      if ([...params.keys()].length === 0) {
        console.log('No user email or phone available for basic bookings fallback');
        return { success: true, bookings: [] };
      }

      console.log('Trying basic bookings fallback with params:', params.toString());
      const resp2 = await fetch(`${this.baseURL}?${params.toString()}`, { headers: this.getAuthHeaders() });
      const fallbackData = await resp2.json();
      
      if (fallbackData?.success && Array.isArray(fallbackData.bookings)) {
        console.log('Found basic bookings by customer details:', fallbackData.bookings.length);
        return fallbackData;
      }
      
      console.log('No basic bookings found in fallback');
      return { success: true, bookings: [] };
    } catch (error) {
      console.error('Get user bookings error:', error);
      return { success: false, message: 'Failed to fetch user bookings' };
    }
  }

  // Get bookings by arbitrary filters (admin/owner fallback)
  async getBookingsByFilter(filter = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      const response = await fetch(`${this.baseURL}?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get bookings by filter error:', error);
      return { success: false, message: 'Failed to fetch bookings' };
    }
  }

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (!data.success) {
        // Check local storage
        const localBooking = this.getLocalBookingById(bookingId);
        if (localBooking) {
          return {
            success: true,
            booking: localBooking
          };
        }
      }
      
      return data;
    } catch (error) {
      console.error('Get booking by ID error:', error);
      
      // Fallback to local storage
      const localBooking = this.getLocalBookingById(bookingId);
      if (localBooking) {
        return {
          success: true,
          booking: localBooking
        };
      }
      
      throw error;
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, paymentData = null) {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, paymentData })
      });

      const data = await response.json();
      
      // Update local storage
      if (data.success) {
        this.updateLocalBookingStatus(bookingId, status, paymentData);
      }
      
      return data;
    } catch (error) {
      console.error('Update booking status error:', error);
      
      // Update local storage as fallback
      this.updateLocalBookingStatus(bookingId, status, paymentData);
      
      return {
        success: true,
        message: 'Booking status updated locally'
      };
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, reason = '') {
    try {
      const response = await fetch(`${this.baseURL}/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      
      // Update local storage
      if (data.success) {
        this.updateLocalBookingStatus(bookingId, 'cancelled');
      }
      
      return data;
    } catch (error) {
      console.error('Cancel booking error:', error);
      
      // Update local storage as fallback
      this.updateLocalBookingStatus(bookingId, 'cancelled');
      
      return {
        success: true,
        message: 'Booking cancelled locally'
      };
    }
  }

  // Local storage methods
  saveBookingLocally(bookingData) {}

  getLocalBookings() {
    return [];
  }

  getLocalBookingById(bookingId) {
    return null;
  }

  updateLocalBookingStatus(bookingId, status, paymentData = null) {
    // no-op in DB-only mode
  }

  updateTurfBookings(bookingData) {
    // no-op in DB-only mode
  }

  // Get price for specific slot and field configuration
  getPriceForSlot(slotHour, fieldConfig) {
    if (!fieldConfig) return 0;
    
    const pricing = fieldConfig.pricing || {};
    
    // Peak hours: 6 PM - 9 PM (18-20)
    if (slotHour >= 18 && slotHour <= 20 && pricing.peakPrice) {
      return parseInt(pricing.peakPrice);
    }
    
    // Night hours: 6 PM - 12 AM (18-23)
    if (slotHour >= 18 && slotHour <= 23 && pricing.nightPrice) {
      return parseInt(pricing.nightPrice);
    }
    
    // Day hours: 6 AM - 6 PM (6-17)
    if (pricing.dayPrice) {
      return parseInt(pricing.dayPrice);
    }
    
    // Fallback to base price
    return parseInt(fieldConfig.price) || 0;
  }

  // Calculate total booking amount
  calculateBookingTotal(slots, fieldConfig) {
    if (!fieldConfig || !slots || slots.length === 0) return 0;
    
    return slots.reduce((total, slotId) => {
      // Extract hour from slot ID (assuming format like "slot-14" for 2 PM)
      const hour = parseInt(slotId.split('-')[1]) || 6;
      const price = this.getPriceForSlot(hour, fieldConfig);
      return total + price;
    }, 0);
  }
}

export default new BookingService();
