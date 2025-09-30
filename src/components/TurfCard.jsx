import React from "react";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // ✅ Import hook at top

const TurfCard = ({ turf }) => {
  const navigate = useNavigate(); // ✅ Hook at top level

  const handleViewDetails = () => {
    navigate(`/booking/${turf.id}`); // Use navigate inside event handler
  };

  return (
    <div className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-700/50 transition-all duration-300 hover:scale-105">
      <div className="relative">
        <img src={turf.image} alt={turf.name} className="w-full h-48 object-cover" />
        {turf.premium && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            PREMIUM
          </span>
        )}
        <div className="absolute bottom-4 left-4 flex items-center bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <FaStar className="text-yellow-400 mr-1" />
          <span className="font-semibold">{turf.rating}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-1">{turf.name}</h3>
        <p className="text-gray-400 mb-3 flex items-center">
          <FaMapMarkerAlt className="text-cyan-400 mr-2" /> {turf.location}
        </p>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-emerald-400">₹{turf.price}</span>
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
