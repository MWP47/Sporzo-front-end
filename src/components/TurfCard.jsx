import React from "react";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // ✅ Import hook at top

const TurfCard = ({ turf }) => {
  const navigate = useNavigate(); // ✅ Hook at top level

  // Safety check for turf object
  if (!turf) {
    return null;
  }

  const handleViewDetails = () => {
    // Handle both MongoDB ObjectId (_id) and numeric id
    const turfId = turf._id || turf.turfId || turf.id;
    console.log('TurfCard: Navigating to turf details, ID:', turfId);
    navigate(`/booking/${turfId}`);
  };

  const getPriceRange = () => {
    // Use pre-calculated price range if available
    if (turf.priceRange && turf.priceRange.min !== undefined && turf.priceRange.max !== undefined) {
      return turf.priceRange;
    }
    
    // Check if turf has field configurations with pricing
    if (turf.fieldConfigurations && turf.fieldConfigurations.length > 0) {
      const allPrices = [];
      
      turf.fieldConfigurations.forEach(config => {
        const pricing = config.pricing || {};
        if (pricing.dayPrice && !isNaN(pricing.dayPrice)) allPrices.push(parseInt(pricing.dayPrice));
        if (pricing.nightPrice && !isNaN(pricing.nightPrice)) allPrices.push(parseInt(pricing.nightPrice));
        if (pricing.peakPrice && !isNaN(pricing.peakPrice)) allPrices.push(parseInt(pricing.peakPrice));
        
        // Fallback to legacy price
        if (allPrices.length === 0 && config.price && !isNaN(config.price)) {
          allPrices.push(parseInt(config.price));
        }
      });
      
      if (allPrices.length > 0) {
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);
        return { min: min || 0, max: max || 0 };
      }
    }
    
    // Fallback to turf price with safety check
    const fallbackPrice = turf.price && !isNaN(turf.price) ? parseInt(turf.price) : 0;
    return { min: fallbackPrice, max: fallbackPrice };
  };

  const formatPriceDisplay = () => {
    const range = getPriceRange();
    if (range.min === range.max) {
      return `₹${range.min}`;
    }
    return `₹${range.min} - ₹${range.max}`;
  };

  const getFieldTypesDisplay = () => {
    if (!turf.fieldConfigurations || turf.fieldConfigurations.length === 0) {
      return null;
    }
    
    const types = turf.fieldConfigurations.map(config => config.type).join(', ');
    return types;
  };

  return (
    <div className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:scale-105">
      <div className="relative">
        <img 
          src={turf.image || "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800"} 
          alt={turf.name || "Turf"} 
          className="w-full h-48 object-cover" 
        />
        {turf.premium && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            PREMIUM
          </span>
        )}
        <div className="absolute bottom-4 left-4 flex items-center bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <FaStar className="text-yellow-400 mr-1" />
          <span className="font-semibold">{turf.rating && !isNaN(turf.rating) ? turf.rating.toFixed(1) : '0.0'}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-1">{turf.name || "Unknown Turf"}</h3>
        <p className="text-gray-400 mb-2 flex items-center">
          <FaMapMarkerAlt className="text-cyan-400 mr-2" /> {turf.location || "Unknown Location"}
        </p>
        
        {/* Field Types */}
        {getFieldTypesDisplay() && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {turf.fieldConfigurations.map((config, index) => (
                <span
                  key={index}
                  className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-medium border border-emerald-500/30"
                >
                  {config.type}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-emerald-400">{formatPriceDisplay()}</span>
            <span className="text-gray-400 text-sm ml-1">/ hour</span>
          </div>
          <button
            onClick={handleViewDetails} // ✅ Use event handler
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurfCard;
