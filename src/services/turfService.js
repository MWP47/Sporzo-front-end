const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class TurfService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/turfs`;
  }

  // Clear all turf caches when data is updated
  clearTurfCaches() {
    try {
      sessionStorage.removeItem('turfs_cache');
      sessionStorage.removeItem('turfs_cache_all');
      console.log('Turf caches cleared');
    } catch (error) {
      console.warn('Error clearing turf caches:', error);
    }
  }

  // Force refresh turfs (bypass cache)
  async getAllTurfsForceRefresh(filters = {}) {
    this.clearTurfCaches();
    return this.getAllTurfs(filters);
  }

  // Get all turfs with filters
  async getAllTurfs(filters = {}) {
    try {
      // By default, show only turfs created by owners (exclude seeded/demo)
      const effectiveFilters = {
        onlyOwnerCreated: filters.onlyOwnerCreated !== undefined ? filters.onlyOwnerCreated : true,
        ...filters
      };

      const queryParams = new URLSearchParams();
      
      Object.keys(effectiveFilters).forEach(key => {
        if (effectiveFilters[key] !== undefined && effectiveFilters[key] !== null && effectiveFilters[key] !== '') {
          queryParams.append(key, effectiveFilters[key]);
        }
      });
      const response = await fetch(`${this.baseURL}?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        const processedTurfs = data.turfs.map(turf => ({
          ...turf,
          priceRange: this.calculatePriceRange(turf),
          image: turf.images && turf.images.length > 0 
            ? turf.images[turf.mainImageIndex || 0] || turf.images[0]
            : turf.image,
          isBackendTurf: true
        }));
        return { ...data, turfs: processedTurfs };
      }
      return data;
    } catch (error) {
      console.error('Get turfs error:', error);
      return { success: false, message: 'Failed to fetch turfs' };
    }
  }
  
  // Get turf by ID
  async getTurfById(turfId) {
    try {
      console.log('TurfService: Getting turf by ID:', turfId);
      const response = await fetch(`${this.baseURL}/${turfId}`);
      const data = await response.json();
      if (data.success && data.turf) {
        return {
          ...data,
          turf: {
            ...data.turf,
            image: data.turf.images && data.turf.images.length > 0 
              ? data.turf.images[data.turf.mainImageIndex || 0] || data.turf.images[0]
              : data.turf.image,
            priceRange: this.calculatePriceRange(data.turf),
            isBackendTurf: true
          }
        };
      }
      return { success: false, message: 'Turf not found' };
    } catch (error) {
      console.error('TurfService: Get turf by ID error:', error);
      return { success: false, message: error.message };
    }
  }

  // Get turf availability
  async getTurfAvailability(turfId, date) {
    try {
      const response = await fetch(`${this.baseURL}/${turfId}/availability/${date}`);
      return await response.json();
    } catch (error) {
      console.error('Get availability error:', error);
      return { success: false, message: 'Failed to fetch availability' };
    }
  }

  // Calculate price range from field configurations
  calculatePriceRange(turf) {
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
  }

  // Removed local availability fallback for DB-only mode

  // Search turfs
  async searchTurfs(searchQuery, filters = {}) {
    const searchFilters = {
      ...filters,
      search: searchQuery
    };
    
    return this.getAllTurfs(searchFilters);
  }

  // Filter turfs by field type
  async getTurfsByFieldType(fieldType) {
    return this.getAllTurfs({ fieldType });
  }

  // Get turfs by location
  async getTurfsByLocation(city) {
    return this.getAllTurfs({ city });
  }

  // Get turfs by price range
  async getTurfsByPriceRange(minPrice, maxPrice) {
    return this.getAllTurfs({ minPrice, maxPrice });
  }

  // Remove duplicate turfs based on ID and name
  removeDuplicates(turfs) {
    const seen = new Set();
    return turfs.filter(turf => {
      // Create a unique identifier for each turf
      const identifier = `${turf.id}-${turf.name}-${turf.location}`;
      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });
  }
}

export default new TurfService();
