import turfService from './turfService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class TurfOwnerService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/turf-owners`;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('turfOwnerToken');
  }

  // Set auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Owner Authentication
  async register(ownerData) {
    try {
      console.log('TurfOwnerService: Attempting registration to:', `${this.baseURL}/register`);
      console.log('TurfOwnerService: Registration data:', ownerData);

      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ownerData)
      });

      console.log('TurfOwnerService: Response status:', response.status);
      console.log('TurfOwnerService: Response ok:', response.ok);

      const data = await response.json();
      console.log('TurfOwnerService: Response data:', data);
      
      if (data.success) {
        localStorage.setItem('turfOwnerToken', data.token);
        localStorage.setItem('turfOwner', JSON.stringify(data.owner));
      }
      
      return data;
    } catch (error) {
      console.error('TurfOwnerService: Registration error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      console.log('TurfOwnerService: Attempting login to:', `${this.baseURL}/login`);
      console.log('TurfOwnerService: Login credentials:', { email: credentials.email });

      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      console.log('TurfOwnerService: Login response status:', response.status);
      console.log('TurfOwnerService: Login response ok:', response.ok);

      const data = await response.json();
      console.log('TurfOwnerService: Login response data:', data);
      
      if (data.success) {
        localStorage.setItem('turfOwnerToken', data.token);
        localStorage.setItem('turfOwner', JSON.stringify(data.owner));
      }
      
      return data;
    } catch (error) {
      console.error('TurfOwnerService: Login error:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('turfOwnerToken');
    localStorage.removeItem('turfOwner');
  }

  // Owner Profile
  async getProfile() {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  // Turf Management
  async createTurf(turfData) {
    try {
      console.log('TurfOwnerService: Creating turf with data:', turfData);
      console.log('TurfOwnerService: Auth headers:', this.getAuthHeaders());
      console.log('TurfOwnerService: Request URL:', `${this.baseURL}/turfs`);

      const response = await fetch(`${this.baseURL}/turfs`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(turfData)
      });

      console.log('TurfOwnerService: Create turf response status:', response.status);
      console.log('TurfOwnerService: Create turf response ok:', response.ok);

      const data = await response.json();
      console.log('TurfOwnerService: Create turf response data:', data);
      
      // Update local storage if successful
      if (data.success) {
        console.log('TurfOwnerService: Turf created successfully, syncing with localStorage');
        this.syncWithLocalStorage();
        
        // Clear turf caches so user-side pages refresh with new data
        turfService.clearTurfCaches();
      } else {
        console.error('TurfOwnerService: Turf creation failed:', data);
      }
      
      return data;
    } catch (error) {
      console.error('TurfOwnerService: Create turf error:', error);
      console.error('TurfOwnerService: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  async getTurfs() {
    try {
      const response = await fetch(`${this.baseURL}/turfs`, {
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      // Update local storage
      if (data.success) {
        localStorage.setItem('ownerTurfs', JSON.stringify(data.turfs));
      }
      
      return data;
    } catch (error) {
      console.error('Get turfs error:', error);
      throw error;
    }
  }

  async updateTurf(turfId, turfData) {
    try {
      const response = await fetch(`${this.baseURL}/turfs/${turfId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(turfData)
      });

      const data = await response.json();
      
      // Update local storage if successful
      if (data.success) {
        this.syncWithLocalStorage();
        
        // Clear turf caches so user-side pages refresh with updated data
        turfService.clearTurfCaches();
      }
      
      return data;
    } catch (error) {
      console.error('Update turf error:', error);
      throw error;
    }
  }

  async deleteTurf(turfId) {
    try {
      const response = await fetch(`${this.baseURL}/turfs/${turfId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      // Update local storage if successful
      if (data.success) {
        this.syncWithLocalStorage();
        
        // Clear turf caches so user-side pages refresh without deleted turf
        turfService.clearTurfCaches();
      }
      
      return data;
    } catch (error) {
      console.error('Delete turf error:', error);
      throw error;
    }
  }

  // Booking Management
  async getBookings() {
    try {
      const response = await fetch(`${this.baseURL}/bookings`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  }

  // Confirm a manual booking as paid (owner action)
  async confirmBookingPayment(bookingId) {
    try {
      const response = await fetch(`${this.baseURL}/bookings/${bookingId}/confirm`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Confirm booking payment error:', error);
      throw error;
    }
  }

  // Cancel a booking (owner action)
  async cancelBooking(bookingId, reason = '') {
    try {
      console.log('TurfOwnerService: Cancelling booking:', bookingId, 'with reason:', reason);
      console.log('TurfOwnerService: Request URL:', `${this.baseURL}/bookings/${bookingId}/cancel`);
      console.log('TurfOwnerService: Auth headers:', this.getAuthHeaders());

      const response = await fetch(`${this.baseURL}/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      console.log('TurfOwnerService: Cancel booking response status:', response.status);
      console.log('TurfOwnerService: Cancel booking response ok:', response.ok);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('TurfOwnerService: Expected JSON but got:', contentType);
        console.error('TurfOwnerService: Response text:', text.substring(0, 500));
        throw new Error(`Server returned ${contentType} instead of JSON. Response: ${text.substring(0, 200)}...`);
      }

      const data = await response.json();
      console.log('TurfOwnerService: Cancel booking response data:', data);
      return data;
    } catch (error) {
      console.error('Cancel booking (owner) error:', error);
      throw error;
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    try {
      const response = await fetch(`${this.baseURL}/dashboard/stats`, {
        headers: this.getAuthHeaders()
      });

      return await response.json();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  // Sync with local storage (for offline functionality)
  async syncWithLocalStorage() {
    try {
      const turfsData = await this.getTurfs();
      if (turfsData.success) {
        localStorage.setItem('ownerTurfs', JSON.stringify(turfsData.turfs));
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Check if owner is authenticated
  isAuthenticated() {
    const token = this.getAuthToken();
    console.log('TurfOwnerService: Checking authentication, token:', token ? 'Present' : 'Missing');
    return !!token;
  }

  // Get current owner from localStorage
  getCurrentOwner() {
    const ownerData = localStorage.getItem('turfOwner');
    return ownerData ? JSON.parse(ownerData) : null;
  }

  // Test backend connection
  async testConnection() {
    try {
      console.log('TurfOwnerService: Testing backend connection...');
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`, {
        method: 'GET'
      });
      
      console.log('TurfOwnerService: Connection test response:', response.status, response.ok);
      
      if (response.ok) {
        const text = await response.text();
        console.log('TurfOwnerService: Backend response:', text);
        return { success: true, message: text };
      } else {
        return { success: false, message: `Server responded with status ${response.status}` };
      }
    } catch (error) {
      console.error('TurfOwnerService: Connection test failed:', error);
      return { success: false, message: error.message };
    }
  }
}

const turfOwnerServiceInstance = new TurfOwnerService();
export default turfOwnerServiceInstance;
